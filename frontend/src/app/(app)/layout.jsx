
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout as logoutAction, checkAuthStatus } from '@/store/authSlice';
import { useAppContext } from '@/context/app-context'; 
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarFooter } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutDashboard, List, PieChart, LogOut, Settings, Banknote, Shapes } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

export default function AppLayout({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const { isAuthenticated, user, isLoading: authIsLoadingRedux } = useSelector((state) => state.auth);
  const { financialDataLoaded: contextFinancialDataLoaded } = useAppContext();
  const [initialAppLoadComplete, setInitialAppLoadComplete] = useState(false);


  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    if (!authIsLoadingRedux && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authIsLoadingRedux, router]);

  useEffect(() => {
    if (contextFinancialDataLoaded && !initialAppLoadComplete && isAuthenticated) {
      setInitialAppLoadComplete(true);
    }
    if (!isAuthenticated && initialAppLoadComplete) {
        setInitialAppLoadComplete(false);
    }
  }, [contextFinancialDataLoaded, initialAppLoadComplete, isAuthenticated]);


  const handleLogout = () => {
    dispatch(logoutAction()); 
    setInitialAppLoadComplete(false); 
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login'); 
  };

  if (authIsLoadingRedux || (isAuthenticated && !initialAppLoadComplete)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!authIsLoadingRedux && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Redirecting to login...</p> 
      </div>
    );
  }


  const isActive = (path) => pathname === path;
  
  const userInitial = user?.first_name ? user.first_name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');
  const userName = user?.first_name || user?.email || 'User';

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-sidebar-border">
           <div className="flex items-center gap-3">
             <Banknote className="h-8 w-8 text-primary" />
             <h1 className="text-xl font-semibold text-foreground group-data-[collapsible=icon]:hidden">BudgetView</h1>
           </div>
        </SidebarHeader>
        <SidebarContent className="flex-1 p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard" passHref legacyBehavior>
                 <SidebarMenuButton isActive={isActive('/dashboard')} tooltip="Dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                 </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <Link href="/transactions" passHref legacyBehavior>
                 <SidebarMenuButton isActive={isActive('/transactions')} tooltip="Transactions">
                    <List />
                    <span>Transactions</span>
                 </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
               <Link href="/budget" passHref legacyBehavior>
                 <SidebarMenuButton isActive={isActive('/budget')} tooltip="Budget">
                    <PieChart />
                    <span>Budget</span>
                 </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <Link href="/categories" passHref legacyBehavior>
                 <SidebarMenuButton isActive={isActive('/categories')} tooltip="Categories">
                    <Shapes />
                    <span>Categories</span>
                 </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
              <SidebarMenuItem>
               <Link href="/settings" passHref legacyBehavior>
                 <SidebarMenuButton isActive={isActive('/settings')} tooltip="Settings">
                    <Settings />
                    <span>Settings</span>
                 </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
           <div className="flex items-center justify-between group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{userName}</span>
              </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
           </div>
           <div className="flex justify-center group-data-[collapsible=icon]:visible group-data-[state=expanded]:hidden">
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Logout</span>
              </Button>
           </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
         <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
             <SidebarTrigger />
              <h1 className="text-lg font-semibold">BudgetView</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
