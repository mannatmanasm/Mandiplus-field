'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ArrowUpRight,
  Calendar,
  CalendarClock,
  ChartColumnBig,
  ClipboardCheck,
  Clock3,
  MapPin,
  MessageSquareWarning,
} from 'lucide-react';
import {
  FieldAppointment,
  FieldDashboardResponse,
  getFieldDashboard,
  getMyFieldMeetings,
} from '@/features/field/api';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

const quickActions = [
  {
    title: 'Add Lead',
    subtitle: 'New customer entry',
    href: '/field/add-lead',
    icon: ClipboardCheck,
  },
  {
    title: 'Meetings',
    subtitle: 'Visits and feedback',
    href: '/field/meetings',
    icon: CalendarClock,
  },
  {
    title: 'Leads',
    subtitle: 'Track submissions',
    href: '/field/my-leads',
    icon: ChartColumnBig,
  },
];

export default function FieldHomePage() {
  const [data, setData] = useState<FieldDashboardResponse | null>(null);
  const [meetings, setMeetings] = useState<FieldAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const [dashboard, myMeetings] = await Promise.all([
          getFieldDashboard(),
          getMyFieldMeetings(),
        ]);
        setData(dashboard);
        setMeetings(myMeetings);
      } catch (error: unknown) {
        setError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || 'Failed to load dashboard'
            : 'Failed to load dashboard',
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) {
    return (
      <div className="field-glass rounded-[2rem] p-6 text-sm text-slate-600">
        Loading dashboard...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error || 'Unable to load dashboard'}
      </div>
    );
  }

  const todaysMeetings = meetings.filter((meeting) => isToday(meeting.scheduledAt));
  const pendingFeedbackCount = meetings.filter(
    (meeting) => meeting.status === 'scheduled',
  ).length;

  const stats = [
    ['Leads Added', data.stats.myLeads, 'bg-[#fff4df] text-[#9a3412]'],
    ['Meetings Today', todaysMeetings.length, 'bg-[#eaf1ff] text-[#1d4f91]'],
    ['Feedback Pending', pendingFeedbackCount, 'bg-[#eafbf1] text-[#166534]'],
  ] as const;

  const recentActivity = [
    ...data.recentLeads.slice(0, 2).map((lead) => ({
      id: `lead-${lead.id}`,
      color: 'bg-[#f59e0b]',
      title: `Lead added - ${lead.businessName}`,
      meta: formatDate(lead.createdAt),
    })),
    ...meetings.slice(0, 2).map((meeting) => ({
      id: `meeting-${meeting.id}`,
      color: 'bg-[#60a5fa]',
      title: `Meeting assigned - ${meeting.lead.businessName}`,
      meta: isToday(meeting.scheduledAt) ? 'Today' : formatDate(meeting.scheduledAt),
    })),
  ].slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl space-y-5 lg:space-y-6">
      <section className="px-1 pt-1">
        <div className="text-[1rem] leading-none">
          <span className="brand-wordmark">
            <span className="brand-mandi">Mandi</span>
            <span className="brand-plus">Plus</span>
            <span className="brand-field">Field</span>
          </span>
        </div>
        <h1 className="mt-2 text-[2.25rem] font-semibold tracking-[-0.07em] text-slate-950 sm:text-5xl">
          Welcome {data.profile.user.name.split(' ')[0]},
        </h1>
      </section>

      <section className="field-glass rounded-[2rem] p-5 sm:p-6">
        <h2 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">
          Today&apos;s Status
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map(([label, value, tone]) => (
            <div
              key={label}
              className={`field-card-hover rounded-[1.6rem] px-5 py-5 ${tone}`}
            >
              <p className="text-base font-medium">{label}</p>
              <p className="mt-4 text-5xl font-semibold tracking-[-0.06em]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="field-glass rounded-[2rem] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-[#eaf1ff] p-2 text-[#1d4f91]">
              <Calendar className="h-4 w-4" />
            </div>
            <h2 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">
              Today&apos;s Meetings
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {todaysMeetings.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[#e7dcc7] bg-white/72 px-4 py-8 text-center text-sm text-slate-500">
                No meetings today
              </div>
            ) : (
              todaysMeetings.slice(0, 2).map((meeting) => (
                <div
                  key={meeting.id}
                  className="field-card-hover rounded-[1.6rem] border border-[#eadfcf] bg-white/84 p-4"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                      {formatTime(meeting.scheduledAt)}
                    </span>
                    <span className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
                      {meeting.lead.businessName}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{meeting.lead.businessAddress || 'Address not added'}</span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link
                      href="/field/meetings"
                      className="rounded-full bg-[#eaf1fb] px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-[#dde8f6]"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="field-glass rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#fff1df] p-3 text-[#ea580c]">
                <MessageSquareWarning className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                  Pending Feedback
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {pendingFeedbackCount === 0
                    ? 'No pending feedback'
                    : `${pendingFeedbackCount} waiting`}
                </p>
              </div>
              <Link
                href="/field/meetings"
                className="rounded-full bg-[#ffe5ad] px-4 py-2 text-sm font-semibold text-[#9a3412] transition hover:bg-[#ffd989]"
              >
                Open
              </Link>
            </div>
          </div>

          <div className="field-glass rounded-[2rem] p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="field-card-hover group rounded-[1.6rem] border border-[#eadfcf] bg-white/84 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-2xl bg-[#fff1df] p-3 text-[#9a3412]">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-[#ea580c]" />
                  </div>
                  <p className="mt-5 text-base font-semibold text-slate-950">
                    {action.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{action.subtitle}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="field-glass rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-[#eef8ef] p-2 text-[#166534]">
            <Clock3 className="h-4 w-4" />
          </div>
          <h2 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">
            Recent Activity
          </h2>
        </div>
        <div className="mt-5 rounded-[1.6rem] border border-[#eadfcf] bg-white/84 p-4">
          {recentActivity.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">
              No activity yet
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((item, index) => (
                <div key={item.id}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-3 w-3 rounded-full ${item.color}`} />
                    <div className="min-w-0">
                      <p className="text-base font-semibold tracking-[-0.02em] text-slate-950">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                    </div>
                  </div>
                  {index !== recentActivity.length - 1 ? (
                    <div className="mt-4 border-t border-[#f1eadc]" />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="h-4 lg:hidden" />
    </div>
  );
}
