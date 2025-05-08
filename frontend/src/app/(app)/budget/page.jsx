
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from '@/context/app-context';
import { format, isValid } from 'date-fns';
import { PiggyBank, Edit3 } from 'lucide-react'; 

export default function BudgetPage() {
  const { 
    budget, 
    currentMonthRawBudget, 
    addOrUpdateCurrentMonthBudget, 
    budgetSpent, 
    budgetRemaining,
    financialDataLoaded, 
    isAuthenticated, 
  } = useAppContext();
  
  const [budgetAmountInput, setBudgetAmountInput] = useState('');
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  useEffect(() => {
    if (isAuthenticated && financialDataLoaded) {
        if (currentMonthRawBudget && currentMonthRawBudget.amount !== undefined) {
            setBudgetAmountInput(currentMonthRawBudget.amount.toString());
            if (!isEditingBudget && currentMonthRawBudget.id) { 
                 setIsEditingBudget(false);
            } else if (!currentMonthRawBudget.id) { 
                 setIsEditingBudget(true);
            }
        } else { 
            setBudgetAmountInput('');
            setIsEditingBudget(true); 
        }
    } else if (!isAuthenticated) { 
        setBudgetAmountInput(budget?.totalBudget?.toString() || ''); 
        setIsEditingBudget(false);
    }
  }, [currentMonthRawBudget, financialDataLoaded, isAuthenticated, isEditingBudget]);


  const handleSaveBudget = () => {
    const amount = parseFloat(budgetAmountInput);
    if (isNaN(amount) || amount < 0) {
      alert("Please enter a valid positive number for the budget.");
      return;
    }
    addOrUpdateCurrentMonthBudget(amount); 
    setIsEditingBudget(false); 
  };

  const handleAdjustBudgetClick = () => {
    setIsEditingBudget(true);
  };

  const handleCancelEdit = () => {
    setIsEditingBudget(false);
    if (currentMonthRawBudget && currentMonthRawBudget.amount !== undefined) {
      setBudgetAmountInput(currentMonthRawBudget.amount.toString());
    } else {
      setBudgetAmountInput('');
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const displayMonth = budget?.month && isValid(budget.month) 
    ? format(budget.month, 'MMMM yyyy') 
    : format(new Date(), 'MMMM yyyy'); 

  if (!financialDataLoaded && isAuthenticated) { 
    return <div className="text-center p-10">Loading budget information...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Monthly Budget</h1>
        {budget && currentMonthRawBudget?.id && !isEditingBudget && (
          <Button variant="outline" onClick={handleAdjustBudgetClick}>
            <Edit3 className="mr-2 h-4 w-4" /> Adjust Budget
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {isEditingBudget ? (currentMonthRawBudget?.id ? 'Adjust Budget for ' : 'Set Budget for ') : 'Budget for '} {displayMonth}
          </CardTitle>
          <CardDescription>
            {isEditingBudget
              ? 'Enter the total amount you plan to spend this month.'
              : 'This is your total allocated budget for the current month.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingBudget ? (
            <div className="space-y-2">
              <Label htmlFor="monthly-budget-amount">Total Monthly Budget Amount</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="monthly-budget-amount"
                  type="number"
                  value={budgetAmountInput}
                  onChange={(e) => setBudgetAmountInput(e.target.value)}
                  placeholder="e.g., 1500.00"
                  className="h-10"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          ) : budget ? ( 
            <div className="space-y-3">
                <div className="text-3xl font-semibold text-primary">
                    {formatCurrency(budget.totalBudget)}
                </div>
                <div className="text-sm text-muted-foreground">
                    Spent: {formatCurrency(budgetSpent)}
                </div>
                <div className={`text-sm font-semibold ${budgetRemaining >= 0 ? 'text-accent' : 'text-destructive'}`}>
                    Remaining: {formatCurrency(budgetRemaining)}
                </div>
            </div>
          ) : ( 
            <p className="text-muted-foreground">No budget set for {displayMonth}. Click "Set Budget" to create one.</p>
          )}
        </CardContent>
        {isEditingBudget && (
          <CardFooter className="flex justify-end gap-2">
            {(currentMonthRawBudget?.id || financialDataLoaded) && <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>}
            <Button onClick={handleSaveBudget}>
              <PiggyBank className="mr-2 h-4 w-4" /> 
              {currentMonthRawBudget?.id ? 'Update Budget' : 'Save Budget'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
