'use client';

import { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import {
  FieldAppointment,
  LeadStatus,
  type MeetingFeedbackPayload,
  getMyFieldMeetings,
  submitMeetingFeedback,
} from '@/features/field/api';
import {
  isOfflineCapableError,
  queueMeetingFeedback,
} from '@/features/pwa/offlineQueue';

const outcomeOptions = [
  { value: 'meeting_completed', label: 'Meeting Completed' },
  { value: 'converted', label: 'Converted' },
  { value: 'follow_up_required', label: 'Follow-up Required' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'closed', label: 'Dropped' },
] as const satisfies ReadonlyArray<{ value: LeadStatus; label: string }>;

const interestOptions = [
  { value: 'high_interest', label: 'High Interest' },
  { value: 'moderate_interest', label: 'Moderate Interest' },
  { value: 'low_interest', label: 'Low Interest' },
  { value: 'exploring', label: 'Exploring' },
  { value: 'no_fit', label: 'No Fit' },
] as const;

const nextActionOptions = [
  'call_again',
  'send_quotation',
  'schedule_demo',
  'visit_again',
  'share_details_on_whatsapp',
  'custom',
] as const;

const reasonOptions = [
  'price_too_high',
  'already_using_competitor',
  'no_requirement',
  'decision_pending',
  'trust_issue',
  'logistics_issue',
  'custom',
] as const;

const TIMELINE_STEPS = ['Scheduled', 'Completed', 'Follow-up', 'Converted / Dropped'] as const;

type InterestLevelOption = (typeof interestOptions)[number]['value'];
type NextActionOption = (typeof nextActionOptions)[number];
type ReasonOption = '' | (typeof reasonOptions)[number];

type MeetingFormState = {
  customerResponse: string;
  interestLevel: InterestLevelOption;
  notes: string;
  nextAction: NextActionOption;
  nextActionCustom: string;
  followUpDate: string;
  outcomeStatus: LeadStatus;
  reasonCategory: ReasonOption;
  reasonDetails: string;
  rescheduledDate: string;
  rescheduledTime: string;
  rescheduleReason: string;
};

const INITIAL_FORM: MeetingFormState = {
  customerResponse: '',
  interestLevel: 'moderate_interest',
  notes: '',
  nextAction: 'call_again',
  nextActionCustom: '',
  followUpDate: '',
  outcomeStatus: 'meeting_completed' as LeadStatus,
  reasonCategory: '',
  reasonDetails: '',
  rescheduledDate: '',
  rescheduledTime: '',
  rescheduleReason: '',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatStatusLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatActionLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getTimelineStepState(meeting: FieldAppointment, step: (typeof TIMELINE_STEPS)[number]) {
  const leadStatus = meeting.lead.currentStatus;
  const meetingStatus = meeting.status;

  if (step === 'Scheduled') {
    return 'done';
  }

  if (step === 'Completed') {
    return meetingStatus === 'completed' || meetingStatus === 'rescheduled' || leadStatus !== 'meeting_assigned'
      ? 'done'
      : 'current';
  }

  if (step === 'Follow-up') {
    if (leadStatus === 'follow_up_required' || meetingStatus === 'rescheduled' || leadStatus === 'rescheduled') {
      return 'current';
    }

    if (leadStatus === 'converted' || leadStatus === 'not_interested' || leadStatus === 'closed') {
      return 'done';
    }

    return 'upcoming';
  }

  if (leadStatus === 'converted' || leadStatus === 'not_interested' || leadStatus === 'closed') {
    return 'current';
  }

  return 'upcoming';
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<FieldAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<MeetingFormState>(INITIAL_FORM);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
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

  const selectedOutcome = form.outcomeStatus;
  const isConverted = selectedOutcome === 'converted';
  const needsFollowUpDate = selectedOutcome === 'follow_up_required';
  const isRescheduled = selectedOutcome === 'rescheduled';
  const needsReasonTracking =
    selectedOutcome === 'not_interested' ||
    selectedOutcome === 'closed';
  const usesCustomNextAction = form.nextAction === 'custom';
  const usesCustomReason = form.reasonCategory === 'custom';

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
    appointmentId: string,
  ) => {
    event.preventDefault();

    if (needsFollowUpDate && !form.followUpDate) {
      setError('Follow-up date and time are required when follow-up is needed.');
      return;
    }

    if (isRescheduled && (!form.rescheduledDate || !form.rescheduledTime)) {
      setError('Rescheduled date and time are required when outcome is rescheduled.');
      return;
    }

    if (needsReasonTracking && !form.reasonCategory) {
      setError('Please select a reason for the selected outcome.');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setSubmittingId(appointmentId);
      const payload: MeetingFeedbackPayload = {
        ...form,
        nextAction:
          form.nextAction === 'custom'
            ? form.nextActionCustom.trim()
            : formatActionLabel(form.nextAction),
        followUpDate: isConverted || isRescheduled ? '' : form.followUpDate,
        outcomeStatus: form.outcomeStatus,
        reasonCategory: needsReasonTracking
          ? formatActionLabel(form.reasonCategory)
          : '',
        reasonDetails:
          needsReasonTracking && form.reasonCategory === 'custom'
            ? form.reasonDetails.trim()
            : '',
        rescheduledDate: isRescheduled ? form.rescheduledDate : '',
        rescheduledTime: isRescheduled ? form.rescheduledTime : '',
        rescheduleReason: isRescheduled ? form.rescheduleReason.trim() : '',
      };

      await submitMeetingFeedback(appointmentId, payload);
      setActiveId(null);
      setForm(INITIAL_FORM);
      setSuccess('Feedback saved successfully.');
      await loadMeetings();
    } catch (error: unknown) {
      const payload: MeetingFeedbackPayload = {
        ...form,
        nextAction:
          form.nextAction === 'custom'
            ? form.nextActionCustom.trim()
            : formatActionLabel(form.nextAction),
        followUpDate: isConverted || isRescheduled ? '' : form.followUpDate,
        outcomeStatus: form.outcomeStatus,
        reasonCategory: needsReasonTracking
          ? formatActionLabel(form.reasonCategory)
          : '',
        reasonDetails:
          needsReasonTracking && form.reasonCategory === 'custom'
            ? form.reasonDetails.trim()
            : '',
        rescheduledDate: isRescheduled ? form.rescheduledDate : '',
        rescheduledTime: isRescheduled ? form.rescheduledTime : '',
        rescheduleReason: isRescheduled ? form.rescheduleReason.trim() : '',
      };

      if (isOfflineCapableError(error)) {
        await queueMeetingFeedback(appointmentId, payload);
        setActiveId(null);
        setForm(INITIAL_FORM);
        setError('');
        setSuccess('No internet. Feedback saved offline and will sync automatically.');
        return;
      }

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
          {success ? (
            <div className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}
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
                  <p className="mt-1">{formatStatusLabel(meeting.status)}</p>
                </div>
              </div>

              {meeting.notes ? (
                <div className="mt-4 rounded-2xl bg-[#fff5e4] px-4 py-3 text-sm leading-6 text-[#9a3412]">
                  {meeting.notes}
                </div>
              ) : null}

              <div className="mt-5 rounded-[1.6rem] border border-[#eadfcf] bg-white/70 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Status flow
                  </h3>
                  <span className="text-xs font-medium text-slate-500">
                    Scheduled to outcome
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  {TIMELINE_STEPS.map((step) => {
                    const state = getTimelineStepState(meeting, step);
                    const tone =
                      state === 'done'
                        ? 'border-[#bbf7d0] bg-[#eefcf3] text-[#166534]'
                        : state === 'current'
                          ? 'border-[#fdba74] bg-[#fff4e8] text-[#9a3412]'
                          : 'border-[#e5e7eb] bg-[#f8fafc] text-slate-500';

                    return (
                      <div
                        key={step}
                        className={`rounded-2xl border px-3 py-3 text-sm font-medium ${tone}`}
                      >
                        {step}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() =>
                    setActiveId((prev) => {
                      const nextId = prev === meeting.id ? null : meeting.id;
                      if (nextId) {
                        setForm(INITIAL_FORM);
                        setError('');
                      }
                      return nextId;
                    })
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
                          interestLevel: event.target.value as InterestLevelOption,
                        }))
                      }
                      className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                    >
                      {interestOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
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
                          outcomeStatus: event.target.value as LeadStatus,
                        }))
                      }
                      className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                    >
                      {outcomeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">
                      Next step
                    </span>
                    <select
                      value={form.nextAction}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          nextAction: event.target.value as NextActionOption,
                        }))
                      }
                      className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                    >
                      {nextActionOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === 'custom' ? 'Custom' : formatActionLabel(option)}
                        </option>
                      ))}
                    </select>
                  </label>

                  {usesCustomNextAction ? (
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">
                        Custom next step
                      </span>
                      <input
                        value={form.nextActionCustom}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            nextActionCustom: event.target.value,
                          }))
                        }
                        placeholder="Enter next step"
                        className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                      />
                    </label>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#eadfcf] bg-[#fffaf3] px-4 py-3 text-sm text-slate-600">
                      Guided next step: {formatActionLabel(form.nextAction)}
                    </div>
                  )}

                  {!isConverted && !isRescheduled ? (
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">
                        Follow-up date & time
                      </span>
                      <input
                        type="datetime-local"
                        required={needsFollowUpDate}
                        value={form.followUpDate}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, followUpDate: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                      />
                    </label>
                  ) : null}

                  {isRescheduled ? (
                    <>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">
                          Rescheduled date
                        </span>
                        <input
                          type="date"
                          required
                          value={form.rescheduledDate}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              rescheduledDate: event.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">
                          Rescheduled time
                        </span>
                        <input
                          type="time"
                          required
                          value={form.rescheduledTime}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              rescheduledTime: event.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                        />
                      </label>

                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-slate-700">
                          Reason for reschedule
                        </span>
                        <textarea
                          rows={2}
                          value={form.rescheduleReason}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              rescheduleReason: event.target.value,
                            }))
                          }
                          placeholder="Optional reason for rescheduling"
                          className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                        />
                      </label>
                    </>
                  ) : null}

                  {needsReasonTracking ? (
                    <>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">
                          Reason tracking
                        </span>
                        <select
                          required
                          value={form.reasonCategory}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              reasonCategory: event.target.value as ReasonOption,
                            }))
                          }
                          className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                        >
                          <option value="">Select a reason</option>
                          {reasonOptions.map((option) => (
                            <option key={option} value={option}>
                              {option === 'custom' ? 'Custom' : formatActionLabel(option)}
                            </option>
                          ))}
                        </select>
                      </label>

                      {usesCustomReason ? (
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-700">
                            Custom reason
                          </span>
                          <input
                            value={form.reasonDetails}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                reasonDetails: event.target.value,
                              }))
                            }
                            placeholder="Enter custom reason"
                            className="w-full rounded-2xl border border-[#e7dcc7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
                          />
                        </label>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-[#eadfcf] bg-[#fffaf3] px-4 py-3 text-sm text-slate-600">
                          Reason will be saved as: {form.reasonCategory ? formatActionLabel(form.reasonCategory) : 'Select a reason'}
                        </div>
                      )}
                    </>
                  ) : null}

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
