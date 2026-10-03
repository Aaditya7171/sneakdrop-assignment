import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Mode = "login" | "register";

type Props = {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (email: string, password: string) => Promise<void>;
};

export function AuthForm({ onLogin, onRegister }: Props) {
    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            if (mode === "login") {
                await onLogin(email, password);
            } else {
                await onRegister(email, password);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    function toggleMode() {
        setMode((m) => (m === "login" ? "register" : "login"));
        setError("");
    }

    return (
        <Card className="w-full max-w-sm border border-gray-200 shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-900">
                    {mode === "login" ? "Sign in" : "Create account"}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="email" className="text-gray-700">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="password" className="text-gray-700">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-violet-700 hover:bg-violet-800 text-white"
                    >
                        {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Sign up"}
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-500">
                    {mode === "login" ? "No account?" : "Have an account?"}{" "}
                    <button
                        onClick={toggleMode}
                        className="text-violet-700 font-medium hover:underline"
                    >
                        {mode === "login" ? "Sign up" : "Sign in"}
                    </button>
                </p>
            </CardContent>
        </Card>
    );
}