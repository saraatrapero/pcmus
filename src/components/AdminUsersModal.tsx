import React, { useEffect, useState } from 'react';
import { authService, AuthUser, DIFFICULTY_LABELS, Difficulty, Role } from '../auth/authService';
import { PC_MUS_CHARACTERS } from '../characters';
import { CharacterAvatar } from './CharacterAvatar';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onCurrentUserChanged?: (user: AuthUser) => void;
}

interface FormState {
  username: string;
  displayName: string;
  password: string;
  role: Role;
  difficulty: Difficulty;
  avatarId: string;
  resetLearning: boolean;
}

const emptyForm: FormState = {
  username: '',
  displayName: '',
  password: '',
  role: 'player',
  difficulty: 'medio',
  avatarId: 'tio_gil',
  resetLearning: false,
};

const inputCls =
  'w-full px-2.5 py-2 rounded-lg bg-stone-950/80 border border-stone-700 focus:border-brass-400 text-stone-100 text-sm outline-none';
const labelCls = 'block text-[10px] font-mono font-bold uppercase tracking-wider text-brass-300 mb-0.5';

// Administrator panel: create, edit and delete the people who can play
export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({ isOpen, onClose, currentUser, onCurrentUserChanged }) => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = async () => {
    try {
      setUsers(await authService.listUsers());
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setNotice(null);
      setEditingId(null);
      load();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startNew = () => {
    setForm(emptyForm);
    setEditingId('new');
    setError(null);
    setNotice(null);
  };

  const startEdit = (u: AuthUser) => {
    setForm({
      username: u.username,
      displayName: u.displayName,
      password: '',
      role: u.role,
      difficulty: u.difficulty,
      avatarId: u.avatarId,
      resetLearning: false,
    });
    setEditingId(u.id);
    setError(null);
    setNotice(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (editingId === 'new') {
        const created = await authService.createUser({
          username: form.username,
          password: form.password,
          displayName: form.displayName,
          role: form.role,
          difficulty: form.difficulty,
          avatarId: form.avatarId,
        });
        setNotice(`Usuario «${created.username}» creado.`);
      } else if (editingId) {
        const updated = await authService.updateUser(editingId, {
          username: form.username,
          displayName: form.displayName,
          role: form.role,
          difficulty: form.difficulty,
          avatarId: form.avatarId,
          ...(form.password ? { password: form.password } : {}),
          ...(form.resetLearning ? { resetLearning: true } : {}),
        });
        setNotice(`Usuario «${updated.username}» guardado.`);
        if (updated.id === currentUser.id) onCurrentUserChanged?.(updated);
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (u: AuthUser) => {
    if (confirmDelete !== u.id) {
      setConfirmDelete(u.id);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await authService.deleteUser(u.id);
      setNotice(`Usuario «${u.username}» borrado.`);
      setConfirmDelete(null);
      if (editingId === u.id) setEditingId(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-gradient-to-b from-[#2a1709] to-[#140b05] border border-brass-500/60 rounded-3xl shadow-2xl text-stone-100">
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-800">
          <div>
            <h2 className="font-serif font-black text-xl text-brass-300">👥 Usuarios del juego</h2>
            <p className="text-[11px] text-stone-400">Solo el administrador puede crear, editar y borrar usuarios.</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white text-lg font-bold px-2.5 py-1 rounded-lg bg-stone-800" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-5 space-y-3">
          {error && <div role="alert" className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-600/70 text-rose-200 text-xs font-bold">{error}</div>}
          {notice && <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-600/70 text-emerald-200 text-xs font-bold">{notice}</div>}

          {editingId ? (
            <form onSubmit={save} className="p-4 rounded-2xl bg-black/30 border border-stone-700 space-y-3">
              <h3 className="font-serif font-black text-brass-300">
                {editingId === 'new' ? '➕ Nuevo usuario' : `✏️ Editar «${form.username}»`}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Usuario (para entrar)</label>
                  <input className={inputCls} value={form.username} onChange={(e) => set('username', e.target.value)} autoComplete="off" required />
                </div>
                <div>
                  <label className={labelCls}>Nombre en la mesa</label>
                  <input className={inputCls} value={form.displayName} onChange={(e) => set('displayName', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>{editingId === 'new' ? 'Contraseña' : 'Nueva contraseña (opcional)'}</label>
                  <input
                    className={inputCls}
                    type="text"
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    autoComplete="new-password"
                    placeholder={editingId === 'new' ? 'Mínimo 6 caracteres' : 'Déjala vacía para no cambiarla'}
                    required={editingId === 'new'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Rol</label>
                    <select className={inputCls} value={form.role} onChange={(e) => set('role', e.target.value as Role)}>
                      <option value="player">Jugador</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Nivel</label>
                    <select className={inputCls} value={form.difficulty} onChange={(e) => set('difficulty', e.target.value as Difficulty)}>
                      {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
                        <option key={d} value={d}>
                          {DIFFICULTY_LABELS[d]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Personaje</label>
                <div className="flex flex-wrap gap-1.5">
                  {PC_MUS_CHARACTERS.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => set('avatarId', c.id)}
                      className={`rounded-xl p-0.5 border-2 ${form.avatarId === c.id ? 'border-brass-400' : 'border-transparent opacity-70 hover:opacity-100'}`}
                      title={c.name}
                    >
                      <CharacterAvatar characterId={c.id} characterName={c.name} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
              {editingId !== 'new' && (
                <label className="flex items-center gap-2 text-xs text-stone-300">
                  <input type="checkbox" checked={form.resetLearning} onChange={(e) => set('resetLearning', e.target.checked)} />
                  Borrar lo que la IA ha aprendido de este usuario
                </label>
              )}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-sm font-bold">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-gradient-to-b from-brass-400 to-brass-600 text-stone-950 text-sm font-extrabold disabled:opacity-60"
                >
                  {busy ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={startNew}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-brass-500/60 text-brass-300 hover:bg-brass-500/10 font-bold text-sm"
            >
              ➕ Crear usuario
            </button>
          )}

          <ul className="divide-y divide-stone-800 rounded-2xl border border-stone-800 overflow-hidden">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 bg-black/20">
                <CharacterAvatar characterId={u.avatarId} characterName={u.displayName} size="sm" />
                <div className="flex-1 min-w-[140px]">
                  <div className="font-bold text-sm text-stone-100">
                    {u.displayName}{' '}
                    <span className="text-stone-500 font-mono text-xs">@{u.username}</span>
                    {u.id === currentUser.id && <span className="ml-1 text-[10px] text-emerald-400 font-mono">(tú)</span>}
                  </div>
                  <div className="text-[11px] text-stone-400 font-mono">
                    {u.role === 'admin' ? '👑 Administrador' : '🎴 Jugador'} · Nivel {DIFFICULTY_LABELS[u.difficulty]}
                    {u.lastLoginAt ? ` · última entrada ${new Date(u.lastLoginAt).toLocaleDateString('es-ES')}` : ' · nunca ha entrado'}
                  </div>
                </div>
                <button onClick={() => startEdit(u)} className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-bold">
                  Editar
                </button>
                <button
                  onClick={() => remove(u)}
                  disabled={busy || u.id === currentUser.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 ${
                    confirmDelete === u.id ? 'bg-red-600 text-white' : 'bg-stone-800 hover:bg-red-900/70 text-rose-200'
                  }`}
                  title={u.id === currentUser.id ? 'No puedes borrar tu propio usuario' : 'Borrar usuario'}
                >
                  {confirmDelete === u.id ? '¿Seguro? Borrar' : 'Borrar'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
