"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { useTwinStore } from "@/store/twin-store";
import { useBackendStatus } from "@/store/backend-status-store";
import { Sidebar } from "./sidebar";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Loader2 } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const fetchAllTwinData = useTwinStore((s) => s.fetchAllTwinData);
  const hasOnboarded = useTwinStore((s) => s.hasOnboarded);
  const isLoading = useTwinStore((s) => s.isLoading);
  const isInitialized = useTwinStore((s) => s.isInitialized);
  const isConnected = useBackendStatus((s) => s.isConnected);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    fetchAllTwinData();
  }, [router, fetchAllTwinData]);

  // Only check onboarding redirect AFTER initial data fetch completes AND backend is reachable
  useEffect(() => {
    if (isInitialized && !isLoading && !hasOnboarded && isAuthenticated() && isConnected) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/onboarding") {
        router.replace("/onboarding");
      }
    }
  }, [isInitialized, isLoading, hasOnboarded, isConnected, router]);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center space-y-3 p-6 rounded border-[1.5px] border-ink bg-paper shadow-[3px_3px_0_0_var(--color-ink)]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-ink" />
          <p className="font-mono text-xs uppercase tracking-wider font-bold text-ink">
            Initializing Financial Twin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main content area, offset by sidebar width */}
      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Floating AI Financial Sathi Widget */}
      <ChatWidget />
    </div>
  );
}
