"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { register as registerUser } from "@/lib/api/auth";
import { setTokens } from "@/lib/auth";
import { fadeInUp } from "@/lib/motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useBackendStatus } from "@/store/backend-status-store";

const registerSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterForm) {
    setIsSubmitting(true);
    try {
      await registerUser({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
      });
      toast.success("Account created successfully! Please sign in.");
      router.push("/login");
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
        : err?.message || "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div {...fadeInUp}>
      <div className="paper-card p-7 bg-paper">
        <div className="border-b-[1.5px] border-ink pb-3 mb-5">
          <h2 className="font-serif text-2xl font-bold text-ink">Register</h2>
          <p className="font-mono text-xs uppercase tracking-wider text-ink/60 mt-1">
            Create your living Financial Twin
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name" className="font-mono text-[11px] uppercase tracking-wider text-ink font-semibold">
              Full Name
            </Label>
            <Input
              id="full_name"
              placeholder="e.g. Rahul Sharma"
              autoComplete="name"
              className="border-[1.5px] border-ink rounded bg-paper text-ink font-mono text-xs h-10 focus-visible:ring-marigold"
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="font-mono text-xs text-clay">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="font-mono text-[11px] uppercase tracking-wider text-ink font-semibold">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
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
              placeholder="At least 8 characters"
              className="border-[1.5px] border-ink rounded bg-paper text-ink font-mono text-xs h-10 focus-visible:ring-marigold"
              {...register("password")}
            />
            {errors.password && (
              <p className="font-mono text-xs text-clay">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_password" className="font-mono text-[11px] uppercase tracking-wider text-ink font-semibold">
              Confirm Password
            </Label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="Re-enter password"
              className="border-[1.5px] border-ink rounded bg-paper text-ink font-mono text-xs h-10 focus-visible:ring-marigold"
              {...register("confirm_password")}
            />
            {errors.confirm_password && (
              <p className="font-mono text-xs text-clay">{errors.confirm_password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded border-[1.5px] border-ink bg-ink text-paper hover:bg-marigold hover:text-ink font-mono text-xs uppercase font-bold tracking-wider transition-all shadow-[2px_2px_0_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating Account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-5 text-center font-sans text-xs text-ink/70">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-ink underline underline-offset-4 decoration-marigold hover:text-ink/80"
          >
            Sign in
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
