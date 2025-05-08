
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppContext } from '@/context/app-context';

export function CategoryDialog({ isOpen, setIsOpen, category }) {
  const { addCategory, editCategory } = useAppContext(); 
  const [name, setName] = useState('');
  const [categoryType, setCategoryType] = useState('expense'); 
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setCategoryType(category.type || 'expense');
      setFormError('');
    } else {
      setName('');
      setCategoryType('expense');
      setFormError('');
    }
  }, [category, isOpen]); 

   const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
        setFormError('Please enter a category name.');
        return;
    }
    if (!categoryType) {
        setFormError('Please select a category type (income or expense).');
        return;
    }

    const categoryDataPayload = {
      name: name.trim(),
      type: categoryType,
    };

    try {
        if (category) {
          editCategory({ ...categoryDataPayload, id: category.id });
        } else {
          addCategory(categoryDataPayload);
        }
        setIsOpen(false); 
    } catch (error) {
        setFormError(error.message || "An error occurred.");
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {category ? 'Update the details for this category.' : 'Create a new category for your budget.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Groceries, Rent"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Category Type</Label>
                <RadioGroup
                  value={categoryType}
                  onValueChange={setCategoryType}
                  className="flex space-x-4"
                  required
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="type-expense-cat" />
                    <Label htmlFor="type-expense-cat">Expense</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="type-income-cat" />
                    <Label htmlFor="type-income-cat">Income</Label>
                  </div>
                </RadioGroup>
              </div>

                {formError && <p className="text-sm text-destructive">{formError}</p>}
            </div>
             <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">{category ? 'Save Changes' : 'Add Category'}</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
