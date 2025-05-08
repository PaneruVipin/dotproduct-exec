
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSelector } from 'react-redux'; 
import { User, KeyRound } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const user = useSelector((state) => state.auth.user); 

  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : "User Name";
  const userEmail = user ? user.email : "user@example.com";


  const handleProfileUpdate = (e) => {
    e.preventDefault();
    toast({ title: "Profile Update", description: "Profile update feature not yet implemented." });
  };

  const handlePasswordChange = (e) => {
     e.preventDefault();
     toast({ title: "Password Change", description: "Password change feature not yet implemented." });
  };


  if (!user) {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary">Settings</h1>
            <p>Loading user settings...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><User className="h-5 w-5"/> Profile Settings</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue={userName} placeholder="Your Name" />
                 </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={userEmail} placeholder="your.email@example.com" disabled readOnly />
                 </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit">Save Profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><KeyRound className="h-5 w-5"/> Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
           <form onSubmit={handlePasswordChange} className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" required />
                 </div>
                 <div className="space-y-2">
                     <Label htmlFor="confirm-password">Confirm New Password</Label>
                     <Input id="confirm-password" type="password" required />
                </div>
                 <div className="flex justify-end">
                    <Button type="submit">Change Password</Button>
                 </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
