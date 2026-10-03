import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/pages/AuthPage";

function App() {
  const { token, login, register, logout } = useAuth();

  if (!token) {
    return <AuthPage onLogin={login} onRegister={register} />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-900 font-semibold">Logged in ✓</p>
        <button
          onClick={logout}
          className="mt-2 text-sm text-violet-700 hover:underline"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default App;