"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { format, parseISO, getMonth, getYear, startOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useSelector, useDispatch } from "react-redux";
import { checkAuthStatus, logout as logoutAction } from "@/store/authSlice";
import axiosInstance from "@/lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const AppContext = createContext(undefined);

const ITEMS_PER_PAGE = 5; // Default items per page, matches backend if backend has fixed page size

const MOCK_TRANSACTIONS = [
  {
    id: "txn1",
    type: "income",
    description: "Monthly Salary",
    amount: 2500,
    categoryId: "cat-mock-income",
    date: format(new Date(new Date().setDate(1)), "yyyy-MM-dd"),
  },
  {
    id: "txn2",
    type: "expense",
    description: "Weekly Groceries",
    amount: 85.5,
    categoryId: "cat-mock-expense1",
    date: format(new Date(new Date().setDate(2)), "yyyy-MM-dd"),
  },
  {
    id: "txn3",
    type: "expense",
    description: "Movie Tickets",
    amount: 25.0,
    categoryId: "cat-mock-expense2",
    date: format(new Date(new Date().setDate(3)), "yyyy-MM-dd"),
  },
];
const MOCK_CATEGORIES_FOR_LOGGED_OUT = [
  { id: "cat-mock-income", name: "Mock Salary", type: "income" },
  { id: "cat-mock-expense1", name: "Mock Groceries", type: "expense" },
  { id: "cat-mock-expense2", name: "Mock Entertainment", type: "expense" },
];
const MOCK_BUDGET_DEFINITION = {
  id: "budgetMock1",
  month: format(new Date(), "yyyy-MM-dd"),
  amount: "1000.00",
};
const MOCK_DASHBOARD_STATS = {
  month: format(new Date(), "yyyy-MM"),
  budget: 1000.0,
  total_income: 2500.0,
  total_expense: 110.5,
  income_categories: [{ category: "Mock Salary", amount: 2500.0 }],
  expense_categories: [
    { category: "Mock Groceries", amount: 85.5 },
    { category: "Mock Entertainment", amount: 25.0 },
  ],
};

