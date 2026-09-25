import { api } from "./client";
import type { UserCreate, UserLogin, TokenResponse, UserResponse } from "@/lib/types";

export async function register(data: UserCreate): Promise<UserResponse> {
  const res = await api.post<UserResponse>("/auth/register", data);
  return res.data;
}

export async function login(data: UserLogin): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>("/auth/login", data);
  return res.data;
}

export async function refreshToken(refreshTokenValue: string): Promise<TokenResponse> {
  const res = await api.post<TokenResponse>("/auth/refresh", {
    refresh_token: refreshTokenValue,
  });
  return res.data;
}

export async function getMe(): Promise<UserResponse> {
  const res = await api.get<UserResponse>("/auth/me");
  return res.data;
}

