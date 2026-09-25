"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { login } from "@/lib/api/auth";
import { setTokens } from "@/lib/auth";
import { fadeInUp } from "@/lib/motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { useTwinStore } from "@/store/twin-store";
import { useBackendStatus } from "@/store/backend-status-store";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isConnected, isChecking, checkHealth, apiUrl } = useBackendStatus();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setIsSubmitting(true);
    try {
      const tokens = await login(data);
      setTokens(tokens.access_token, tokens.refresh_token);
      toast.success("Signed in successfully!");
      // Fetch user's financial twin data
      await useTwinStore.getState().fetchAllTwinData();
      const profile = useTwinStore.getState().profile;
      if (!profile) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const isConnError = err?.code === "ERR_NETWORK" || !err?.response;
      if (isConnError) {
        useBackendStatus.getState().setConnected(false);
      }
      const msg = isConnError
        ? "Backend server is not connected. Please ensure http://localhost:8000 is running."
        : typeof detail === "string"
        ? detail
        : err?.message || "Invalid email or password.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div {...fadeInUp}>
      <div className="paper-card p-7 bg-paper">
        <div className="border-b-[1.5px] border-ink pb-3 mb-5">
          <h2 className="font-serif text-2xl font-bold text-ink">Sign In</h2>
          <p className="font-mono text-xs uppercase tracking-wider text-ink/60 mt-1">
            Access your Financial Twin & Smart Planner
          </p>
        </div>

        {/* Backend Connection Warning */}
        {!isConnected && (
          <div className="mb-5 p-3.5 rounded border-[1.5px] border-clay bg-clay/10 text-ink space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-clay shrink-0 mt-0.5" />
              <div className="text-xs font-mono">
                <p className="font-bold text-clay uppercase tracking-wider">
                  Backend Is Not Connected
                </p>
                <p className="text-ink/80 mt-0.5">
                  Cannot connect to the API at{" "}
                  <code className="bg-paper px-1 py-0.2 rounded border border-ink/20">
                    {apiUrl}
                  </code>
                  . Ensure your backend server is running on port 8000.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => checkHealth()}
              disabled={isChecking}
              className="w-full py-1.5 rounded border border-ink bg-paper hover:bg-marigold text-ink font-mono text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 shadow-[1px_1px_0_0_var(--color-ink)]"
            >
              <RefreshCw className={cn("w-3 h-3", isChecking && "animate-spin")} />
              {isChecking ? "Checking…" : "Retry Backend Connection"}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="font-mono text-[11px] uppercase tracking-wider text-ink font-semibold">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              autoComplete="email"
              className="border-[1.5px] border-ink rounded bg-paper text-ink font-mono text-xs h-10 focus-visible:ring-marigold"
              {...register("email")}
            />
            {errors.email && (
              <p className="font-mono text-xs text-clay">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-mono text-[11px] uppercase tracking-wider text-ink font-semibold">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="border-[1.5px] border-ink rounded bg-paper text-ink font-mono text-xs h-10 focus-visible:ring-marigold"
              {...register("password")}
            />
            {errors.password && (
              <p className="font-mono text-xs text-clay">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded border-[1.5px] border-ink bg-ink text-paper hover:bg-marigold hover:text-ink font-mono text-xs uppercase font-bold tracking-wider transition-all shadow-[2px_2px_0_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Authenticating…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-5 text-center font-sans text-xs text-ink/70">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-bold text-ink underline underline-offset-4 decoration-marigold hover:text-ink/80"
          >
            Create your Twin
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
