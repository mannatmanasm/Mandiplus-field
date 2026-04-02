'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  CalendarDays,
  CirclePlus,
  ClipboardList,
  House,
  LayoutGrid,
  LogOut,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

const navigation = [
  { name: 'Overview', href: '/field', icon: House },
  { name: 'Add Lead', href: '/field/add-lead', icon: CirclePlus },
  { name: 'Leads', href: '/field/my-leads', icon: ClipboardList },
  { name: 'Meetings', href: '/field/meetings', icon: CalendarDays },
  { name: 'Profile', href: '/field/profile', icon: UserRound },
];

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

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

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
            {navigation.map((item) => {
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
          <main className="min-w-0 flex-1 px-3 py-4 pb-24 sm:px-5 sm:py-5 lg:px-8 lg:pb-10">
            {children}
          </main>
        </div>
      </div>

      <nav className="field-glass fixed inset-x-3 bottom-3 z-30 rounded-[1.6rem] px-2 py-2 lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navigation.map((item) => {
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
    </div>
  );
}
