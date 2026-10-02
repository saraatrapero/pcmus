import React, { useState } from 'react';
import { authService, AuthUser } from '../auth/authService';
import { sound } from '../sound';

interface LoginScreenProps {
  onLoggedIn: (user: AuthUser) => void;
  initialError?: string | null;
}

// Access control: nobody plays without an account created by the administrator
export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoggedIn, initialError = null }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!username.trim() || !password) {
      setError('Escribe tu usuario y tu contraseña.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const user = await authService.login(username.trim(), password);
      sound.playVictory();
      onLoggedIn(user);
    } catch (err) {
      setError((err as Error).message);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-gradient-to-b from-[#2a1709] to-[#140b05] border border-brass-500/60 rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(243,214,140,0.15)]"
      >
        <div className="text-center mb-5">
          <div className="text-4xl mb-1" aria-hidden="true">🃏</div>
          <h1 className="text-4xl font-display font-black tracking-[0.12em] bg-gradient-to-b from-brass-300 via-brass-400 to-brass-600 bg-clip-text text-transparent">
            PC MUS
          </h1>
          <p className="text-sm text-stone-300 font-serif italic mt-1">Entra con tu usuario para jugar</p>
        </div>

        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brass-300 mb-1" htmlFor="login-user">
          Usuario
        </label>
        <input
          id="login-user"
          autoFocus
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 px-3 py-2.5 rounded-xl bg-stone-950/80 border border-stone-700 focus:border-brass-400 text-stone-100 outline-none"
          placeholder="Tu usuario"
        />

        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brass-300 mb-1" htmlFor="login-pass">
          Contraseña
        </label>
        <div className="relative mb-2">
          <input
            id="login-pass"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 pr-20 rounded-xl bg-stone-950/80 border border-stone-700 focus:border-brass-400 text-stone-100 outline-none"
            placeholder="••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-stone-400 hover:text-brass-300 px-2 py-1"
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-3 p-2.5 rounded-xl bg-rose-950/80 border border-rose-600/70 text-rose-200 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full py-3 rounded-xl bg-gradient-to-b from-brass-400 to-brass-600 hover:from-brass-300 hover:to-brass-500 text-stone-950 font-mono font-extrabold uppercase tracking-wide text-base border border-black/50 shadow-[0_3px_0_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.22)] disabled:opacity-60"
        >
          {busy ? 'Entrando...' : 'Entrar a la taberna'}
        </button>

        <p className="mt-4 text-[11px] text-stone-500 text-center">
          ¿No tienes usuario? Pídeselo al administrador del juego.
        </p>
      </form>
    </div>
  );
};
