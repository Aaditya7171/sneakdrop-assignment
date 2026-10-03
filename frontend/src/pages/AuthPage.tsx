import { AuthForm } from "@/components/auth/AuthForm";

type Props = {
    onLogin: (email: string, password: string) => Promise<void>;
    onRegister: (email: string, password: string) => Promise<void>;
};

export function AuthPage({ onLogin, onRegister }: Props) {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
            <div className="mb-8 text-center">
                <img
                    src="/sneakdrop-logo.png"
                    alt="SneakerDrop"
                    className="h-30 w-auto mx-auto mb-3 object-contain"
                />
                <p className="text-sm text-gray-500">
                </p>
            </div>

            <AuthForm onLogin={onLogin} onRegister={onRegister} />
        </div>
    );
}