export const AppProvider = ({ children }) => {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const {
    isAuthenticated: isAuthenticatedRedux,
    token: authTokenRedux,
    user: userRedux,
    isLoading: authIsLoadingRedux,
  } = useSelector((state) => state.auth);

  const [transactionFilters, setTransactionFilters] = useState({});
  const [selectedDashboardMonth, setSelectedDashboardMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [currentPage, setCurrentPage] = useState(1);

  const makeAuthenticatedRequest = useCallback(
    async (urlPath, options = {}) => {
      try {
        const response = await axiosInstance({
          url: urlPath,
          method: options.method || "get",
          data: options.body,
          params: options.params,
        });
        return response.data;
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.detail ||
          error.message ||
          "An API error occurred";
        if (error.response?.status !== 401) {
          toast({
            title: "API Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
        throw new Error(errorMessage);
      }
    },
    [toast]
  );

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: () => makeAuthenticatedRequest("/api/categories/"),
    enabled: isAuthenticatedRedux && !!authTokenRedux,
    select: (data) => data?.results || [],
  });
  const baseCategories = categoriesData || [];

  const {
    data: transactionsData,
    isLoading: transactionsDataLoading,
    error: transactionsError,
  } = useQuery({
    queryKey: ["transactions", transactionFilters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (transactionFilters.amount_min)
        params.append("amount_min", transactionFilters.amount_min);
      if (transactionFilters.amount_max)
        params.append("amount_max", transactionFilters.amount_max);
      if (transactionFilters.date_from)
        params.append(
          "date_from",
          format(transactionFilters.date_from, "yyyy-MM-dd")
        );
      if (transactionFilters.date_to)
        params.append(
          "date_to",
          format(transactionFilters.date_to, "yyyy-MM-dd")
        );
      if (transactionFilters.category && transactionFilters.category !== "all")
        params.append("category", transactionFilters.category);
      if (transactionFilters.search)
        params.append("search", transactionFilters.search);
      if (currentPage > 1) params.append("page", currentPage.toString());

      const queryString = params.toString();
      return makeAuthenticatedRequest(
        `/api/transactions/${queryString ? `?${queryString}` : ""}`
      );
    },
    enabled: isAuthenticatedRedux && !!authTokenRedux,
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
  });

  const transactions = useMemo(
    () =>
      (transactionsData?.results || []).map((txn) => ({
        id: txn.id,
        amount: parseFloat(txn.amount),
        description: txn.description,
        date: txn.created_at
          ? format(parseISO(txn.created_at), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
        categoryId: txn.category,
        type: txn.category_detail?.type || "expense",
      })),
    [transactionsData]
  );

  const transactionsCount = transactionsData?.count || 0;
  const transactionsNextPage = transactionsData?.next;
  const transactionsPreviousPage = transactionsData?.previous;
  const totalTransactionPages = Math.ceil(transactionsCount / ITEMS_PER_PAGE); // Assuming backend uses a consistent page size or we define one

  const transactionsLoading = transactionsDataLoading;

  const applyTransactionFilters = useCallback((filters) => {
    setTransactionFilters(filters);
    setCurrentPage(1);
  }, []);

  const goToNextPage = useCallback(() => {
    if (transactionsNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [transactionsNextPage]);

  const goToPreviousPage = useCallback(() => {
    if (transactionsPreviousPage) {
      setCurrentPage((prev) => Math.max(1, prev - 1));
    }
  }, [transactionsPreviousPage]);

  const {
    data: currentMonthRawBudget,
    isLoading: budgetLoading,
    error: budgetError,
  } = useQuery({
    queryKey: ["currentMonthBudget"],
    queryFn: () =>
      makeAuthenticatedRequest("/api/monthly-budgets/current-month/").catch(
        (e) => {
          if (
            e.message.includes("404") ||
            e.message.toLowerCase().includes("not found")
          )
            return null;
          throw e;
        }
      ),
    enabled: isAuthenticatedRedux && !!authTokenRedux,
  });

  const {
    data: dashboardStats,
    isLoading: dashboardStatsLoading,
    error: dashboardStatsError,
  } = useQuery({
    queryKey: ["dashboardStats", selectedDashboardMonth],
    queryFn: () =>
      makeAuthenticatedRequest(`/api/stats/?month=${selectedDashboardMonth}`),
    enabled: isAuthenticatedRedux && !!authTokenRedux,
  });

  const { mutate: addOrUpdateBudgetMutation } = useMutation({
    mutationFn: (amount) => {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount < 0) {
        throw new Error("Budget amount must be a positive number.");
      }
      const payload = { amount: numericAmount.toFixed(2) };
      if (currentMonthRawBudget && currentMonthRawBudget.id) {
        return makeAuthenticatedRequest(
          `/api/monthly-budgets/${currentMonthRawBudget.id}/`,
          { method: "PATCH", body: payload }
        );
      }
      return makeAuthenticatedRequest("/api/monthly-budgets/", {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currentMonthBudget"] });
      queryClient.setQueryData(["currentMonthBudget"], data);
      if (
        data &&
        format(parseISO(data.month), "yyyy-MM") === selectedDashboardMonth
      ) {
        queryClient.invalidateQueries({
          queryKey: ["dashboardStats", selectedDashboardMonth],
        });
      }
      toast({
        title: "Budget Saved",
        description: `Monthly budget processed.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Budget Error",
        description: `Failed to save budget: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const { mutate: addCategoryMutation } = useMutation({
    mutationFn: (categoryData) =>
      makeAuthenticatedRequest("/api/categories/", {
        method: "POST",
        body: { name: categoryData.name, type: categoryData.type },
      }),
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Category Added",
        description: `Category "${newCategory.name}" created.`,
      });
    },
    onError: (error) =>
      toast({
        title: "Category Error",
        description: `Failed to add category: ${error.message}`,
        variant: "destructive",
      }),
  });

  const { mutate: editCategoryMutation } = useMutation({
    mutationFn: (categoryToUpdate) =>
      makeAuthenticatedRequest(`/api/categories/${categoryToUpdate.id}/`, {
        method: "PATCH",
        body: { name: categoryToUpdate.name, type: categoryToUpdate.type },
      }),
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboardStats", selectedDashboardMonth],
      });
      toast({
        title: "Category Updated",
        description: `Category "${updatedCategory.name}" updated.`,
      });
    },
    onError: (error) =>
      toast({
        title: "Category Error",
        description: `Failed to update category: ${error.message}`,
        variant: "destructive",
      }),
  });

  const { mutate: deleteCategoryMutation } = useMutation({
    mutationFn: (id) =>
      makeAuthenticatedRequest(`/api/categories/${id}/`, { method: "DELETE" }),
    onSuccess: (data, id) => {
      const catName =
        baseCategories.find((c) => c.id === id)?.name || "Category";
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Category Deleted",
        description: `Category "${catName}" deleted.`,
      });
    },
    onError: (error) =>
      toast({
        title: "Category Error",
        description: `Failed to delete category: ${error.message}`,
        variant: "destructive",
      }),
  });

  const deleteCategory = useCallback(
    async (id) => {
      const catToDelete = baseCategories.find((c) => c.id === id);
      if (!catToDelete) return;
      const associatedTransactions = transactions.filter(
        (txn) => txn.categoryId === id
      );
      if (associatedTransactions.length > 0) {
        toast({
          title: "Cannot Delete Category",
          description: `Category "${catToDelete.name}" has ${associatedTransactions.length} associated transaction(s). Please reassign or delete them first.`,
          variant: "destructive",
        });
        return;
      }
      deleteCategoryMutation(id);
    },
    [baseCategories, transactions, deleteCategoryMutation, toast]
  );

  const { mutate: addTransactionMutation } = useMutation({
    mutationFn: (transactionData) =>
      makeAuthenticatedRequest("/api/transactions/", {
        method: "POST",
        body: {
          amount: transactionData.amount,
          category: transactionData.categoryId,
          description: transactionData.description || "",
        },
      }),
    onSuccess: (newTransaction) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboardStats", selectedDashboardMonth],
      });
      toast({
        title: "Transaction Added",
        description: `Added ${newTransaction.description || "transaction"}.`,
      });
    },
    onError: (error) =>
      toast({
        title: "Transaction Error",
        description: `Failed to add transaction: ${error.message}`,
        variant: "destructive",
      }),
  });

  const { mutate: editTransactionMutation } = useMutation({
    mutationFn: (updatedTransaction) =>
      makeAuthenticatedRequest(`/api/transactions/${updatedTransaction.id}/`, {
        method: "PATCH",
        body: {
          amount: updatedTransaction.amount,
          category: updatedTransaction.categoryId,
          description: updatedTransaction.description || "",
        },
      }),
    onSuccess: (updatedTransactionData) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboardStats", selectedDashboardMonth],
      });
      toast({
        title: "Transaction Updated",
        description: `Updated "${
          updatedTransactionData.description || "transaction"
        }".`,
      });
    },
    onError: (error) =>
      toast({
        title: "Transaction Error",
        description: `Failed to update transaction: ${error.message}`,
        variant: "destructive",
      }),
  });

  const { mutate: deleteTransactionMutation } = useMutation({
    mutationFn: (id) =>
      makeAuthenticatedRequest(`/api/transactions/${id}/`, {
        method: "DELETE",
      }),
    onSuccess: (data, id) => {
      const txnDesc =
        transactions.find((t) => t.id === id)?.description || "transaction";
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({
        queryKey: ["dashboardStats", selectedDashboardMonth],
      });
      toast({
        title: "Transaction Deleted",
        description: `Deleted "${txnDesc}".`,
      });
    },
    onError: (error) =>
      toast({
        title: "Transaction Error",
        description: `Failed to delete transaction: ${error.message}`,
        variant: "destructive",
      }),
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch(checkAuthStatus());
    }
  }, [dispatch]);

  useEffect(() => {
    if (!authIsLoadingRedux) {
      if (!isAuthenticatedRedux) {
        queryClient.clear();
      } else {
      }
    }
  }, [isAuthenticatedRedux, authIsLoadingRedux, queryClient]);

  const { totalIncome, totalExpenses, balance, categoriesWithSpentData } =
    useMemo(() => {
      if (!isAuthenticatedRedux) {
        const mockIncome = MOCK_TRANSACTIONS.filter(
          (t) => t.type === "income"
        ).reduce((s, t) => s + t.amount, 0);
        const mockExpenses = MOCK_TRANSACTIONS.filter(
          (t) => t.type === "expense"
        ).reduce((s, t) => s + t.amount, 0);
        const mockSpentByCategory = MOCK_TRANSACTIONS.filter(
          (txn) => txn.type === "expense" && txn.categoryId
        ).reduce((acc, txn) => {
          acc[txn.categoryId] = (acc[txn.categoryId] || 0) + txn.amount;
          return acc;
        }, {});
        const mockCatsWithSpent = MOCK_CATEGORIES_FOR_LOGGED_OUT.map((cat) => ({
          ...cat,
          spent: mockSpentByCategory[cat.id] || 0,
        }));
        return {
          totalIncome: mockIncome,
          totalExpenses: mockExpenses,
          balance: mockIncome - mockExpenses,
          categoriesWithSpentData: mockCatsWithSpent,
        };
      }

      const currentMonth = getMonth(new Date());
      const currentYear = getYear(new Date());
      const currentMonthTransactions = transactions.filter((txn) => {
        try {
          const txnDate = parseISO(txn.date);
          return (
            getYear(txnDate) === currentYear &&
            getMonth(txnDate) === currentMonth
          );
        } catch (e) {
          return false;
        }
      });
      const income = currentMonthTransactions
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expenses = currentMonthTransactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      const spentByCategory = currentMonthTransactions
        .filter((txn) => txn.type === "expense" && txn.categoryId)
        .reduce((acc, txn) => {
          acc[txn.categoryId] = (acc[txn.categoryId] || 0) + txn.amount;
          return acc;
        }, {});
      const catsWithSpent = Array.isArray(baseCategories)
        ? baseCategories.map((cat) => ({
            ...cat,
            spent: spentByCategory[cat.id] || 0,
          }))
        : [];

      return {
        totalIncome: income,
        totalExpenses: expenses,
        balance: income - expenses,
        categoriesWithSpentData: catsWithSpent,
      };
    }, [transactions, baseCategories, isAuthenticatedRedux]);

  const budgetForPage = useMemo(() => {
    if (!isAuthenticatedRedux)
      return {
        totalBudget: parseFloat(MOCK_BUDGET_DEFINITION.amount),
        month: parseISO(MOCK_BUDGET_DEFINITION.month),
      };
    if (
      !currentMonthRawBudget ||
      typeof currentMonthRawBudget.amount === "undefined"
    )
      return null;
    return {
      totalBudget: parseFloat(currentMonthRawBudget.amount) || 0,
      month: currentMonthRawBudget.month
        ? parseISO(currentMonthRawBudget.month)
        : startOfMonth(new Date()),
    };
  }, [currentMonthRawBudget, isAuthenticatedRedux]);

  const { budgetSpentForCurrentMonth, budgetRemainingForCurrentMonth } =
    useMemo(() => {
      const bSpent = totalExpenses;
      const bAmount = budgetForPage?.totalBudget || 0;
      return {
        budgetSpentForCurrentMonth: bSpent,
        budgetRemainingForCurrentMonth: bAmount - bSpent,
      };
    }, [totalExpenses, budgetForPage]);

  const getCategoryById = useCallback(
    (id) => {
      let category = Array.isArray(categoriesWithSpentData)
        ? categoriesWithSpentData.find((cat) => cat.id === id)
        : null;
      if (category) return category;
      return Array.isArray(baseCategories)
        ? baseCategories.find((cat) => cat.id === id)
        : null;
    },
    [categoriesWithSpentData, baseCategories]
  );

  const financialDataLoading =
    categoriesLoading || budgetLoading || dashboardStatsLoading; // Note: transactionsDataLoading is handled per page for pagination

  const value = useMemo(() => {
    if (!isAuthenticatedRedux && !authIsLoadingRedux) {
      return {
        isAuthenticated: false,
        user: null,
        budget: {
          totalBudget: parseFloat(MOCK_BUDGET_DEFINITION.amount),
          month: parseISO(MOCK_BUDGET_DEFINITION.month),
        },
        currentMonthRawBudget: MOCK_BUDGET_DEFINITION,
        addOrUpdateCurrentMonthBudget: (amount) =>
          toast({
            title: "Mock Action",
            description: "This is a mock budget update.",
          }),
        budgetSpent: MOCK_DASHBOARD_STATS.total_expense,
        budgetRemaining:
          parseFloat(MOCK_BUDGET_DEFINITION.amount) -
          MOCK_DASHBOARD_STATS.total_expense,
        transactions: MOCK_TRANSACTIONS,
        transactionsLoading: false,
        transactionsCount: MOCK_TRANSACTIONS.length,
        totalTransactionPages: 1,
        currentPage,
        goToNextPage: () => {},
        goToPreviousPage: () => {},
        applyTransactionFilters: (filters) => {},
        addTransaction: (data) =>
          toast({
            title: "Mock Action",
            description: "Transaction added (mock).",
          }),
        editTransaction: (data) =>
          toast({
            title: "Mock Action",
            description: "Transaction edited (mock).",
          }),
        deleteTransaction: (id) =>
          toast({
            title: "Mock Action",
            description: "Transaction deleted (mock).",
          }),
        categories: MOCK_CATEGORIES_FOR_LOGGED_OUT.map((cat) => ({
          ...cat,
          spent: 0,
        })),
        baseCategories: MOCK_CATEGORIES_FOR_LOGGED_OUT,
        addCategory: (data) =>
          toast({
            title: "Mock Action",
            description: "Category added (mock).",
          }),
        editCategory: (data) =>
          toast({
            title: "Mock Action",
            description: "Category edited (mock).",
          }),
        deleteCategory: (id) =>
          toast({
            title: "Mock Action",
            description: "Category deleted (mock).",
          }),
        getCategoryById: (id) =>
          MOCK_CATEGORIES_FOR_LOGGED_OUT.find((cat) => cat.id === id) || null,
        totalIncome: MOCK_DASHBOARD_STATS.total_income,
        totalExpenses: MOCK_DASHBOARD_STATS.total_expense,
        balance:
          MOCK_DASHBOARD_STATS.total_income -
          MOCK_DASHBOARD_STATS.total_expense,
        dashboardStats: MOCK_DASHBOARD_STATS,
        dashboardStatsLoading: false,
        selectedDashboardMonth,
        setSelectedDashboardMonth,
        financialDataLoaded: true,
        makeAuthenticatedRequest,
      };
    }

    return {
      isAuthenticated: isAuthenticatedRedux,
      user: userRedux,
      budget: budgetForPage,
      currentMonthRawBudget: currentMonthRawBudget,
      addOrUpdateCurrentMonthBudget: addOrUpdateBudgetMutation,
      budgetSpent: budgetSpentForCurrentMonth,
      budgetRemaining: budgetRemainingForCurrentMonth,
      transactions,
      transactionsLoading,
      transactionsCount,
      totalTransactionPages,
      currentPage,
      goToNextPage,
      goToPreviousPage,
      applyTransactionFilters,
      addTransaction: addTransactionMutation,
      editTransaction: editTransactionMutation,
      deleteTransaction: deleteTransactionMutation,
      categories: categoriesWithSpentData,
      baseCategories,
      addCategory: addCategoryMutation,
      editCategory: editCategoryMutation,
      deleteCategory,
      getCategoryById,
      totalIncome,
      totalExpenses,
      balance,
      dashboardStats,
      dashboardStatsLoading,
      selectedDashboardMonth,
      setSelectedDashboardMonth,
      financialDataLoaded:
        !authIsLoadingRedux &&
        !financialDataLoading &&
        !!categoriesData &&
        dashboardStats !== undefined,
      makeAuthenticatedRequest,
      errors: {
        categoriesError,
        transactionsError,
        budgetError,
        dashboardStatsError,
      },
    };
  }, [
    isAuthenticatedRedux,
    userRedux,
    authIsLoadingRedux,
    budgetForPage,
    currentMonthRawBudget,
    addOrUpdateBudgetMutation,
    budgetSpentForCurrentMonth,
    budgetRemainingForCurrentMonth,
    transactions,
    transactionsLoading,
    transactionsCount,
    totalTransactionPages,
    currentPage,
    goToNextPage,
    goToPreviousPage,
    applyTransactionFilters,
    addTransactionMutation,
    editTransactionMutation,
    deleteTransactionMutation,
    categoriesWithSpentData,
    baseCategories,
    addCategoryMutation,
    editCategoryMutation,
    deleteCategory,
    getCategoryById,
    totalIncome,
    totalExpenses,
    balance,
    dashboardStats,
    dashboardStatsLoading,
    selectedDashboardMonth,
    setSelectedDashboardMonth,
    financialDataLoading,
    makeAuthenticatedRequest,
    categoriesData,
    categoriesError,
    transactionsError,
    budgetError,
    dashboardStatsError,
    toast,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
