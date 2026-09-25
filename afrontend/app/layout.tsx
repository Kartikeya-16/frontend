import type { Metadata } from "next";
import { DM_Serif_Display, Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { BackendStatusBanner } from "@/components/layout/backend-status-banner";
import { AutoTranslator } from "@/components/layout/auto-translator";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arthsaathi — Your Digital Financial Companion",
  description:
    "AI-powered personal financial companion for Indian users. Manage your Financial Twin, plan smarter, detect scams, and discover government schemes you qualify for.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSerif.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-ink selection:bg-marigold selection:text-ink">
        <TooltipProvider >
          <AutoTranslator />
          <BackendStatusBanner />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "paper-card text-ink bg-paper border-[1.5px] border-ink",
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
