'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Search, PhoneCall, SlidersHorizontal, CalendarRange } from 'lucide-react';
import { FieldLead, getMyFieldLeads } from '@/features/field/api';

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
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

function isThisWeek(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffDays =
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

type FilterKey = 'all' | 'today' | 'week' | 'pending';

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'pending', label: 'Pending' },
];

export default function MyLeadsPage() {
  const [leads, setLeads] = useState<FieldLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        setLeads(await getMyFieldLeads());
      } catch (error: unknown) {
        setError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || 'Failed to load leads'
            : 'Failed to load leads',
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const filteredLeads = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesQuery =
        !lowerQuery ||
        lead.businessName.toLowerCase().includes(lowerQuery) ||
        lead.customerName.toLowerCase().includes(lowerQuery) ||
        lead.mobileNumber.includes(lowerQuery);

      if (!matchesQuery) return false;

      if (activeFilter === 'today') return isToday(lead.createdAt);
      if (activeFilter === 'week') return isThisWeek(lead.createdAt);
      if (activeFilter === 'pending') {
        return (
          lead.currentStatus === 'new_lead' ||
          lead.currentStatus === 'contact_pending' ||
          lead.currentStatus === 'follow_up_required'
        );
      }

      return true;
    });
  }, [activeFilter, leads, query]).filter((lead) => {
    const leadDate = new Date(lead.createdAt);

    if (startDate) {
      const start = new Date(`${startDate}T00:00:00`);
      if (leadDate < start) {
        return false;
      }
    }

    if (endDate) {
      const end = new Date(`${endDate}T23:59:59.999`);
      if (leadDate > end) {
        return false;
      }
    }

    return true;
  });

  const todaysLeads = filteredLeads.filter((lead) => isToday(lead.createdAt));
  const olderLeads = filteredLeads.filter((lead) => !isToday(lead.createdAt));

  const compactLeads = activeFilter === 'all' ? filteredLeads : [];

  const renderLeadCard = (lead: FieldLead) => (
    <Link
      key={lead.id}
      href={`/field/my-leads/${lead.id}`}
      className="field-card-hover block rounded-[1.7rem] border border-[#eadfcf] bg-white/88 p-4 shadow-[0_22px_50px_-34px_rgba(99,68,26,0.18)] sm:rounded-[1.9rem] sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-[1.15rem] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[2rem] sm:tracking-[-0.06em]">
            {lead.businessName}
          </h3>
          <p className="mt-1 text-base text-slate-500 sm:text-lg">{lead.customerName}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#eaf1fb] px-3 py-1 text-xs font-semibold text-[#355b8c] sm:px-4 sm:py-1.5 sm:text-sm">
          {lead.currentStatus === 'new_lead' ? 'New' : lead.currentStatus.replaceAll('_', ' ')}
        </span>
      </div>

      <div className="mt-5 space-y-4 text-slate-600 sm:mt-6 sm:space-y-5">
        <div>
          <p className="text-base text-slate-500 sm:text-lg">Phone</p>
          <p className="mt-2 break-all text-[1.05rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[1.95rem] sm:tracking-[-0.05em]">
            {lead.mobileNumber}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500 sm:text-lg">
          <PhoneCall className="h-4 w-4 text-slate-400 sm:h-5 sm:w-5" />
          <span>{formatDate(lead.createdAt)}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-[#f1eadc] pt-3 text-base font-medium tracking-[-0.02em] text-slate-900 sm:mt-5 sm:pt-4 sm:text-xl sm:tracking-[-0.03em]">
        {formatDate(lead.createdAt)}
      </div>
    </Link>
  );

  const renderCompactLeadCard = (lead: FieldLead) => (
    <Link
      key={lead.id}
      href={`/field/my-leads/${lead.id}`}
      className="field-card-hover block rounded-[1.45rem] border border-[#eadfcf] bg-white/90 p-4 shadow-[0_22px_50px_-34px_rgba(99,68,26,0.16)]"
    >
      <div className="grid grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-3">
        <div className="min-w-0 border-r border-[#f2e7d8] pr-3">
          <h3 className="truncate text-[1.05rem] font-semibold tracking-[-0.04em] text-slate-950">
            {lead.businessName}
          </h3>
          <p className="mt-1 truncate text-base text-slate-500">
            {lead.customerName}
          </p>
        </div>

        <div className="min-w-0 pl-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[0.78rem] font-medium text-slate-400">Phone</p>
              <p className="mt-0.5 whitespace-nowrap text-[1rem] font-semibold leading-snug tracking-[-0.02em] text-slate-900">
                {lead.mobileNumber}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#eaf1fb] px-3 py-1 text-[0.72rem] font-semibold text-[#355b8c]">
              {lead.currentStatus === 'new_lead' ? 'New' : lead.currentStatus.replaceAll('_', ' ')}
            </span>
          </div>

          <div className="mt-3 text-[0.8rem] text-slate-400">
            <span className="truncate">{formatDate(lead.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="mx-auto w-full max-w-3xl min-w-0 space-y-4 sm:space-y-5">
      <section className="field-glass overflow-hidden rounded-[1.8rem] p-3.5 sm:rounded-[2rem] sm:p-5">
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 sm:left-5 sm:h-6 sm:w-6" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or phone..."
              className="w-full min-w-0 rounded-full border border-[#eadfcf] bg-white/86 py-3 pl-12 pr-4 text-base outline-none transition focus:border-[#ea580c] sm:py-4 sm:pl-15 sm:pr-5 sm:text-lg"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((value) => !value)}
            aria-label="Open filters"
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition sm:h-14 sm:w-14 ${
              showAdvancedFilters
                ? 'border-[#ff8f1f] bg-[#ff8f1f] text-white shadow-[0_18px_30px_-18px_rgba(255,143,31,0.7)]'
                : 'border-[#eadfcf] bg-white/86 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1 sm:mt-5 sm:gap-3">
          {filters.map((filter) => {
            const active = activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-base font-medium transition sm:px-7 sm:py-3 sm:text-lg ${
                  active
                    ? 'bg-[#ff8f1f] text-white shadow-[0_18px_30px_-18px_rgba(255,143,31,0.7)]'
                    : 'border border-[#eadfcf] bg-white/82 text-slate-900'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {showAdvancedFilters ? (
          <div className="mt-4 rounded-[1.5rem] border border-[#eadfcf] bg-white/72 p-3.5 sm:mt-5 sm:p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <CalendarRange className="h-4 w-4 text-[#ea580c]" />
              Created date
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  Start date
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full rounded-2xl border border-[#eadfcf] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ea580c]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                  End date
                </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="w-full rounded-2xl border border-[#eadfcf] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ea580c]"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="mt-3 text-sm font-medium text-[#ea580c]"
            >
              Clear dates
            </button>
          </div>
        ) : null}
      </section>

      {loading ? (
        <div className="field-glass rounded-[2rem] p-6 text-sm text-slate-600">
          Loading leads...
        </div>
      ) : error ? (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          {activeFilter === 'all' ? (
            <section className="space-y-4">
              <h2 className="px-1 text-[1.9rem] font-semibold tracking-[-0.05em] text-slate-950 sm:px-2 sm:text-3xl">
                All leads
              </h2>
              {compactLeads.length === 0 ? (
                <div className="field-glass rounded-[2rem] p-6 text-center text-sm text-slate-500">
                  No leads found
                </div>
              ) : (
                <div className="grid gap-3">
                  {compactLeads.map(renderCompactLeadCard)}
                </div>
              )}
            </section>
          ) : (
            <>
              <section className="space-y-4">
                <h2 className="px-1 text-[1.9rem] font-semibold tracking-[-0.05em] text-slate-950 sm:px-2 sm:text-3xl">
                  Today
                </h2>
                {todaysLeads.length === 0 ? (
                  <div className="field-glass rounded-[2rem] p-6 text-center text-sm text-slate-500">
                    No leads today
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {todaysLeads.map(renderLeadCard)}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h2 className="px-1 text-[1.9rem] font-semibold tracking-[-0.05em] text-slate-950 sm:px-2 sm:text-3xl">
                  Older
                </h2>
                {olderLeads.length === 0 ? (
                  <div className="field-glass rounded-[2rem] p-6 text-center text-sm text-slate-500">
                    No older leads
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {olderLeads.map(renderLeadCard)}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
