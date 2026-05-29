import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Ship, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch {
      setError('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-8">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Ship className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-100">TOS</h1>
            <p className="text-sm text-slate-400">Система управления терминалом</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Логин</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="input-field"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="label-field">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-field"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-300 bg-red-950/50 border border-red-800 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-500 disabled:opacity-60 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-500 text-center">
          По умолчанию: admin / admin
        </p>
      </div>
    </div>
  );
}
