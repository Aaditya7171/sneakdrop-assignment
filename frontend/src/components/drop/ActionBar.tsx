import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
    mode: "buy" | "join-queue";
    onBuy: () => Promise<void>;
    onJoinQueue: () => Promise<void>;
};

export function ActionBar({ mode, onBuy, onJoinQueue }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleAction() {
        setLoading(true);
        setError("");
        try {
            if (mode === "buy") await onBuy();
            else await onJoinQueue();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went Wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-2">
            <Button
                onClick={handleAction}
                disabled={loading}
                size="lg"
                className={`w-full text-white ${mode === "buy"
                    ? "bg-violet-700 hover:bg-violet-800"
                    : "bg-gray-900 hover:bg-gray-800"
                    }`}
            >
                {loading
                    ? "Please wait..."
                    : mode === "buy"
                        ? "Buy Now"
                        : "Join Waiting List"}
            </Button>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}


            <p className="text-xs text-center text-gray-400">
                {mode === "buy" ? (
                    <>
                        You get 5 Mins to pay after clicking{" "}
                        <span className="text-purple-800">Buy Now</span>
                    </>
                ) : (
                    "You'll get an automatic hold when a pair frees up"
                )}
            </p>
        </div >
    );
}