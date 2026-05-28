'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  CalendarDays,
  CirclePlus,
  ClipboardList,
  House,
  LayoutGrid,
  LogOut,
  Search,
  Send,
  X,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { createPriorityLead, type PriorityLeadPayload } from '@/features/field/api';
import {
  isOfflineCapableError,
  queuePriorityLead,
} from '@/features/pwa/offlineQueue';

const navigation = [
  { name: 'Overview', href: '/field', icon: House },
  { name: 'Add Lead', href: '/field/add-lead', icon: CirclePlus },
  { name: 'Leads', href: '/field/my-leads', icon: ClipboardList },
  { name: 'Meetings', href: '/field/meetings', icon: CalendarDays },
];

const profileNavigation = {
  name: 'Profile',
  href: '/field/profile',
  icon: UserRound,
};

const commodityOptions = [
  'Tender Coconut',
  'Tomato',
  'Onion',
  'Potato',
  'Ginger',
  'Watermelon',
  'Muskmelon',
  'Mango',
  'Papaya',
  'Pomegranate',
  'Grapes',
  'Orange',
  'Mosambi',
  'Guava',
  'Kiwi',
];

const priorityLeadInitialForm = {
  commodity: '',
  mandiName: '',
  biggestBuyerName: '',
  transporterName: '',
  trucksPerDay: '',
  regionSourceArea: '',
  todayPrice: '',
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export default function ProtectedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [prioritySubmitting, setPrioritySubmitting] = useState(false);
  const [prioritySearch, setPrioritySearch] = useState('');
  const [priorityError, setPriorityError] = useState('');
  const [prioritySuccess, setPrioritySuccess] = useState('');
  const [priorityForm, setPriorityForm] = useState(priorityLeadInitialForm);
  const firstName = user?.name?.split(' ')[0] || 'there';
  const initials =
    user?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'MP';
  const avatarUrl =
    (user as { avatarUrl?: string | null } | null)?.avatarUrl || null;
  const filteredCommodities = useMemo(
    () =>
      commodityOptions.filter((commodity) =>
        commodity.toLowerCase().includes(prioritySearch.trim().toLowerCase()),
      ),
    [prioritySearch],
  );

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (!priorityOpen || typeof window === 'undefined') return;

    const savedDraft = localStorage.getItem('fieldPriorityLeadDraft');
    if (savedDraft) {
      try {
        setPriorityForm({
          ...priorityLeadInitialForm,
          ...JSON.parse(savedDraft),
        });
      } catch {
        // Ignore stale draft data.
      }
    }
  }, [priorityOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasDraft = Object.values(priorityForm).some((value) => value.trim());
    if (hasDraft) {
      localStorage.setItem('fieldPriorityLeadDraft', JSON.stringify(priorityForm));
    } else {
      localStorage.removeItem('fieldPriorityLeadDraft');
    }
  }, [priorityForm]);

  const resetPriorityForm = () => {
    setPriorityForm(priorityLeadInitialForm);
    setPrioritySearch('');
    setPriorityError('');
    setPrioritySuccess('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fieldPriorityLeadDraft');
    }
  };

  const handlePrioritySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPriorityError('');
    setPrioritySuccess('');

    const trucksPerDay = Number(priorityForm.trucksPerDay);
    const todayPrice = Number(priorityForm.todayPrice);

    if (!Number.isInteger(trucksPerDay) || trucksPerDay <= 0) {
      setPriorityError('Trucks per day must be a whole number above 0.');
      return;
    }

    if (!Number.isFinite(todayPrice) || todayPrice < 0) {
      setPriorityError('Today price must be a valid positive number.');
      return;
    }

    const payload: PriorityLeadPayload = {
      commodity: priorityForm.commodity.trim(),
      mandiName: priorityForm.mandiName.trim(),
      biggestBuyerName: priorityForm.biggestBuyerName.trim(),
      transporterName: priorityForm.transporterName.trim(),
      trucksPerDay,
      regionSourceArea: priorityForm.regionSourceArea.trim(),
      todayPrice,
    };

    try {
      setPrioritySubmitting(true);
      await createPriorityLead(payload);
      resetPriorityForm();
      setPrioritySuccess('Mandi data submitted.');
      window.setTimeout(() => {
        setPriorityOpen(false);
        setPrioritySuccess('');
      }, 700);
    } catch (error: unknown) {
      if (isOfflineCapableError(error)) {
        await queuePriorityLead(payload);
        resetPriorityForm();
        setPrioritySuccess('Mandi data saved.');
        window.setTimeout(() => {
          setPriorityOpen(false);
          setPrioritySuccess('');
        }, 900);
        return;
      }

      setPriorityError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || 'Failed to submit mandi data'
          : 'Failed to submit mandi data',
      );
    } finally {
      setPrioritySubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea] text-sm text-slate-600">
        Loading field workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="field-glass hidden w-72 rounded-r-[2rem] px-5 py-6 lg:flex lg:min-h-screen lg:flex-col">
          <div>
            <div className="text-[1.02rem] leading-none">
              <span className="brand-wordmark">
                <span className="brand-mandi">Mandi</span>
                <span className="brand-plus">Plus</span>
                <span className="brand-field">Field</span>
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              Field Troy
            </h1>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#eef8ef] px-3 py-1.5 text-xs font-semibold text-[#166534]">
              <LayoutGrid className="h-3.5 w-3.5" />
              Active
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            {[...navigation, profileNavigation].map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'field-card-hover flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium',
                    active
                      ? 'bg-gradient-to-r from-[#fff1df] to-[#fff8ed] text-[#9a3412] ring-1 ring-[#f59e0b]/35 shadow-[0_16px_28px_-18px_rgba(180,83,9,0.45)]'
                      : 'bg-white/72 text-slate-700 hover:bg-white',
                  )}
                >
                  <item.icon className={cn('h-5 w-5', active && 'text-[#ea580c]')} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => {
              signOut();
              router.push('/login');
            }}
            className="field-card-hover mt-auto flex items-center gap-3 rounded-2xl border border-[#e7dcc7] bg-white/80 px-4 py-3 text-sm font-medium text-slate-700"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header
            className="field-glass sticky top-2 z-40 mx-3 mt-3 rounded-[1.65rem] px-4 pb-3 pt-3 lg:hidden"
            style={{
              paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[0.92rem] leading-none">
                  <span className="brand-wordmark">
                    <span className="brand-mandi">Mandi</span>
                    <span className="brand-plus">Plus</span>
                    <span className="brand-field">Field</span>
                  </span>
                </div>
                <p className="mt-2 truncate text-[1.65rem] font-semibold leading-none tracking-[-0.06em] text-slate-950">
                  Welcome {firstName}
                </p>
              </div>

              <Link
                href={profileNavigation.href}
                aria-label="Open profile"
                className={cn(
                  'relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[#eadfcf] bg-white text-sm font-bold text-[#9a3412] shadow-[0_14px_30px_-20px_rgba(64,40,10,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#fff8ed] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/40 active:scale-95',
                  pathname === profileNavigation.href &&
                    'bg-[#fff2de] ring-1 ring-[#f59e0b]/40',
                )}
              >
                {avatarUrl ? (
                  <span
                    aria-hidden="true"
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url("${avatarUrl}")` }}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </Link>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-3 py-4 pb-24 sm:px-5 sm:py-5 lg:px-8 lg:pb-10">
            {children}
          </main>
        </div>
      </div>

      <nav
        className="field-glass fixed inset-x-3 bottom-3 z-30 rounded-[1.6rem] px-2 py-2 lg:hidden"
        style={{
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="mx-auto grid max-w-md grid-cols-[1fr_1fr_6.4rem_1fr_1fr] items-end gap-1">
          {navigation.slice(0, 2).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-w-0 flex-col items-center justify-center rounded-[1.15rem] px-1 py-1.5 text-[10px] font-medium leading-tight transition',
                  active
                    ? 'bg-gradient-to-b from-[#fff2de] to-[#fff8ed] text-[#9a3412] ring-1 ring-[#f59e0b]/35 shadow-[0_12px_25px_-18px_rgba(180,83,9,0.45)]'
                    : 'text-slate-600',
                )}
              >
                <item.icon className={cn('mb-1 h-[1.05rem] w-[1.05rem] shrink-0', active && 'text-[#ea580c]')} />
                <span className="truncate text-center">
                  {item.name}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setPriorityOpen(true);
              setPriorityError('');
              setPrioritySuccess('');
            }}
            className="group relative -mt-5 flex min-h-[4.9rem] flex-col items-center justify-center rounded-[1.55rem] border border-[#ead7b8] bg-[linear-gradient(145deg,#fffdf8_0%,#fff3d8_58%,#f6c56f_100%)] px-2 text-center text-[9.5px] font-extrabold leading-tight text-[#5f3510] shadow-[0_18px_36px_-22px_rgba(120,72,18,0.55),0_0_0_5px_rgba(255,252,246,0.86)] transition duration-200 hover:-translate-y-0.5 active:scale-95"
            aria-label="Add mandi data"
          >
            <span className="absolute inset-1 rounded-[1.25rem] bg-[linear-gradient(145deg,rgba(255,255,255,0.82),transparent_62%)]" />
            <span className="relative mb-1 grid h-7 w-7 place-items-center rounded-full bg-[#111827] text-lg text-white shadow-[0_10px_18px_-12px_rgba(17,24,39,0.75)]">
              +
            </span>
            <span className="relative max-w-[4.2rem]">Mandi Data</span>
          </button>
          {navigation.slice(2).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-w-0 flex-col items-center justify-center rounded-[1.15rem] px-1 py-1.5 text-[10px] font-medium leading-tight transition',
                  active
                    ? 'bg-gradient-to-b from-[#fff2de] to-[#fff8ed] text-[#9a3412] ring-1 ring-[#f59e0b]/35 shadow-[0_12px_25px_-18px_rgba(180,83,9,0.45)]'
                    : 'text-slate-600',
                )}
              >
                <item.icon className={cn('mb-1 h-[1.05rem] w-[1.05rem] shrink-0', active && 'text-[#ea580c]')} />
                <span className="truncate text-center">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {priorityOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 px-3 pb-3 backdrop-blur-sm lg:hidden">
          <div className="field-glass max-h-[92vh] w-full overflow-hidden rounded-[2rem] shadow-[0_26px_80px_-28px_rgba(15,23,42,0.65)]">
            <div className="flex items-center justify-between border-b border-[#eadfcf] px-5 py-4">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b45309]">
                  Quick action
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                  Mandi Data
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPriorityOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full border border-[#eadfcf] bg-white/80 text-slate-700 transition active:scale-95"
                aria-label="Close mandi data form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handlePrioritySubmit}
              className="max-h-[calc(92vh-5rem)] overflow-y-auto px-5 pb-28 pt-4"
            >
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Commodity</span>
                <div className="rounded-[1.35rem] border border-[#e7dcc7] bg-white/84 p-2">
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      value={prioritySearch}
                      onChange={(event) => setPrioritySearch(event.target.value)}
                      placeholder="Search commodity"
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                  <select
                    required
                    value={priorityForm.commodity}
                    onChange={(event) =>
                      setPriorityForm((prev) => ({
                        ...prev,
                        commodity: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-transparent bg-white px-3 py-3 text-sm font-medium outline-none focus:border-[#ea580c]"
                  >
                    <option value="">Select commodity</option>
                    {filteredCommodities.map((commodity) => (
                      <option key={commodity} value={commodity}>
                        {commodity}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <div className="mt-4 grid gap-4">
                {[
                  ['mandiName', 'Mandi Name', 'text'],
                  ['biggestBuyerName', 'Biggest Buyer Name', 'text'],
                  ['transporterName', 'Transporter Name', 'text'],
                  ['trucksPerDay', 'Trucks Per Day', 'number'],
                  ['regionSourceArea', 'Region / Source Area', 'text'],
                  ['todayPrice', "Today's Price", 'number'],
                ].map(([key, label, type]) => (
                  <label key={key} className="space-y-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {label}
                    </span>
                    <input
                      required
                      type={type}
                      min={type === 'number' ? '0' : undefined}
                      step={key === 'todayPrice' ? '0.01' : '1'}
                      value={priorityForm[key as keyof typeof priorityForm]}
                      onChange={(event) =>
                        setPriorityForm((prev) => ({
                          ...prev,
                          [key]: event.target.value,
                        }))
                      }
                      className="w-full rounded-[1.25rem] border border-[#e7dcc7] bg-white/84 px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                    />
                  </label>
                ))}
              </div>

              {priorityError ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {priorityError}
                </div>
              ) : null}
              {prioritySuccess ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {prioritySuccess}
                </div>
              ) : null}

              <div
                className="fixed inset-x-3 bottom-3 z-10 rounded-[1.55rem] border border-[#eadfcf] bg-[#fffdf8]/95 p-2 backdrop-blur"
                style={{
                  paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
                }}
              >
                <button
                  type="submit"
                  disabled={prioritySubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] bg-[linear-gradient(135deg,#5b21b6_0%,#f59e0b_100%)] px-5 py-4 text-sm font-extrabold text-white shadow-[0_18px_36px_-18px_rgba(91,33,182,0.65)] transition active:scale-[0.98] disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {prioritySubmitting ? 'Submitting...' : 'Submit Mandi Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
