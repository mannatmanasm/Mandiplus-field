'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Phone,
  UserRound,
} from 'lucide-react';
import {
  FieldLeadDetail,
  getFieldLeadDetail,
} from '@/features/field/api';

function formatDateTime(value?: string | null) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatStatus(value: string) {
  return value.replaceAll('_', ' ');
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<FieldLeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const leadId = params.id;

  useEffect(() => {
    if (!leadId) return;

    const run = async () => {
      try {
        setLoading(true);
        setError('');
        setLead(await getFieldLeadDetail(leadId));
      } catch (error: unknown) {
        setError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || 'Failed to load lead details'
            : 'Failed to load lead details',
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [leadId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="field-glass rounded-[1.9rem] p-6 text-sm text-slate-600">
          Loading lead details...
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/field/my-leads"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>
        <div className="rounded-[1.9rem] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || 'Lead not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      <Link
        href="/field/my-leads"
        className="inline-flex items-center gap-2 rounded-full border border-[#eadfcf] bg-white/70 px-4 py-2 text-sm font-medium text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </Link>

      <section className="field-glass rounded-[1.9rem] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b45309]">
              Lead details
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
              {lead.businessName}
            </h1>
            <p className="mt-2 text-base text-slate-500 sm:text-lg">
              {lead.customerName}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-[#eaf1fb] px-4 py-1.5 text-sm font-semibold text-[#355b8c]">
            {lead.currentStatus === 'new_lead' ? 'New' : formatStatus(lead.currentStatus)}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.35rem] border border-[#eadfcf] bg-white/82 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Phone className="h-4 w-4 text-[#ea580c]" />
              Mobile
            </div>
            <p className="mt-2 break-all text-lg font-semibold text-slate-950">
              {lead.mobileNumber}
            </p>
          </div>

          <div className="rounded-[1.35rem] border border-[#eadfcf] bg-white/82 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ClipboardList className="h-4 w-4 text-[#ea580c]" />
              Business type
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {lead.businessType}
            </p>
          </div>

          <div className="rounded-[1.35rem] border border-[#eadfcf] bg-white/82 p-4 sm:col-span-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4 text-[#ea580c]" />
              Address
            </div>
            <p className="mt-2 text-base text-slate-900">
              {lead.businessAddress}
            </p>
          </div>
        </div>
      </section>

      <section className="field-glass rounded-[1.9rem] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#ea580c]" />
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            Meetings
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          {lead.appointments.length === 0 ? (
            <div className="rounded-[1.35rem] border border-dashed border-[#e7dcc7] bg-white/60 p-4 text-sm text-slate-500">
              No meeting scheduled yet
            </div>
          ) : (
            lead.appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-[1.35rem] border border-[#eadfcf] bg-white/82 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Scheduled at</p>
                    <p className="mt-1 text-base font-semibold text-slate-950">
                      {formatDateTime(appointment.scheduledAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#eef8ef] px-3 py-1 text-xs font-semibold text-[#166534]">
                    {appointment.status}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">Meeting team</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {appointment.assignedMeetingUser?.name || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Notes</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {appointment.notes || 'No notes'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="field-glass rounded-[1.9rem] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-[#ea580c]" />
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            Feedback
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          {lead.feedback.length === 0 ? (
            <div className="rounded-[1.35rem] border border-dashed border-[#e7dcc7] bg-white/60 p-4 text-sm text-slate-500">
              No feedback submitted yet
            </div>
          ) : (
            lead.feedback.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[1.35rem] border border-[#eadfcf] bg-white/82 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Submitted by</p>
                    <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900">
                      <UserRound className="h-4 w-4 text-[#ea580c]" />
                      {entry.submittedByUser?.name || 'Field agent'}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#fff3d8] px-3 py-1 text-xs font-semibold text-[#9a3412]">
                    {formatStatus(entry.outcomeStatus)}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-slate-500">Interest</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {entry.interestLevel || 'Not marked'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Next action</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {entry.nextAction || 'No next action'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-slate-500">Customer response</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {entry.customerResponse || 'No response recorded'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-slate-500">Notes</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {entry.notes || 'No notes'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Follow up date</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {formatDateTime(entry.followUpDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Submitted at</p>
                    <p className="mt-1 text-sm text-slate-900">
                      {formatDateTime(entry.submittedAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
