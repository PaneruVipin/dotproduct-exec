
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppContext } from '@/context/app-context';
import { Edit, Trash2, PlusCircle, PackagePlus, Shapes } from 'lucide-react';
import { CategoryDialog } from '@/components/category-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function CategoriesPage() {
  const { categories, deleteCategory, financialDataLoaded, isAuthenticated } = useAppContext();
  const [editingCategory, setEditingCategory] = useState(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const handleEditCategoryClick = (category) => {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const handleAddCategoryClick = () => {
    setEditingCategory(null); 
    setIsCategoryDialogOpen(true);
  };

  const sortedCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  if (!financialDataLoaded && isAuthenticated) {
    return <div className="text-center p-10">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center">
            <Shapes className="mr-2 h-7 w-7" /> Manage Categories
        </h1>
        <Button onClick={handleAddCategoryClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Your Categories</CardTitle>
          <CardDescription>View, edit, or delete your income and expense categories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedCategories.length > 0 ? (
            sortedCategories.map((cat) => (
              <div key={cat.id} className="p-4 border rounded-lg flex justify-between items-center bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center">
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{cat.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditCategoryClick(cat)} className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit Category</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete Category</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category "{cat.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this category? This action cannot be undone.
                          Make sure no transactions are assigned to this category before deleting.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCategory(cat.id)} className="bg-destructive hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">
              {financialDataLoaded ? "No categories found. Add some to get started!" : "Loading categories..."}
            </p>
          )}
        </CardContent>
        {financialDataLoaded && sortedCategories.length === 0 && (
             <CardFooter>
                <Button onClick={handleAddCategoryClick} className="w-full">
                    <PackagePlus className="mr-2 h-4 w-4" /> Add Your First Category
                </Button>
             </CardFooter>
        )}
      </Card>

      <CategoryDialog
        isOpen={isCategoryDialogOpen}
        setIsOpen={setIsCategoryDialogOpen}
        category={editingCategory}
      />
    </div>
  );
}
