"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  ReceiptText,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  FileUp,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatINRExact, formatCompact } from "@/lib/format";
import {
  getStatements,
  getStatementTransactions,
  uploadStatement,
  deleteStatement,
} from "@/lib/api/statements";
import type {
  StatementResponse,
  TransactionResponse,
  PaginatedTransactionsResponse,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

function getBankDisplayName(bank: string): { name: string; tag: string; color: string } {
  if (!bank) return { name: "Standard Statement", tag: "GENERIC", color: "bg-ink/10 text-ink border-ink/20" };
  const norm = bank.toUpperCase();
  if (norm === "BANK_1" || norm.includes("HDFC")) {
    return { name: "HDFC Bank", tag: "HDFC", color: "bg-blue-900/10 text-blue-900 border-blue-900/20" };
  }
  if (norm === "BANK_2" || norm.includes("SBI") || norm.includes("STATE BANK")) {
    return { name: "State Bank of India", tag: "SBI", color: "bg-cyan-900/10 text-cyan-900 border-cyan-900/20" };
  }
  if (norm.includes("ICICI")) {
    return { name: "ICICI Bank", tag: "ICICI", color: "bg-orange-900/10 text-orange-900 border-orange-900/20" };
  }
  if (norm.includes("AXIS")) {
    return { name: "Axis Bank", tag: "AXIS", color: "bg-purple-900/10 text-purple-900 border-purple-900/20" };
  }
  if (norm.includes("KOTAK")) {
    return { name: "Kotak Mahindra Bank", tag: "KOTAK", color: "bg-red-900/10 text-red-900 border-red-900/20" };
  }
  if (norm.includes("PNB") || norm.includes("PUNJAB NATIONAL")) {
    return { name: "Punjab National Bank", tag: "PNB", color: "bg-amber-900/10 text-amber-900 border-amber-900/20" };
  }
  if (norm.includes("BARODA") || norm.includes("BOB")) {
    return { name: "Bank of Baroda", tag: "BOB", color: "bg-orange-800/10 text-orange-800 border-orange-800/20" };
  }
  if (norm.includes("CANARA")) {
    return { name: "Canara Bank", tag: "CANARA", color: "bg-yellow-900/10 text-yellow-900 border-yellow-900/20" };
  }
  if (norm.includes("UNION BANK")) {
    return { name: "Union Bank of India", tag: "UNION", color: "bg-red-800/10 text-red-800 border-red-800/20" };
  }
  if (norm.includes("PAYTM")) {
    return { name: "Paytm Payments Bank", tag: "PAYTM", color: "bg-sky-900/10 text-sky-900 border-sky-900/20" };
  }
  if (norm.includes("PHONEPE")) {
    return { name: "PhonePe", tag: "PHONEPE", color: "bg-indigo-900/10 text-indigo-900 border-indigo-900/20" };
  }
  return {
    name: bank,
    tag: bank.slice(0, 7).toUpperCase(),
    color: "bg-ink/10 text-ink border-ink/20",
  };
}

export default function BankStatementsPage() {
  const [statements, setStatements] = useState<StatementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);

  // Paginated Transactions for selected statement
  const [txData, setTxData] = useState<PaginatedTransactionsResponse | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Search & Type Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "debit" | "credit">("all");

  // Upload Modal State
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<StatementResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load Statements
  const fetchAllStatements = async (preferredSelectId?: string) => {
    try {
      setLoading(true);
      const data = await getStatements();
      setStatements(data);

      if (data.length > 0) {
        if (preferredSelectId && data.some((s) => s.id === preferredSelectId)) {
          setSelectedStatementId(preferredSelectId);
        } else if (!selectedStatementId || !data.some((s) => s.id === selectedStatementId)) {
          setSelectedStatementId(data[0].id);
        }
      } else {
        setSelectedStatementId(null);
        setTxData(null);
      }
    } catch (err: any) {
      console.error("Failed to load statements:", err);
      toast.error(err.response?.data?.detail || "Failed to load bank statements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStatements();
  }, []);

  // Fetch transactions when active statement or page changes
  useEffect(() => {
    if (!selectedStatementId) {
      setTxData(null);
      return;
    }

    let isMounted = true;
    const loadTxns = async () => {
      try {
        setTxLoading(true);
        const res = await getStatementTransactions(selectedStatementId, page, pageSize);
        if (isMounted) {
          setTxData(res);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Failed to load transactions:", err);
          toast.error("Failed to load transactions for this statement");
        }
      } finally {
        if (isMounted) setTxLoading(false);
      }
    };

    loadTxns();
    return () => {
      isMounted = false;
    };
  }, [selectedStatementId, page]);

  // Handle active statement switch
  const handleSelectStatement = (id: string) => {
    if (id !== selectedStatementId) {
      setSelectedStatementId(id);
      setPage(1);
      setSearchQuery("");
      setFilterType("all");
    }
  };

  // Selected statement object
  const activeStatement = useMemo(() => {
    return statements.find((s) => s.id === selectedStatementId) || null;
  }, [statements, selectedStatementId]);

  // Filtered transactions (in-page filter on the loaded page items)
  const filteredTransactions = useMemo(() => {
    if (!txData?.items) return [];
    return txData.items.filter((tx) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        tx.narration.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.ref_no && tx.ref_no.toLowerCase().includes(searchQuery.toLowerCase()));

      const debitVal = parseFloat(tx.debit);
      const creditVal = parseFloat(tx.credit);

      const matchesType =
        filterType === "all" ||
        (filterType === "debit" && debitVal > 0) ||
        (filterType === "credit" && creditVal > 0);

      return matchesSearch && matchesType;
    });
  }, [txData?.items, searchQuery, filterType]);

  // Aggregate stats across all statements
  const stats = useMemo(() => {
    const totalStatements = statements.length;
    const totalTransactions = statements.reduce((sum, s) => sum + s.txn_count, 0);
    const reconciledCount = statements.filter((s) => s.reconciled).length;
    const allReconciled = totalStatements > 0 && reconciledCount === totalStatements;

    return {
      totalStatements,
      totalTransactions,
      reconciledCount,
      allReconciled,
    };
  }, [statements]);

  // File drop & select handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setUploadError(null);
    const ext = file.name.toLowerCase().split(".").pop();
    if (!["pdf", "csv", "xlsx", "xls", "png", "jpg", "jpeg", "webp"].includes(ext || "")) {
      setUploadError("Invalid file type. Please upload a PDF, Image (PNG, JPG, WEBP), CSV, or Excel statement.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10 MB limit.");
      return;
    }
    setSelectedFile(file);
  };

  // Submit Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a bank statement file to upload.");
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const result = await uploadStatement(selectedFile, pdfPassword || undefined);

      toast.success(
        `Statement uploaded! ${result.txn_count} transactions imported (${result.skipped_duplicates} duplicate(s) skipped).`,
        { duration: 5000 }
      );

      // Close modal and reset
      setUploadOpen(false);
      setSelectedFile(null);
      setPdfPassword("");

      // Refresh and switch to newly created statement
      await fetchAllStatements(result.id);
    } catch (err: any) {
      console.error("Statement upload error:", err);
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 401) {
        setUploadError("This PDF is password-protected. Please enter your statement password below.");
      } else if (status === 422) {
        setUploadError(
          detail ||
            "Unable to parse this statement layout. Please verify the password or file format."
        );
      } else {
        setUploadError(detail || "Failed to upload and parse statement. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  // Delete Statement
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteStatement(deleteTarget.id);
      toast.success("Statement and associated transactions deleted");
      setDeleteTarget(null);
      await fetchAllStatements();
    } catch (err: any) {
      console.error("Failed to delete statement:", err);
      toast.error(err.response?.data?.detail || "Failed to delete statement");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-[1.5px] border-ink pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-marigold" />
            <span className="font-mono text-xs uppercase tracking-wider text-ink/60 font-semibold">
              Financial Records
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-ink mt-1">
            Bank Statements & Ledger
          </h1>
          <p className="text-sm text-ink/70 mt-1 max-w-2xl font-sans">
            Securely upload and parse HDFC, SBI, or generic bank statements (PDF, CSV, Excel)
            with automated balance verification, PII redaction, and deduplication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => fetchAllStatements(selectedStatementId || undefined)}
            variant="outline"
            size="sm"
            className="border-[1.5px] border-ink bg-paper hover:bg-ink/5"
            disabled={loading}
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setUploadError(null);
              setSelectedFile(null);
              setPdfPassword("");
              setUploadOpen(true);
            }}
            className="bg-ink text-paper hover:bg-ink/90 border-[1.5px] border-ink shadow-[2px_2px_0_0_var(--color-ink)]"
          >
            <Upload className="w-4 h-4 mr-2 text-marigold" />
            Upload Statement
          </Button>
        </div>
      </div>

      {/* ── Metric Highlights ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-paper p-4 rounded border-[1.5px] border-ink shadow-[2px_2px_0_0_var(--color-ink)]">
          <div className="flex items-center justify-between text-ink/60 mb-1">
            <span className="text-xs font-mono font-medium uppercase">Total Statements</span>
            <FileSpreadsheet className="w-4 h-4 text-ink" />
          </div>
          <div className="font-serif text-2xl font-bold text-ink">
            {loading ? <Skeleton className="h-8 w-16" /> : stats.totalStatements}
          </div>
          <span className="text-xs text-ink/60 font-sans">Parsed and archived in ledger</span>
        </div>

        <div className="bg-paper p-4 rounded border-[1.5px] border-ink shadow-[2px_2px_0_0_var(--color-ink)]">
          <div className="flex items-center justify-between text-ink/60 mb-1">
            <span className="text-xs font-mono font-medium uppercase">Extracted Txns</span>
            <ReceiptText className="w-4 h-4 text-marigold" />
          </div>
          <div className="font-serif text-2xl font-bold text-ink">
            {loading ? <Skeleton className="h-8 w-20" /> : stats.totalTransactions}
          </div>
          <span className="text-xs text-ink/60 font-sans">Deduplicated records indexed</span>
        </div>

        <div className="bg-paper p-4 rounded border-[1.5px] border-ink shadow-[2px_2px_0_0_var(--color-ink)]">
          <div className="flex items-center justify-between text-ink/60 mb-1">
            <span className="text-xs font-mono font-medium uppercase">Reconciliation</span>
            {stats.allReconciled ? (
              <CheckCircle2 className="w-4 h-4 text-emerald" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-clay" />
            )}
          </div>
          <div className="font-serif text-2xl font-bold text-ink">
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : stats.totalStatements === 0 ? (
              "—"
            ) : stats.allReconciled ? (
              "100% Balanced"
            ) : (
              `${stats.reconciledCount}/${stats.totalStatements} Reconciled`
            )}
          </div>
          <span className="text-xs text-ink/60 font-sans">
            {stats.allReconciled ? "All balances mathematically verified" : "Audit warning on some statements"}
          </span>
        </div>

        <div className="bg-paper p-4 rounded border-[1.5px] border-ink shadow-[2px_2px_0_0_var(--color-ink)]">
          <div className="flex items-center justify-between text-ink/60 mb-1">
            <span className="text-xs font-mono font-medium uppercase">Data Privacy</span>
            <ShieldCheck className="w-4 h-4 text-emerald" />
          </div>
          <div className="font-serif text-2xl font-bold text-ink flex items-center gap-1.5">
            <span>PII Redacted</span>
          </div>
          <span className="text-xs text-ink/60 font-sans">Account & card numbers masked automatically</span>
        </div>
      </div>

      {/* ── Main Layout: Statements Selector & Transaction Ledger ── */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : statements.length === 0 ? (
        /* Empty State */
        <div className="bg-paper border-[1.5px] border-dashed border-ink/40 rounded-lg p-10 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-marigold/20 border-[1.5px] border-ink flex items-center justify-center mx-auto text-ink">
            <FileUp className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="font-serif text-2xl font-bold text-ink">No bank statements uploaded yet</h2>
            <p className="text-sm text-ink/70 mt-1 font-sans">
              Upload your monthly bank statement to unlock real-time financial tracking, cashflow
              analytics, and automated goal synchronisation.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Badge variant="outline" className="border-ink/20 font-mono text-xs">
              HDFC Bank (PDF / CSV / XLSX)
            </Badge>
            <Badge variant="outline" className="border-ink/20 font-mono text-xs">
              State Bank of India (SBI)
            </Badge>
            <Badge variant="outline" className="border-ink/20 font-mono text-xs">
              Generic Bank CSV & Excel
            </Badge>
            <Badge variant="outline" className="border-ink/20 font-mono text-xs">
              Password-Protected PDFs
            </Badge>
            <Badge variant="outline" className="border-ink/20 font-mono text-xs">
              Images & Passbook Photos (PNG, JPG, WEBP)
            </Badge>
          </div>

          <div>
            <Button
              onClick={() => {
                setUploadError(null);
                setSelectedFile(null);
                setPdfPassword("");
                setUploadOpen(true);
              }}
              className="bg-ink text-paper hover:bg-ink/90 border-[1.5px] border-ink shadow-[2px_2px_0_0_var(--color-ink)]"
            >
              <Upload className="w-4 h-4 mr-2 text-marigold" />
              Upload Your First Statement
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Statements List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink/70">
                Uploaded Statements ({statements.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadOpen(true)}
                className="h-7 text-xs text-ink hover:text-ink hover:bg-ink/5 p-1 px-2"
              >
                + New Upload
              </Button>
            </div>

            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {statements.map((stmt) => {
                const bankInfo = getBankDisplayName(stmt.bank);
                const isSelected = stmt.id === selectedStatementId;

                return (
                  <div
                    key={stmt.id}
                    onClick={() => handleSelectStatement(stmt.id)}
                    className={cn(
                      "p-3.5 rounded border-[1.5px] cursor-pointer transition-all relative text-left",
                      isSelected
                        ? "bg-ink text-paper border-ink shadow-[3px_3px_0_0_var(--color-ink)]"
                        : "bg-paper text-ink border-ink/30 hover:border-ink hover:bg-ink/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2
                          className={cn(
                            "w-4 h-4 shrink-0",
                            isSelected ? "text-marigold" : "text-ink/60"
                          )}
                        />
                        <span className="font-serif font-bold text-base leading-tight">
                          {bankInfo.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {stmt.reconciled ? (
                          <span
                            title="Reconciled: Running balances match arithmetic verification"
                            className={cn(
                              "text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border flex items-center gap-1",
                              isSelected
                                ? "bg-emerald/20 text-emerald-200 border-emerald/40"
                                : "bg-emerald/10 text-emerald border-emerald/30"
                            )}
                          >
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Balanced
                          </span>
                        ) : (
                          <span
                            title="Warning: Discrepancy found in running balance arithmetic"
                            className={cn(
                              "text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border flex items-center gap-1",
                              isSelected
                                ? "bg-clay/20 text-clay-200 border-clay/40"
                                : "bg-clay/10 text-clay border-clay/30"
                            )}
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Mismatch
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(stmt);
                          }}
                          className={cn(
                            "p-1 rounded hover:bg-red-500/20 transition-colors",
                            isSelected ? "text-paper/70 hover:text-paper" : "text-ink/50 hover:text-red-700"
                          )}
                          title="Delete statement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "mt-2 text-xs flex items-center gap-1.5",
                        isSelected ? "text-paper/80" : "text-ink/60"
                      )}
                    >
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span className="font-mono">
                        {stmt.period_start} → {stmt.period_end}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-current/15 flex items-center justify-between text-xs font-mono">
                      <span className={isSelected ? "text-paper/70" : "text-ink/60"}>
                        {stmt.txn_count} transactions
                      </span>
                      <span className={isSelected ? "text-marigold font-semibold" : "text-ink/80"}>
                        {new Date(stmt.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Transaction Ledger & Search */}
          <div className="lg:col-span-8 space-y-4">
            {activeStatement ? (
              <div className="bg-paper border-[1.5px] border-ink rounded p-4 shadow-[2px_2px_0_0_var(--color-ink)] space-y-4">
                {/* Statement Ledger Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-[1.5px] border-ink pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-lg text-ink">
                        {getBankDisplayName(activeStatement.bank).name}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[11px]",
                          activeStatement.reconciled
                            ? "border-emerald/40 text-emerald bg-emerald/5"
                            : "border-clay/40 text-clay bg-clay/5"
                        )}
                      >
                        {activeStatement.reconciled ? "Balanced" : "Arithmetic Mismatch"}
                      </Badge>
                    </div>
                    <p className="text-xs text-ink/60 font-mono mt-0.5">
                      Period: {activeStatement.period_start} to {activeStatement.period_end} ·{" "}
                      {activeStatement.txn_count} total entries
                    </p>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1 bg-ink/5 p-1 rounded border border-ink/20">
                    <button
                      type="button"
                      onClick={() => setFilterType("all")}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded font-medium transition-all",
                        filterType === "all"
                          ? "bg-ink text-paper shadow-sm"
                          : "text-ink/70 hover:text-ink"
                      )}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType("debit")}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded font-medium transition-all",
                        filterType === "debit"
                          ? "bg-ink text-paper shadow-sm"
                          : "text-ink/70 hover:text-ink"
                      )}
                    >
                      Debits
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType("credit")}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded font-medium transition-all",
                        filterType === "credit"
                          ? "bg-ink text-paper shadow-sm"
                          : "text-ink/70 hover:text-ink"
                      )}
                    >
                      Credits
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                  <Input
                    placeholder="Search narration, UPI reference ID, merchant..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm border-[1.5px] border-ink bg-paper"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/50 hover:text-ink"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Transactions Table */}
                <div className="border-[1.5px] border-ink rounded overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-ink text-paper font-mono uppercase tracking-wider text-[11px] border-b border-ink">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Narration / Description</th>
                          <th className="py-2.5 px-3">Ref No</th>
                          <th className="py-2.5 px-3 text-right">Debit</th>
                          <th className="py-2.5 px-3 text-right">Credit</th>
                          <th className="py-2.5 px-3 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/10">
                        {txLoading ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-ink/60">
                              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-ink" />
                              Loading transactions...
                            </td>
                          </tr>
                        ) : filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-ink/60 font-sans">
                              {searchQuery || filterType !== "all"
                                ? "No transactions match your current search and filter."
                                : "No transactions found in this statement."}
                            </td>
                          </tr>
                        ) : (
                          filteredTransactions.map((tx) => {
                            const debitNum = parseFloat(tx.debit);
                            const creditNum = parseFloat(tx.credit);

                            return (
                              <tr key={tx.id} className="hover:bg-ink/5 transition-colors">
                                <td className="py-2.5 px-3 font-mono whitespace-nowrap text-ink/80">
                                  {tx.txn_date}
                                </td>
                                <td className="py-2.5 px-3 font-sans max-w-[280px]">
                                  <div className="font-medium text-ink break-words">
                                    {tx.narration}
                                  </div>
                                  {tx.category && tx.category !== "uncategorized" && (
                                    <span className="inline-block mt-0.5 text-[10px] font-mono text-ink/50 uppercase">
                                      {tx.category}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-ink/60 whitespace-nowrap">
                                  {tx.ref_no ? (
                                    <span className="truncate max-w-[120px] inline-block" title={tx.ref_no}>
                                      {tx.ref_no}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-medium text-clay whitespace-nowrap">
                                  {debitNum > 0 ? (
                                    <span className="inline-flex items-center gap-0.5">
                                      <ArrowDownLeft className="w-3 h-3 inline text-clay/70" />
                                      {formatINRExact(tx.debit)}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald whitespace-nowrap">
                                  {creditNum > 0 ? (
                                    <span className="inline-flex items-center gap-0.5">
                                      <ArrowUpRight className="w-3 h-3 inline text-emerald/70" />
                                      {formatINRExact(tx.credit)}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-semibold text-ink whitespace-nowrap">
                                  {formatINRExact(tx.balance)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {txData && txData.pages > 1 && (
                    <div className="p-3 bg-paper border-t border-ink/20 flex items-center justify-between text-xs font-mono">
                      <span className="text-ink/60">
                        Showing page {txData.page} of {txData.pages} ({txData.total} items)
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1 || txLoading}
                          className="h-7 px-2 border-ink"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                          Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(txData.pages, p + 1))}
                          disabled={page >= txData.pages || txLoading}
                          className="h-7 px-2 border-ink"
                        >
                          Next
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-paper border-[1.5px] border-ink rounded p-8 text-center text-ink/60">
                Select a statement from the left list to view transactions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Statement Upload Modal ── */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg bg-paper border-[1.5px] border-ink shadow-[4px_4px_0_0_var(--color-ink)] p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
              <Upload className="w-5 h-5 text-marigold" />
              Upload Bank Statement
            </DialogTitle>
            <DialogDescription className="text-xs text-ink/70 font-sans">
              Supported formats: <strong>PDF</strong> (digital & scanned OCR), <strong>Images</strong> (PNG, JPG, WEBP), <strong>HDFC</strong>, <strong>SBI</strong>, or standard <strong>CSV / Excel</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                dragActive
                  ? "border-marigold bg-marigold/10"
                  : selectedFile
                  ? "border-emerald bg-emerald/5"
                  : "border-ink/30 hover:border-ink bg-paper"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-1">
                  <div className="w-10 h-10 rounded-full bg-emerald/20 text-emerald border border-emerald/40 flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="font-mono text-sm font-semibold text-ink break-all">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-ink/60 font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Click or drag to change
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-ink/5 border border-ink/20 flex items-center justify-center mx-auto text-ink/70">
                    <FileUp className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium text-ink">
                    Drag and drop statement file or image here, or <span className="underline">browse</span>
                  </div>
                  <div className="text-xs text-ink/50 font-mono">
                    PDF, Images (PNG/JPG/WEBP), CSV, Excel (Maximum 10 MB)
                  </div>
                </div>
              )}
            </div>

            {/* Optional Password Field for Encrypted PDFs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pdf-pass" className="text-xs font-mono font-medium text-ink flex items-center gap-1">
                  <Lock className="w-3 h-3 text-ink/70" />
                  PDF Password (If Encrypted)
                </Label>
                <span className="text-[11px] text-ink/50 font-sans">Optional</span>
              </div>
              <div className="relative">
                <Input
                  id="pdf-pass"
                  type={showPassword ? "text" : "password"}
                  placeholder="e.g. Date of Birth + PAN (HDFC/SBI standard)"
                  value={pdfPassword}
                  onChange={(e) => setPdfPassword(e.target.value)}
                  className="pr-10 h-9 text-sm border-[1.5px] border-ink bg-paper"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-ink/60 font-sans">
                Your password is processed strictly in memory and is <strong>never logged or stored</strong>.
              </p>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="p-3 bg-clay/10 border-[1.5px] border-clay/30 rounded text-xs text-clay flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <DialogFooter className="pt-2 sm:justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadOpen(false)}
                disabled={uploading}
                className="border-ink"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={!selectedFile || uploading}
                className="bg-ink text-paper hover:bg-ink/90 border-[1.5px] border-ink shadow-[2px_2px_0_0_var(--color-ink)]"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin text-marigold" />
                    Parsing & Reconciling...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2 text-marigold" />
                    Process Statement
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md bg-paper border-[1.5px] border-ink shadow-[4px_4px_0_0_var(--color-ink)] p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-ink flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-clay" />
              Delete Statement Record?
            </DialogTitle>
            <DialogDescription className="text-xs text-ink/70 font-sans">
              This will permanently delete the statement from{" "}
              <strong>{deleteTarget ? getBankDisplayName(deleteTarget.bank).name : ""}</strong> (
              {deleteTarget?.period_start} to {deleteTarget?.period_end}) and cascade delete all{" "}
              {deleteTarget?.txn_count} parsed transactions.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="border-ink"
            >
              Keep Statement
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-clay text-paper hover:bg-clay/90 border-[1.5px] border-ink shadow-[2px_2px_0_0_var(--color-ink)]"
            >
              {deleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
