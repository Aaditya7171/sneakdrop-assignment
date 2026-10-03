import { useState, useEffect, useCallback } from "react";
import * as api from "@/lib/api";

export function useStatus(token: string) {
    const [data, setData] = useState<api.StatusData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        try {
            const result = await api.getStatus(token);
            setData(result);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load status");
        }
    }, [token]);

    useEffect(() => {
        refetch();
        const id = setInterval(refetch, 2000);
        return () => clearInterval(id);
    }, [refetch]);

    return { data, error, refetch };
}