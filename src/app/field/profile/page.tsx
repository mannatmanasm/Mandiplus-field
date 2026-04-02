'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { BadgeCheck, UserRound } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { FieldProfile, getFieldProfile } from '@/features/field/api';

export default function ProfilePage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<FieldProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        setProfile(await getFieldProfile());
      } catch (error: unknown) {
        setError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || 'Failed to load profile'
            : 'Failed to load profile',
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) {
    return <div className="rounded-[2rem] bg-white p-6 text-sm text-slate-600 shadow-sm">Loading profile...</div>;
  }

  if (error || !profile) {
    return <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error || 'Unable to load profile'}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="field-glass overflow-hidden rounded-[2rem]">
        <div className="bg-[linear-gradient(135deg,#fff5e4_0%,#fffaf2_52%,#eef8ef_100%)] px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#fff1df] p-3 text-[#9a3412]">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[#b45309]">
                Profile
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                {profile.user.name}
              </h1>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="field-card-hover mx-6 rounded-2xl border border-[#e7dcc7] bg-white/80 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Mobile</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{profile.user.mobileNumber}</p>
          </div>
          <div className="field-card-hover mx-6 rounded-2xl border border-[#e7dcc7] bg-white/80 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Role</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{profile.role.replace('_', ' ')}</p>
          </div>
          <div className="field-card-hover mx-6 rounded-2xl border border-[#e7dcc7] bg-white/80 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">State</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{profile.user.state}</p>
          </div>
          <div className="field-card-hover mx-6 rounded-2xl border border-[#e7dcc7] bg-white/80 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Working mandi</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {profile.user.mandiName || '-'}
            </p>
          </div>
          <div className="field-card-hover mx-6 rounded-2xl border border-[#e7dcc7] bg-white/80 px-4 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Access</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              {!profile.accessPending ? <BadgeCheck className="h-4 w-4 text-[#16a34a]" /> : null}
              {profile.accessPending ? 'Pending admin assignment' : 'Active'}
            </p>
          </div>
        </div>

        <div className="mt-6 px-6 pb-6">
          <button
            type="button"
            onClick={() => {
              signOut();
              router.push('/login');
            }}
            className="inline-flex items-center justify-center rounded-full bg-[#5b21b6] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4c1d95]"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
