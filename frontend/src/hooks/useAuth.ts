import { useState } from "react";
import * as api from "../lib/api";

const TOKEN_KEY = "sneakdrop_token";

export function useAuth() {
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem(TOKEN_KEY)

    );

    async function handleRegister(email: string, password: string) {
        await api.register(email, password);
        const { token } = await api.login(email, password);
        localStorage.setItem(TOKEN_KEY, token);
        setToken(token);
    }

    async function handleLogin(email: string, password: string) {
        const { token } = await api.login(email, password);
        localStorage.setItem(TOKEN_KEY, token);
        setToken(token);
    }
    function logout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
    }
    return { token, login: handleLogin, register: handleRegister, logout };
}