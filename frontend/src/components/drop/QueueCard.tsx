import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
    position: number;
    onLeave: () => Promise<void>;
};

export function QueueCard({ position, onLeave }: Props) {
    const [leaving, setLeaving] = useState(false);
    const [error, setError] = useState("");

    async function handleLeave() {
        setLeaving(true);
        setError("");
        try {
            await onLeave();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to leave queue");
        } finally {
            setLeaving(false);
        }
    }

    return (
        <Card className="border border-gray-200">
            <CardContent className="py-6 text-center space-y-4">
                <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                        Your position
                    </p>
                    <p className="text-6xl font-bold text-gray-900 mt-1">#{position}</p>
                    <p className="text-xs text-gray-400 mt-2">
                        You will automatically get a 5-mins hold when a pair frees up
                    </p>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button
                    variant="outline"
                    onClick={handleLeave}
                    disabled={leaving}
                    className="w-full border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                    {leaving ? "Leaving..." : "Leave Queue"}
                </Button>
            </CardContent>
        </Card>
    );
}