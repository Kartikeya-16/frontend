"use client";

import { useEffect } from "react";
import { useBackendStatus } from "@/store/backend-status-store";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackendStatusBanner() {
  const { isConnected, isChecking, checkHealth, apiUrl } = useBackendStatus();

  useEffect(() => {
    // Initial health check on page mount
    checkHealth();

    // Check periodically: every 8s if disconnected, every 30s if connected
    const intervalTime = isConnected ? 30000 : 8000;
    const interval = setInterval(() => {
      checkHealth();
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isConnected, checkHealth]);

  if (isConnected) {
    return null;
  }

  return (
    <div
      role="alert"
      className="bg-clay text-paper border-b-[2px] border-ink px-4 py-2.5 shadow-md relative z-50 transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paper opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-paper"></span>
          </span>
          <AlertTriangle className="w-4 h-4 text-marigold shrink-0" />
          <div className="font-mono text-xs leading-snug">
            <strong className="uppercase tracking-wider font-bold text-paper">
              Backend is not connected:
            </strong>{" "}
            <span className="text-paper/90">
              Unable to reach the Arthsaathi API at{" "}
              <code className="bg-ink/30 px-1.5 py-0.5 rounded text-[11px] font-semibold text-paper border border-paper/30">
                {apiUrl}
              </code>
              . Please start the backend server (
              <code className="bg-ink/30 px-1.5 py-0.5 rounded text-[11px] text-paper">
                uvicorn app.main:app --port 8000
              </code>
              ).
            </span>
          </div>
        </div>

        <button
          onClick={() => checkHealth()}
          disabled={isChecking}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider",
            "border border-ink bg-paper text-ink hover:bg-marigold hover:text-ink transition-colors",
            "shadow-[2px_2px_0_0_var(--color-ink)] shrink-0 disabled:opacity-60 cursor-pointer"
          )}
        >
          <RefreshCw className={cn("w-3 h-3", isChecking && "animate-spin")} />
          {isChecking ? "Checking…" : "Retry Connection"}
        </button>
      </div>
    </div>
  );
}
