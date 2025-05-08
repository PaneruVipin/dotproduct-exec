
"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAppContext } from '@/context/app-context';
import { CategoryDialog } from '@/components/category-dialog'; 
import { PlusCircle } from 'lucide-react';

export function TransactionDialog({ isOpen, setIsOpen, transaction }) {
  const { addTransaction, editTransaction, categories } = useAppContext(); 
  const [type, setType] = useState('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(''); 
  const [categoryId, setCategoryId] = useState('');
  const [formError, setFormError] = useState('');
  const [isCategoryDialogForTxOpen, setIsCategoryDialogForTxOpen] = useState(false); 

   const availableCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];
    return categories.filter(cat => cat.type === type);
  }, [categories, type]);


  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        setType(transaction.type || 'expense'); 
        setDescription(transaction.description || '');
        setAmount(transaction.amount ? transaction.amount.toString() : '');
        setCategoryId(transaction.categoryId ? transaction.categoryId.toString() : ''); 
        setFormError('');
      } else {
        setType('expense'); 
        setDescription('');
        setAmount('');
        setCategoryId(''); 
        setFormError('');
      }
    }
  }, [transaction, isOpen]); 


  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }

    if (!categoryId) { 
        setFormError('Please select a category.');
        return;
    }

    const transactionDataPayload = {
      description: description.trim(),
      amount: parsedAmount,
      categoryId: parseInt(categoryId, 10), 
    };

    try {
        if (transaction) {
          editTransaction({ ...transactionDataPayload, id: transaction.id, date: transaction.date, type: transaction.type });
        } else {
          addTransaction(transactionDataPayload); 
        }
        setIsOpen(false); 
    } catch (error) {
        setFormError(error.message || "An error occurred.");
    }
  };

  useEffect(() => {
    if (categoryId) { 
      const currentCategoryIsValid = availableCategories.some(cat => cat.id.toString() === categoryId);
      if (!currentCategoryIsValid) {
          setCategoryId(''); 
      }
    }
  }, [type, categoryId, availableCategories]);


  return (
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{transaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          <DialogDescription>
            {transaction ? 'Update the details of your transaction.' : 'Add a new income or expense entry.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
             <div className="space-y-2">
                <Label>Type (Determines Available Categories)</Label>
                <RadioGroup
                  value={type} 
                  onValueChange={(value) => {
                    setType(value);
                  }}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="r1-tx" />
                    <Label htmlFor="r1-tx">Expense</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="r2-tx" />
                    <Label htmlFor="r2-tx">Income</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Groceries, Salary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                   min="0.01"
                   step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                 <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="category">Category</Label>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsCategoryDialogForTxOpen(true)}
                        className="h-7 px-2 py-1 text-xs"
                    >
                        <PlusCircle className="mr-1 h-3 w-3" /> New
                    </Button>
                 </div>
                 <Select value={categoryId} onValueChange={setCategoryId} required>
                    <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                    {availableCategories.length > 0 ? (
                        availableCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                            </SelectItem>
                        ))
                    ) : (
                         <SelectItem value="disabled-category-tx" disabled>
                           {`No ${type} categories. Add one?`}
                         </SelectItem>
                    )}
                    </SelectContent>
                 </Select>
              </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
            </div>
             <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">{transaction ? 'Save Changes' : 'Add Transaction'}</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <CategoryDialog
        isOpen={isCategoryDialogForTxOpen}
        setIsOpen={setIsCategoryDialogForTxOpen}
        category={null} 
    />
    </>
  );
}
