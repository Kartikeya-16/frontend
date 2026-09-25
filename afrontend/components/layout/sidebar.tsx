"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  ShieldAlert,
  Landmark,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageSquareQuote,
  ReceiptText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { TRANSITION } from "@/lib/motion";
import { LanguageSelector } from "./language-selector";
import { useBackendStatus } from "@/store/backend-status-store";
import { useTranslation } from "@/lib/i18n";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", k: "nav.dashboard" },
  { href: "/twin", icon: Users, label: "Financial Twin", k: "nav.twin" },
  { href: "/statements", icon: ReceiptText, label: "Bank Statements", k: "nav.statements" },
  { href: "/planner", icon: TrendingUp, label: "Smart Planner", k: "nav.planner" },
  { href: "/chat", icon: MessageSquareQuote, label: "AI Sathi", k: "nav.chat" },
  { href: "/scam-shield", icon: ShieldAlert, label: "Scam Shield", k: "nav.scam_shield" },
  { href: "/schemes", icon: Landmark, label: "Government Schemes", k: "nav.schemes" },
  { href: "/settings", icon: Settings, label: "Settings & Privacy", k: "nav.settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isConnected = useBackendStatus((s) => s.isConnected);
  const { t } = useTranslation();

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={TRANSITION.component}
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 left-0 z-40",
          "bg-paper text-ink border-r-[1.5px] border-ink"
        )}
      >
        {/* Brand header */}
        <div className="flex items-center h-16 px-5 border-b-[1.5px] border-ink">
          {!collapsed ? (
            <Link href="/dashboard" className="flex items-baseline gap-1">
              <span className="font-serif text-2xl font-bold tracking-tight text-ink">
                Arthsaathi
              </span>
              <span className="w-2 h-2 rounded-full bg-marigold inline-block ml-0.5" />
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="w-9 h-9 rounded-md bg-ink text-paper font-serif font-bold text-lg flex items-center justify-center mx-auto border-[1.5px] border-ink"
            >
              A
            </Link>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all relative border-[1.5px]",
                  isActive
                    ? "bg-ink text-paper border-ink shadow-[2px_2px_0_0_var(--color-ink)]"
                    : "border-transparent text-ink/75 hover:text-ink hover:bg-ink/5 hover:border-ink/20"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-marigold" : "text-ink/60"
                  )}
                />
                {!collapsed && (
                  <span className="truncate">{t(item.k, item.label)}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Backend Status Indicator */}
        <div className="px-3 py-2 border-t-[1.5px] border-ink flex items-center justify-between text-[11px] font-mono bg-paper">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                isConnected ? "bg-emerald" : "bg-clay animate-pulse"
              )}
            />
            {!collapsed && (
              <span
                className={cn(
                  "truncate font-medium tracking-tight",
                  isConnected ? "text-ink/70" : "text-clay font-bold"
                )}
              >
                {isConnected
                  ? t("status.backend_connected", "Backend Live (8000)")
                  : t("status.backend_disconnected", "Backend Disconnected")}
              </span>
            )}
          </div>
        </div>

        {/* Language Selector */}
        <div className="p-2.5 border-t-[1.5px] border-ink">
          <LanguageSelector collapsed={collapsed} direction="up" align="left" />
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-12 border-t-[1.5px] border-ink text-ink/60 hover:text-ink transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </motion.aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper border-t-[1.5px] border-ink px-2 py-1.5">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2.5 py-1 text-xs rounded transition-colors",
                  isActive
                    ? "text-ink font-semibold"
                    : "text-ink/60 hover:text-ink"
                )}
              >
                <item.icon
                  className={cn("w-4 h-4", isActive ? "text-marigold" : "")}
                />
                <span className="truncate max-w-[64px]">
                  {t(item.k, item.label).split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
