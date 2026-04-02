'use client';

import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'fieldPwaAccessToken';

export interface AuthUser {
  id: string;
  name: string;
  mobileNumber: string;
  state: string;
  identity: string | null;
}

export interface AuthResponse {
  message?: string;
  next?: 'LOGIN_VERIFY' | 'REGISTER' | 'HOME';
  accessToken?: string;
  refreshToken?: string;
  user?: AuthUser;
}

export interface FieldAgentRegisterPayload {
  name: string;
  mobileNumber: string;
  state: string;
  workingMandi: string;
}

function decodeTokenUserId(token: string): string | null {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;
    const decoded = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded?.sub || decoded?.userId || null;
  } catch {
    return null;
  }
}

export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setStoredAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  delete axios.defaults.headers.common.Authorization;
}

export async function sendOtp(mobileNumber: string): Promise<AuthResponse> {
  const response = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
    mobileNumber,
  });
  return response.data;
}

export async function verifyOtp(
  mobileNumber: string,
  otp: string,
): Promise<AuthResponse> {
  const response = await axios.post(
    `${API_BASE_URL}/auth/verify-otp`,
    { mobileNumber, otp },
    { withCredentials: true },
  );

  if (response.data?.accessToken) {
    setStoredAuthToken(response.data.accessToken);
  }

  return response.data;
}

export async function registerFieldAgent(
  payload: FieldAgentRegisterPayload,
): Promise<AuthResponse> {
  const response = await axios.post(
    `${API_BASE_URL}/auth/register`,
    {
      ...payload,
      identity: 'FIELD_AGENT',
    },
    { withCredentials: true },
  );

  if (response.data?.accessToken) {
    setStoredAuthToken(response.data.accessToken);
  }

  return response.data;
}

export async function getCurrentUser(token?: string): Promise<AuthUser | null> {
  const activeToken = token || getStoredAuthToken();
  if (!activeToken) return null;

  const userId = decodeTokenUserId(activeToken);
  if (!userId || userId === 'admin') return null;

  const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${activeToken}`,
    },
  });

  return response.data?.data ?? response.data;
}

export function logout() {
  setStoredAuthToken(null);
}
