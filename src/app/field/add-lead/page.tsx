'use client';

import { FormEvent, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Camera, PlusCircle } from 'lucide-react';
import { createFieldLead } from '@/features/field/api';

export default function AddLeadPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [boardPhoto, setBoardPhoto] = useState<File | null>(null);
  const [form, setForm] = useState({
    businessName: '',
    customerName: '',
    businessAddress: '',
    mobileNumber: '',
    businessType: '',
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (boardPhoto) {
        payload.append('boardPhoto', boardPhoto);
      }

      await createFieldLead(payload);
      setSuccess('Lead submitted successfully.');
      setForm({
        businessName: '',
        customerName: '',
        businessAddress: '',
        mobileNumber: '',
        businessType: '',
      });
      setBoardPhoto(null);
      window.setTimeout(() => router.push('/field/my-leads'), 900);
    } catch (error: unknown) {
      setError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || 'Failed to submit lead'
          : 'Failed to submit lead',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="field-glass overflow-hidden rounded-[2rem]">
        <div className="border-b border-[#eadfcf] bg-[linear-gradient(135deg,#fff5e4_0%,#fffaf2_52%,#eef8ef_100%)] px-5 py-6 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#fff1df] p-3 text-[#9a3412]">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-[#b45309]">
                Lead form
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                Add lead
              </h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 p-5 md:grid-cols-2 sm:p-6">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Business name</span>
            <input
              required
              value={form.businessName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, businessName: event.target.value }))
              }
              className="w-full rounded-2xl border border-[#e7dcc7] bg-white/84 px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Customer name</span>
            <input
              required
              value={form.customerName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, customerName: event.target.value }))
              }
              className="w-full rounded-2xl border border-[#e7dcc7] bg-white/84 px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Business address</span>
            <textarea
              required
              rows={4}
              value={form.businessAddress}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, businessAddress: event.target.value }))
              }
              className="w-full rounded-2xl border border-[#e7dcc7] bg-white/84 px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Mobile number</span>
            <input
              required
              value={form.mobileNumber}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, mobileNumber: event.target.value }))
              }
              className="w-full rounded-2xl border border-[#e7dcc7] bg-white/84 px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Type of business</span>
            <input
              required
              value={form.businessType}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, businessType: event.target.value }))
              }
              className="w-full rounded-2xl border border-[#e7dcc7] bg-white/84 px-4 py-3 text-sm outline-none transition focus:border-[#ea580c]"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Board photo</span>
            <div className="rounded-[1.6rem] border border-dashed border-[#e7dcc7] bg-white/72 px-4 py-4">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Camera className="h-4 w-4 text-[#b45309]" />
                <span>{boardPhoto ? boardPhoto.name : 'Choose photo'}</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setBoardPhoto(event.target.files?.[0] || null)}
                className="mt-3 block w-full text-sm text-slate-500"
              />
            </div>
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 md:col-span-2">
              {success}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex justify-center rounded-2xl bg-[#5b21b6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4c1d95] disabled:bg-slate-400"
            >
              {submitting ? 'Submitting...' : 'Submit lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
