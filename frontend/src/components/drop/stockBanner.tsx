import { Badge } from "@/components/ui/badge";

type Props = {
    stockLeft: number;
};

export function StockBanner({ stockLeft }: Props) {
    const inStock = stockLeft > 0;

    return (
        <div className="text-center py-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Pairs Available:
            </p>

            <p className={`text-8xl font-bold tracking-tight ${inStock ? "text-gray-900" : "text-gray-300"}`}>
                {stockLeft}
            </p>

            <p className="text-sm text-gray-400 mt-1">of 20 total</p>

            <div className="mt-3">
                <Badge
                    variant="outline"
                    className={inStock
                        ? "bg-violet-50 text-violet-700 border-violet-200"
                        : "bg-gray-50 text-gray-400 border-gray-200"
                    }
                >
                    {inStock ? "In Stock" : "Sold Out"}
                </Badge>
            </div>
        </div>
    );
}