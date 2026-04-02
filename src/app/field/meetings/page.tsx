'use client';

import { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import {
  FieldAppointment,
  getMyFieldMeetings,
  submitMeetingFeedback,
} from '@/features/field/api';

const outcomeOptions = [
  'meeting_completed',
  'converted',
  'follow_up_required',
  'not_interested',
  'closed',
] as const;

const interestOptions = ['hot', 'warm', 'cold'] as const;

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<FieldAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerResponse: '',
    interestLevel: 'warm',
    notes: '',
    nextAction: '',
    followUpDate: '',
    outcomeStatus: 'meeting_completed',
  });

  const loadMeetings = async () => {
    try {
      setLoading(true);
      setError('');
      setMeetings(await getMyFieldMeetings());
    } catch (error: unknown) {
      setError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || 'Failed to load meetings'
          : 'Failed to load meetings',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
    appointmentId: string,
  ) => {
    event.preventDefault();
    try {
      setSubmittingId(appointmentId);
      await submitMeetingFeedback(appointmentId, {
        ...form,
        interestLevel: form.interestLevel as 'hot' | 'warm' | 'cold',
        outcomeStatus: form.outcomeStatus as
          | 'meeting_completed'
          | 'converted'
          | 'follow_up_required'
          | 'not_interested'
          | 'closed',
      });
      setActiveId(null);
      setForm({
        customerResponse: '',
        interestLevel: 'warm',
        notes: '',
        nextAction: '',
        followUpDate: '',
        outcomeStatus: 'meeting_completed',
      });
      await loadMeetings();
    } catch (error: unknown) {
      setError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || 'Failed to submit feedback'
          : 'Failed to submit feedback',
      );
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="field-glass overflow-hidden rounded-[2rem]">
        <div className="bg-[linear-gradient(135deg,#eef8ef_0%,#fffaf2_52%,#fff5e4_100%)] px-5 py-6 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#eef8ef] p-3 text-[#166534]">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[#166534]">
                Meetings
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                Meetings & feedback
              </h1>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="field-glass rounded-[2rem] p-6 text-sm text-slate-600">
          Loading meetings...
        </div>
      ) : error ? (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : meetings.length === 0 ? (
        <div className="field-glass rounded-[2rem] border border-dashed border-[#e7dcc7] p-10 text-center text-sm text-slate-500">
          No meetings yet
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <article
              key={meeting.id}
              className="field-glass rounded-[2rem] p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {meeting.lead.businessName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {meeting.lead.customerName}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    {meeting.lead.businessAddress}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#fff5e4] px-4 py-3 text-sm text-[#9a3412]">
                  <p className="font-semibold">
                    {formatDateTime(meeting.scheduledAt)}
                  </p>
                  <p className="mt-1 capitalize">{meeting.status}</p>
                </div>
              </div>

              {meeting.notes ? (
                <div className="mt-4 rounded-2xl bg-[#fff5e4] px-4 py-3 text-sm leading-6 text-[#9a3412]">
                  {meeting.notes}
                </div>
              ) : null}

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() =>
                    setActiveId((prev) => (prev === meeting.id ? null : meeting.id))
                  }
                  className="rounded-2xl bg-[#5b21b6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4c1d95]"
                >
                  {activeId === meeting.id ? 'Hide feedback form' : 'Submit feedback'}
                </button>
              </div>

              {activeId === meeting.id ? (
                <form
                  onSubmit={(event) => handleSubmit(event, meeting.id)}
                  className="mt-5 grid gap-4 rounded-[1.6rem] border border-[#e7dcc7] bg-white/78 p-4 md:grid-cols-2"
                >
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Customer response
                    </span>
                    <textarea
                      rows={3}
                      value={form.customerResponse}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          customerResponse: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Interest level
                    </span>
                    <select
                      value={form.interestLevel}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          interestLevel: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                    >
                      {interestOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Outcome status
                    </span>
                    <select
                      value={form.outcomeStatus}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          outcomeStatus: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                    >
                      {outcomeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option.replaceAll('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Next action</span>
                    <input
                      value={form.nextAction}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, nextAction: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Follow-up date</span>
                    <input
                      type="datetime-local"
                      value={form.followUpDate}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, followUpDate: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">Notes</span>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                    />
                  </label>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={submittingId === meeting.id}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#5b21b6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4c1d95] disabled:bg-slate-400"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {submittingId === meeting.id ? 'Saving feedback...' : 'Save feedback'}
                    </button>
                  </div>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
