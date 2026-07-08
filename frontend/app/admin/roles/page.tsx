'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Mail, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { PollutionService } from '@/services/pollutionService';
import { User } from '@/types/pollution';

const roles = [
  { value: 'citizen', label: 'Citizen' },
  { value: 'municipality_officer', label: 'Municipality Officer' },
  { value: 'municipality_admin', label: 'Municipality Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

export default function RoleAccessPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('citizen');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user?.role !== 'super_admin') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="max-w-md rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-3 text-lg font-extrabold text-zinc-950 dark:text-white">Superadmin Access Required</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">This role-control panel is not available for your account.</p>
          <button
            onClick={() => router.push('/admin')}
            className="mt-5 rounded-md bg-zinc-950 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setResult(null);

    try {
      const updated = await PollutionService.updateUserRoleByEmail(email, role);
      setResult(updated);
      setEmail('');
      setRole('citizen');
    } catch (err: any) {
      setError(err?.message || 'Unable to update user role.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left text-zinc-900 dark:text-zinc-100">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          <ShieldAlert className="h-4 w-4" />
          Superadmin Controls
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Role Access</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Change an existing account role by verified email address.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="grid gap-5 sm:grid-cols-[1fr_220px]">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="person@example.com"
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-300">
              New Role
            </label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {roles.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {result && (
          <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Role updated
            </div>
            <div className="mt-2 grid gap-2 text-xs text-emerald-800 dark:text-emerald-200 sm:grid-cols-3">
              <span>{result.name}</span>
              <span>{result.email}</span>
              <span className="font-bold">{result.role}</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Update Role'}
          </button>
        </div>
      </form>
    </div>
  );
}
