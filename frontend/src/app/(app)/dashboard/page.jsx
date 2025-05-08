
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from '@/context/app-context';
import { TrendingUp, TrendingDown, Scale, PiggyBank, Ban, CircleDollarSign, CalendarDays, PieChart as PieChartIcon } from 'lucide-react';
import { D3PieChart } from '@/components/d3-pie-chart'; 
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parse } from 'date-fns';
import Link from 'next/link';

const generateChartColor = (index, totalItems) => {
    const hue = (index * 137.508) % 360; 
    const saturation = 70; 
    const lightness = 50;  
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export default function DashboardPage() {
  const { 
    dashboardStats, 
    dashboardStatsLoading, 
    selectedDashboardMonth, 
    setSelectedDashboardMonth,
    financialDataLoaded, 
    isAuthenticated,
  } = useAppContext();

  const [monthInput, setMonthInput] = useState(selectedDashboardMonth);

  useEffect(() => {
    setMonthInput(selectedDashboardMonth);
  }, [selectedDashboardMonth]);

  const handleMonthChange = (e) => {
    setMonthInput(e.target.value);
  };

  const handleApplyMonthFilter = () => {
    if (/^\d{4}-(0[1-9]|1[0-2])$/.test(monthInput)) { 
        setSelectedDashboardMonth(monthInput);
    } else {
        alert("Please enter month in YYYY-MM format.");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const displayMonthFormatted = useMemo(() => {
    if (!selectedDashboardMonth) return "Loading...";
    try {
      const date = parse(selectedDashboardMonth, 'yyyy-MM', new Date());
      return format(date, 'MMMM yyyy');
    } catch (e) {
      return "Invalid Month";
    }
  }, [selectedDashboardMonth]);


  const statBudget = dashboardStats?.budget || 0;
  const statTotalIncome = dashboardStats?.total_income || 0;
  const statTotalExpenses = dashboardStats?.total_expense || 0;
  const statBalance = statTotalIncome - statTotalExpenses;
  const statBudgetRemaining = statBudget - statTotalExpenses; 

  const hasValidBudget = useMemo(() => {
    return dashboardStats && dashboardStats.budget !== null && dashboardStats.budget > 0;
  }, [dashboardStats]);


  const chartDataForExpenses = useMemo(() => {
    if (!dashboardStats?.expense_categories) return [];
    return dashboardStats.expense_categories.map((cat, index) => ({
      name: cat.category,
      value: cat.amount,
      fill: generateChartColor(index, dashboardStats.expense_categories.length),
    }));
  }, [dashboardStats]);

  const chartDataForIncome = useMemo(() => {
    if (!dashboardStats?.income_categories) return [];
    return dashboardStats.income_categories.map((cat, index) => ({
      name: cat.category,
      value: cat.amount,
      fill: generateChartColor(index, dashboardStats.income_categories.length), 
    }));
  }, [dashboardStats]);


  if (isAuthenticated && (!financialDataLoaded || (dashboardStatsLoading && !dashboardStats))) { 
    return <div className="text-center p-10">Loading dashboard data...</div>;
  }
  
  if (!isAuthenticated && financialDataLoaded && !dashboardStats) {
      return <div className="text-center p-10">Displaying mock dashboard data. Please log in.</div>
  }
  
  if (isAuthenticated && financialDataLoaded && !dashboardStats && !dashboardStatsLoading) {
      return <div className="text-center p-10">Could not load dashboard statistics for {displayMonthFormatted}.</div>;
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">Dashboard - {displayMonthFormatted}</h1>
        <div className="flex items-end gap-2">
          <div className='space-y-1'>
            <Label htmlFor="month-select-dashboard">Select Month (YYYY-MM)</Label>
            <Input 
              type="month" 
              id="month-select-dashboard"
              value={monthInput} 
              onChange={handleMonthChange}
              className="w-auto"
              disabled={!financialDataLoaded || dashboardStatsLoading} 
            />
          </div>
          <Button onClick={handleApplyMonthFilter} disabled={!financialDataLoaded || dashboardStatsLoading}>
            <CalendarDays className="mr-2 h-4 w-4" /> Go
            {dashboardStatsLoading && "..."}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{formatCurrency(statTotalIncome)}</div>
            <p className="text-xs text-muted-foreground">For {displayMonthFormatted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(statTotalExpenses)}</div>
             <p className="text-xs text-muted-foreground">For {displayMonthFormatted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${statBalance >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {formatCurrency(statBalance)}
            </div>
             <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <PieChartIcon className="mr-2 h-5 w-5 text-destructive" /> Expense Analysis for {displayMonthFormatted}
            </CardTitle>
            {hasValidBudget && (
              <CardDescription>Breakdown of your expenses compared to your budget.</CardDescription>
            )}
             {!hasValidBudget && financialDataLoaded && (
                <CardDescription>Set a budget to see a detailed expense breakdown.</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {dashboardStatsLoading && !dashboardStats ? (
              <p className="text-muted-foreground text-center py-4">Loading expense data...</p>
            ) : hasValidBudget ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Monthly Budget</span>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(statBudget)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Ban className="h-5 w-5 text-destructive" />
                      <span className="text-sm font-medium">Total Spent</span>
                    </div>
                    <span className="text-sm font-semibold text-destructive">{formatCurrency(statTotalExpenses)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <PiggyBank className="h-5 w-5 text-accent" />
                      <span className="text-sm font-medium">Budget Remaining</span>
                    </div>
                    <span className={`text-sm font-semibold ${statBudgetRemaining >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {formatCurrency(statBudgetRemaining)}
                    </span>
                  </div>
                </div>
                <div className="h-[250px] md:h-[300px] flex items-center justify-center">
                  <D3PieChart 
                    data={chartDataForExpenses} 
                    totalValue={statTotalExpenses}
                    totalLabel="Total Expenses"
                    width={280}
                    height={280}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <PiggyBank className="mx-auto h-12 w-12 text-muted-foreground" data-ai-hint="piggy bank"/>
                <p className="text-muted-foreground">
                  No budget has been set for {displayMonthFormatted}.
                </p>
                <Link href="/budget" passHref>
                  <Button variant="default">
                     Set Monthly Budget
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {dashboardStats && dashboardStats.income_categories && dashboardStats.income_categories.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5 text-accent" /> Income Analysis for {displayMonthFormatted}
              </CardTitle>
              <CardDescription>Breakdown of your income by category.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] md:h-[300px] pt-2 flex items-center justify-center">
                <D3PieChart 
                  data={chartDataForIncome} 
                  totalValue={statTotalIncome}
                  totalLabel="Total Income"
                  width={280}
                  height={280}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
           <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5 text-accent" /> Income Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardStatsLoading ? (
                 <p className="text-muted-foreground">Loading income data...</p>
              ) : (
                 <p className="text-muted-foreground">No income data recorded for {displayMonthFormatted}.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
