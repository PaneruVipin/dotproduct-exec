"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionDialog } from '@/components/transaction-dialog'; 
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAppContext } from '@/context/app-context';
import { format, parseISO } from 'date-fns';
import { PlusCircle, Edit, Trash2, Filter, ArrowUpDown, ArrowDown, ArrowUp, Calendar as CalendarIcon, XCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


const DatePicker = ({ date, setDate, placeholder = "Pick a date", disabled = false }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <Button variant="outline" className="w-full justify-start text-left font-normal text-muted-foreground " disabled><CalendarIcon className="mr-2 h-4 w-4" /> <span>{placeholder}</span></Button>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  );
};


export default function TransactionsPage() {
  const { 
    transactions, 
    transactionsLoading, 
    applyTransactionFilters, 
    deleteTransaction, 
    categories, 
    getCategoryById,
    financialDataLoaded, 
    isAuthenticated,
    transactionsCount,
    totalTransactionPages,
    currentPage,
    goToNextPage,
    goToPreviousPage,
  } = useAppContext();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  const [localFilters, setLocalFilters] = useState({
    searchTerm: '',
    filterCategory: 'all',
    dateFrom: undefined,
    dateTo: undefined,
    amountMin: '',
    amountMax: '',
  });

  const [sortKey, setSortKey] = useState('date'); 
  const [sortDirection, setSortDirection] = useState('desc');

  const handleFilterChange = (filterName, value) => {
    setLocalFilters(prev => ({ ...prev, [filterName]: value }));
  };


  const handleApplyFilters = () => {
    const filtersToApply = {
        search: localFilters.searchTerm,
        category: localFilters.filterCategory,
        date_from: localFilters.dateFrom,
        date_to: localFilters.dateTo,
        amount_min: localFilters.amountMin,
        amount_max: localFilters.amountMax
    };
    Object.keys(filtersToApply).forEach(key => {
        if (filtersToApply[key] === '' || filtersToApply[key] === undefined || filtersToApply[key] === null || (key === 'category' && filtersToApply[key] === 'all')) {
            delete filtersToApply[key];
        }
    });
    applyTransactionFilters(filtersToApply); 
  };

  const handleClearFilters = () => {
    setLocalFilters({
        searchTerm: '',
        filterCategory: 'all',
        dateFrom: undefined,
        dateTo: undefined,
        amountMin: '',
        amountMax: '',
    });
    applyTransactionFilters({}); 
  };
  

  const sortedTransactions = useMemo(() => {
    let sorted = [...transactions]; 

    if (sortKey) {
      sorted.sort((a, b) => { 
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (sortKey === 'categoryId') {
            const catA = getCategoryById(a.categoryId);
            const catB = getCategoryById(b.categoryId);
            valA = catA ? catA.name.toLowerCase() : '';
            valB = catB ? catB.name.toLowerCase() : '';
        } else if (sortKey === 'description') {
            valA = a.description?.toLowerCase() || '';
            valB = b.description?.toLowerCase() || '';
        } else if (sortKey === 'amount'){
            valA = parseFloat(a.amount || 0);
            valB = parseFloat(b.amount || 0);
        }
        
        let comparison = 0;
        if (valA === null || valA === undefined) comparison = -1;
        else if (valB === null || valB === undefined) comparison = 1;
        else if (typeof valA === 'string' && typeof valB === 'string') {
            comparison = valA.localeCompare(valB);
        } else if (valA < valB) comparison = -1;
        else if (valA > valB) comparison = 1;
        
        return sortDirection === 'asc' ? comparison : comparison * -1;
      });
    }
    return sorted;
  }, [transactions, sortKey, sortDirection, getCategoryById]);


  const handleAddClick = () => {
    setEditingTransaction(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

   const handleSort = (key) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
   };

  const renderSortIcon = (key) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="ml-2 h-4 w-4" /> :
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  if (!financialDataLoaded && isAuthenticated) {
    return <div className="text-center p-10">Loading financial data...</div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Transactions</h1>
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </div>

       <Card>
         <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" /> Filters
            </CardTitle>
         </CardHeader>
         <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
                placeholder="Search descriptions..."
                value={localFilters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                disabled={transactionsLoading} 
            />
            <Select value={localFilters.filterCategory} onValueChange={(value) => handleFilterChange('filterCategory', value)} disabled={transactionsLoading || !categories.length}>
                <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
            <DatePicker date={localFilters.dateFrom} setDate={(date) => handleFilterChange('dateFrom', date)} placeholder="Date From" disabled={transactionsLoading} />
            <DatePicker date={localFilters.dateTo} setDate={(date) => handleFilterChange('dateTo', date)} placeholder="Date To" disabled={transactionsLoading} />
            <Input
                type="number"
                placeholder="Min amount"
                value={localFilters.amountMin}
                onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                min="0"
                step="0.01"
                disabled={transactionsLoading}
            />
            <Input
                type="number"
                placeholder="Max amount"
                value={localFilters.amountMax}
                onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                min="0"
                step="0.01"
                disabled={transactionsLoading}
            />
            <div className="lg:col-span-3 flex flex-col sm:flex-row gap-2 justify-end pt-2">
                <Button onClick={handleClearFilters} variant="outline" disabled={transactionsLoading}>
                    <XCircle className="mr-2 h-4 w-4"/> Clear Filters
                </Button>
                <Button onClick={handleApplyFilters} disabled={transactionsLoading}>
                    <Filter className="mr-2 h-4 w-4"/> Apply Filters {transactionsLoading && "..."}
                </Button>
            </div>
         </CardContent>
       </Card>

      <Card>
         <CardContent className="p-0">
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('date')}>
                         <div className="flex items-center">Date {renderSortIcon('date')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('description')}>
                        <div className="flex items-center">Description {renderSortIcon('description')}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('categoryId')}>
                        <div className="flex items-center">Category {renderSortIcon('categoryId')}</div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer hover:bg-muted" onClick={() => handleSort('amount')}>
                       <div className="flex items-center justify-end">Amount {renderSortIcon('amount')}</div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsLoading && sortedTransactions.length === 0 ? ( 
                    <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading transactions...</TableCell></TableRow>
                  ) : sortedTransactions.length > 0 ? (
                    sortedTransactions.map((txn) => {
                        const category = getCategoryById(txn.categoryId); 
                        return (
                           <TableRow key={txn.id}>
                              <TableCell>{txn.date ? format(parseISO(txn.date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                              <TableCell className="font-medium">{txn.description || '-'}</TableCell>
                              <TableCell>
                                {category ? category.name : <span className="text-muted-foreground italic">Uncategorized</span>}
                              </TableCell>
                              <TableCell className={`text-right font-medium ${txn.type === 'income' ? 'text-accent' : 'text-destructive'}`}>
                                {txn.type === 'income' ? '+' : '-'} {formatCurrency(txn.amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(txn)} className="mr-2 h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90 h-8 w-8">
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the transaction
                                        "{txn.description || 'this transaction'}".
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteTransaction(txn.id)} className="bg-destructive hover:bg-destructive/90">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                           </TableRow>
                        );
                     })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        {financialDataLoaded || !isAuthenticated ? "No transactions found. Try adjusting your filters or adding new transactions." : "Loading transactions..."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
         </CardContent>
      </Card>


      {totalTransactionPages > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1 || transactionsLoading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalTransactionPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalTransactionPages || transactionsLoading}
          >
            Next
          </Button>
        </div>
      )}
      {transactions.length === 0 && !transactionsLoading && transactionsCount > 0 && (
         <p className="text-center text-muted-foreground pt-2">
            All filtered transactions are displayed on this page or previous pages.
         </p>
      )}


      <TransactionDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        transaction={editingTransaction}
      />
    </div>
  );
}

