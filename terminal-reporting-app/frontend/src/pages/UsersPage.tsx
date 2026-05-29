import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Pencil } from 'lucide-react';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import type { CreateUserRequest, UpdateUserRequest, User, UserRole } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Администратор',
  USER: 'Пользователь',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateUserRequest>({
    username: '',
    password: '',
    role: 'USER',
  });
  const [editForm, setEditForm] = useState<UpdateUserRequest>({
    password: '',
    role: 'USER',
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await authApi.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setForm({ username: '', password: '', role: 'USER' });
    setEditingId(null);
    setEditForm({ password: '', role: 'USER' });
    setShowForm(false);
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditForm({ password: '', role: user.role });
    setShowForm(true);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.username || !form.password) return;

    try {
      await authApi.createUser(form);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Не удалось создать пользователя');
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) return;

    const payload: UpdateUserRequest = { role: editForm.role };
    if (editForm.password) payload.password = editForm.password;

    try {
      await authApi.updateUser(editingId, payload);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Не удалось обновить пользователя');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пользователя?')) return;

    try {
      await authApi.deleteUser(id);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Не удалось удалить пользователя');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка пользователей..." />;
  }

  return (
    <div>
      <PageHeader
        title="Пользователи"
        subtitle="Управление учётными записями и ролями"
        action={
          <button
            onClick={() => {
              if (showForm && !editingId) resetForm();
              else { setEditingId(null); setForm({ username: '', password: '', role: 'USER' }); setShowForm(!showForm); }
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Добавить пользователя
          </button>
        }
      />

      {showForm && !editingId && (
        <Card className="mb-6" title="Новый пользователь">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" placeholder="Логин" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input-field" required />
            <input type="password" placeholder="Пароль" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" required />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="input-field">
              <option value="USER">Пользователь</option>
              <option value="ADMIN">Администратор</option>
            </select>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Сохранить</button>
          </form>
        </Card>
      )}

      {showForm && editingId && (
        <Card className="mb-6" title="Редактирование пользователя">
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="password" placeholder="Новый пароль (оставьте пустым, чтобы не менять)" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className="input-field" />
            <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })} className="input-field">
              <option value="USER">Пользователь</option>
              <option value="ADMIN">Администратор</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Сохранить</button>
              <button type="button" onClick={resetForm} className="bg-gray-200 dark:bg-slate-700 px-4 py-2 rounded-lg">Отмена</button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-100 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Логин</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Роль</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Создан</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-gray-200 dark:divide-slate-700">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{ROLE_LABELS[user.role]}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => startEdit(user)} className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700">
                        <Pencil className="w-4 h-4" />
                        Изменить
                      </button>
                      {currentUser?.id !== user.id && (
                        <button onClick={() => handleDelete(user.id)} className="inline-flex items-center gap-1 text-red-400 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                          Удалить
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
