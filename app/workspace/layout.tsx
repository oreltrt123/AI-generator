"use client"
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserDetailContext } from '../../context/UserDetailContext'; // Adjust path
import { AppSidebar } from "./_components/AppSidebar"
import AppHeader from "./_components/AppHeader"
import {
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar"

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = useUser();
  const [userDetail, setUserDetail] = useState(null);

  useEffect(() => {
    if (user) {
      fetch('/api/users', { method: 'POST' }) // Your API route
        .then(res => res.json())
        .then(data => setUserDetail(data.user));
    }
  }, [user]);

  return (
    <SidebarProvider>
      <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
        <AppSidebar />
        <main className="flex-1">
          <AppHeader />
          {children}
        </main>
      </UserDetailContext.Provider>
    </SidebarProvider>
  );
}