import { api } from "./client";
import type {
  StatementResponse,
  StatementUploadResponse,
  PaginatedTransactionsResponse,
} from "@/lib/types";

/**
 * Upload a bank statement file (PDF, CSV, XLSX) with optional password for encrypted PDFs.
 */
export async function uploadStatement(
  file: File,
  password?: string,
  aiKey?: string
): Promise<StatementUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (password && password.trim()) {
    formData.append("password", password.trim());
  }

  // Check passed aiKey or active OpenRouter key from localStorage
  const effectiveKey =
    aiKey ||
    (typeof window !== "undefined"
      ? localStorage.getItem("arthsaathi_openrouter_key") || ""
      : "");

  if (effectiveKey && effectiveKey.trim()) {
    formData.append("ai_key", effectiveKey.trim());
  }

  const res = await api.post<StatementUploadResponse>("/statements/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

/**
 * Fetch all statements uploaded by the authenticated user.
 */
export async function getStatements(): Promise<StatementResponse[]> {
  const res = await api.get<StatementResponse[]>("/statements");
  return res.data;
}

/**
 * Fetch paginated transactions for a specific statement.
 */
export async function getStatementTransactions(
  statementId: string,
  page = 1,
  size = 50
): Promise<PaginatedTransactionsResponse> {
  const res = await api.get<PaginatedTransactionsResponse>(
    `/statements/${statementId}/transactions`,
    {
      params: { page, size },
    }
  );
  return res.data;
}

/**
 * Delete a statement and cascade delete all its transactions.
 */
export async function deleteStatement(statementId: string): Promise<void> {
  await api.delete(`/statements/${statementId}`);
}
