const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Something went wrong");
    return data as T;
}

export const register = (email: string, password: string) =>
    request<{ message: string; userId: number }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });

export const login = (email: string, password: string) =>
    request<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });

export type StatusData = {
    stockLeft: number;
    hold: {
        holdId: number;
        expiresAt: string;
        secondsRemaining: number;
    } | null;
    queuePosition: number | null;
};

export const getStatus = (token: string) =>
    request<StatusData>("/status", {
        headers: { Authorization: `Bearer ${token}` },
    });

export const buy = (token: string) =>
    request<{ message: string; holdId: number; expiresAt: string }>("/shop/buy", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });

export const pay = (token: string) =>
    request<{ message: string; orderId: number }>("/shop/pay", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });

export const joinQueue = (token: string) =>
    request<{ message: string; position: number }>("/queue/join", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });

export const leaveQueue = (token: string) =>
    request<{ message: string }>("/queue/leave", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });