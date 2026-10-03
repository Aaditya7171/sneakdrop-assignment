import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/pages/AuthPage";
import { DropPage } from "@/pages/DropPage";

function App() {
  const { token, login, register, logout } = useAuth();

  if (!token) {
    return <AuthPage onLogin={login} onRegister={register} />;
  }

  return <DropPage token={token} onLogout={logout} />;
}

export default App;