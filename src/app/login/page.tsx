'use client';

import { FormEvent, useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
  getCurrentUser,
  registerFieldAgent,
  sendOtp,
  verifyOtp,
} from '@/features/auth/api';
import { useAuth } from '@/features/auth/AuthContext';

const indiaStates = [
  'ANDHRA_PRADESH',
  'ARUNACHAL_PRADESH',
  'ASSAM',
  'BIHAR',
  'CHHATTISGARH',
  'GOA',
  'GUJARAT',
  'HARYANA',
  'HIMACHAL_PRADESH',
  'JHARKHAND',
  'KARNATAKA',
  'KERALA',
  'MADHYA_PRADESH',
  'MAHARASHTRA',
  'MANIPUR',
  'MEGHALAYA',
  'MIZORAM',
  'NAGALAND',
  'ODISHA',
  'PUNJAB',
  'RAJASTHAN',
  'SIKKIM',
  'TAMIL_NADU',
  'TELANGANA',
  'TRIPURA',
  'UTTAR_PRADESH',
  'UTTARAKHAND',
  'WEST_BENGAL',
  'DELHI',
] as const;

type AuthMode = 'signin' | 'signup';

function prettyState(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function LoginPage() {
  const router = useRouter();
  const { user, setUserAndToken } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [signInForm, setSignInForm] = useState({
    mobileNumber: '',
    otp: '',
  });

  const [signUpForm, setSignUpForm] = useState({
    name: '',
    workingMandi: '',
    state: 'KARNATAKA',
    mobileNumber: '',
    otp: '',
  });

  useEffect(() => {
    if (user) {
      router.replace('/field');
    }
  }, [router, user]);

  const resetMessages = () => {
    setError('');
    setInfo('');
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setOtpSent(false);
    resetMessages();
  };

  const handleSendOtpForSignIn = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      resetMessages();
      await sendOtp(signInForm.mobileNumber);
      setOtpSent(true);
      setInfo('OTP sent');
    } catch (error: unknown) {
      setError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || 'Failed to send OTP'
          : 'Failed to send OTP',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignIn = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      resetMessages();
      const response = await verifyOtp(signInForm.mobileNumber, signInForm.otp);

      if (response.next === 'REGISTER') {
        setSignUpForm((prev) => ({
          ...prev,
          mobileNumber: signInForm.mobileNumber,
        }));
        switchMode('signup');
        setInfo('Mobile number not registered. Please sign up.');
        return;
      }

      if (!response.accessToken) {
        setError('Unable to sign in');
        return;
      }

      const currentUser = await getCurrentUser(response.accessToken);
      if (!currentUser) {
        setError('Unable to load profile');
        return;
      }

      setUserAndToken(response.accessToken, currentUser);
      router.replace('/field');
    } catch (error: unknown) {
      setError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || 'Invalid OTP'
          : 'Invalid OTP',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtpForSignUp = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      resetMessages();
      await sendOtp(signUpForm.mobileNumber);
      setOtpSent(true);
      setInfo('OTP sent');
    } catch (error: unknown) {
      setError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || 'Failed to send OTP'
          : 'Failed to send OTP',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      resetMessages();

      await verifyOtp(signUpForm.mobileNumber, signUpForm.otp);
      const response = await registerFieldAgent({
        name: signUpForm.name,
        workingMandi: signUpForm.workingMandi,
        state: signUpForm.state,
        mobileNumber: signUpForm.mobileNumber,
      });

      if (!response.accessToken) {
        setError('Unable to create account');
        return;
      }

      const currentUser = await getCurrentUser(response.accessToken);
      if (!currentUser) {
        setError('Unable to load profile');
        return;
      }

      setUserAndToken(response.accessToken, currentUser);
      router.replace('/field');
    } catch (error: unknown) {
      setError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || 'Registration failed'
          : 'Registration failed',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef2f6]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-6 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)]">
          <div className="relative h-60 bg-[linear-gradient(135deg,#fde68a_0%,#f8fafc_35%,#ddd6fe_100%)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.35),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(79,70,229,0.28),transparent_24%)]" />
            <div className="absolute inset-x-0 top-0 p-6">
              <div className="text-[1.55rem] leading-none sm:text-[1.7rem]">
                <span className="brand-wordmark">
                  <span className="brand-mandi">Mandi</span>
                  <span className="brand-plus">Plus</span>
                  <span className="brand-field">Field</span>
                </span>
              </div>
            </div>
          </div>

          <div className="px-5 py-6 sm:px-6">
            {mode === 'signin' ? (
              <>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  Sign in
                </h2>
                <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>

                {!otpSent ? (
                  <form onSubmit={handleSendOtpForSignIn} className="mt-6 space-y-4">
                    <input
                      required
                      value={signInForm.mobileNumber}
                      onChange={(event) =>
                        setSignInForm((prev) => ({
                          ...prev,
                          mobileNumber: event.target.value,
                        }))
                      }
                      placeholder="Mobile number"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-2xl bg-[#5b21b6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4c1d95] disabled:bg-slate-400"
                    >
                      {loading ? 'Sending OTP...' : 'Get OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifySignIn} className="mt-6 space-y-4">
                    <input
                      required
                      value={signInForm.otp}
                      onChange={(event) =>
                        setSignInForm((prev) => ({ ...prev, otp: event.target.value }))
                      }
                      placeholder="Enter OTP"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-2xl bg-[#5b21b6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4c1d95] disabled:bg-slate-400"
                    >
                      {loading ? 'Verifying...' : 'Sign in'}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  Sign up
                </h2>
                <p className="mt-1 text-sm text-slate-500">Create your account</p>

                <form
                  onSubmit={otpSent ? handleRegister : handleSendOtpForSignUp}
                  className="mt-6 space-y-4"
                >
                  <input
                    required
                    value={signUpForm.name}
                    onChange={(event) =>
                      setSignUpForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Name"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  />

                  <input
                    required
                    value={signUpForm.workingMandi}
                    onChange={(event) =>
                      setSignUpForm((prev) => ({
                        ...prev,
                        workingMandi: event.target.value,
                      }))
                    }
                    placeholder="Working mandi"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  />

                  <select
                    value={signUpForm.state}
                    onChange={(event) =>
                      setSignUpForm((prev) => ({ ...prev, state: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  >
                    {indiaStates.map((state) => (
                      <option key={state} value={state}>
                        {prettyState(state)}
                      </option>
                    ))}
                  </select>

                  <input
                    required
                    value={signUpForm.mobileNumber}
                    onChange={(event) =>
                      setSignUpForm((prev) => ({
                        ...prev,
                        mobileNumber: event.target.value,
                      }))
                    }
                    placeholder="Mobile number"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                  />

                  {otpSent ? (
                    <input
                      required
                      value={signUpForm.otp}
                      onChange={(event) =>
                        setSignUpForm((prev) => ({ ...prev, otp: event.target.value }))
                      }
                      placeholder="Enter OTP"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-900"
                    />
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-[#5b21b6] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4c1d95] disabled:bg-slate-400"
                  >
                    {loading
                      ? otpSent
                        ? 'Creating account...'
                        : 'Sending OTP...'
                      : otpSent
                        ? 'Create account'
                        : 'Get OTP'}
                  </button>
                </form>
              </>
            )}

            {info ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {info}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 text-center text-sm text-slate-500">
          {mode === 'signin' ? (
            <>
              Not registered yet?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-semibold text-[#5b21b6]"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="font-semibold text-[#5b21b6]"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
