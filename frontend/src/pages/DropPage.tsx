import { useStatus } from "@/hooks/useStatus";
import { StockBanner } from "@/components/drop/StockBanner";
import { HoldCard } from "@/components/drop/HoldCard";
import { QueueCard } from "@/components/drop/QueueCard";
import { ActionBar } from "@/components/drop/ActionBar";
import { Separator } from "@/components/ui/separator";
import * as api from "@/lib/api";

type Props = {
    token: string;
    onLogout: () => void;
};

export function DropPage({ token, onLogout }: Props) {
    const { data, error, refetch } = useStatus(token);

    async function handleBuy() {
        await api.buy(token);
        await refetch();
    }
    async function handlePay() {
        await api.pay(token);
        await refetch();
    }

    async function handleJoinQueue() {
        await api.joinQueue(token);
        await refetch();
    }

    async function handleLeaveQueue() {
        await api.leaveQueue(token);
        await refetch();
    }

    function renderActionSection() {
        if (!data) return null;

        if (data.hold) {
            return (
                <HoldCard
                    holdId={data.hold.holdId}
                    secondsRemaining={data.hold.secondsRemaining}
                    onPay={handlePay}
                />
            );
        }

        if (data.queuePosition !== null) {
            return <QueueCard position={data.queuePosition} onLeave={handleLeaveQueue} />;
        }

        return (
            <ActionBar
                mode={data.stockLeft > 0 ? "buy" : "join-queue"}
                onBuy={handleBuy}
                onJoinQueue={handleJoinQueue}
            />
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <img
                    src="/sneakdrop-logo.png"
                    alt="SneakerDrop"
                    className="h-40 w-auto object-contain"
                />
                <button
                    onClick={onLogout}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                    Sign out
                </button>
            </header>

            <main className="max-w-sm mx-auto px-6 py-8 space-y-6">
                {!data && !error && (
                    <p className="text-center text-gray-400 text-sm py-20">Loading...</p>
                )}

                {error && (
                    <p className="text-center text-red-500 text-sm py-20">{error}</p>
                )}

                {data && (
                    <>
                        <StockBanner stockLeft={data.stockLeft} />
                        <Separator />
                        {renderActionSection()}
                    </>
                )}
            </main>
        </div>
    );
}