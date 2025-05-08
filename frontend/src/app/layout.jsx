
"use client"; 
import React from 'react';
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from "@/context/app-context";
import { StoreProvider } from "@/components/StoreProvider";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, 
      refetchOnWindowFocus: false, 
    },
  },
});

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning={true}>
      <body className={`antialiased`} suppressHydrationWarning={true}>
        <StoreProvider> 
          <QueryClientProvider client={queryClient}>
            <AppProvider>
              {children}
              <Toaster />
            </AppProvider>
          </QueryClientProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
