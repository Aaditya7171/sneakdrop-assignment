import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Props = {
    holdId: number;
    secondsRemaining: number;
    onPay: () => Promise<void>;
};

export function HoldCard({ holdId, secondsRemaining, onPay }: Props) {
    const [secs, setSecs] = useState(secondsRemaining);
    const [paying, setPaying] = useState(false);
    const [paid, setPaid] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setSecs(secondsRemaining);
    }, [secondsRemaining]);

    useEffect(() => {
        if (secs <= 0) return;
        const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
        return () => clearInterval(id);
    }, [secs]);

    const mins = Math.floor(secs / 60);
    const remainSecs = secs % 60;
    const timeDisplay = `${mins}:${String(remainSecs).padStart(2, "0")}`;

    const progress = Math.round((secs / 300) * 100);

    async function handlePay() {
        setPaying(true);
        setError("");
        try {
            await onPay();
            setPaid(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Payment failed");
        } finally {
            setPaying(false);
        }
    }

    if (paid) {
        return (
            <Card className="border border-violet-200 bg-violet-50">
                <CardContent className="py-6 text-center space-y-1">
                    <p className="text-violet-700 font-semibold">Payment initiated..</p>
                    <p className="text-sm text-gray-500">Confirming in the background....</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border border-violet-200">
            <CardContent className="py-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Hold #{holdId}</p>
                        <p className="text-xs text-gray-400">Pay  before your hold expires</p>
                    </div>
                    <span className={`text-3xl font-mono font-bold ${secs < 60 ? "text-red-500" : "text-violet-700"}`}>
                        {timeDisplay}
                    </span>
                </div>

                <Progress value={progress} className="h-1.5" />

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button
                    onClick={handlePay}
                    disabled={paying || secs === 0}
                    className="w-full bg-violet-700 hover:bg-violet-800 text-white"
                >
                    {paying ? "Processing..." : secs === 0 ? "Hold Expired" : "Pay Now - ₹1999"}
                </Button>
            </CardContent>
        </Card>
    );
}