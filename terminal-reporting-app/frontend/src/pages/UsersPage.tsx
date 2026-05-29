import { useEffect, useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import type { CreateUserRequest, User, UserRole } from '../types';
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
  const [form, setForm] = useState<CreateUserRequest>({
    username: '',
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

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.username || !form.password) {
      return;
    }

    try {
      await authApi.createUser(form);
      setForm({ username: '', password: '', role: 'USER' });
      setShowForm(false);
      loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Не удалось создать пользователя');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пользователя?')) {
      return;
    }

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
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Добавить пользователя
          </button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Логин"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              className="input-field"
              required
            />
            <input
              type="password"
              placeholder="Пароль"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="input-field"
              required
            />
            <select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}
              className="input-field"
            >
              <option value="USER">Пользователь</option>
              <option value="ADMIN">Администратор</option>
            </select>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Сохранить
            </button>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                    {ROLE_LABELS[user.role]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-subtle">
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {currentUser?.id !== user.id && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="inline-flex items-center gap-1 text-red-400 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить
                      </button>
                    )}
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
