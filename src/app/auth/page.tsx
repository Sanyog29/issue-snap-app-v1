'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Shield, User, AlertCircle, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { OAuthButton } from '@/components/auth/google-button';
import { useLanguage } from '@/i18n/context';

type RoleTab = 'customer' | 'employee';

function AuthContent() {
  const searchParams = useSearchParams();
  const { t, language, setLanguage } = useLanguage();

  const initialTab =
    searchParams.get('tab') === 'employee' || searchParams.get('tab') === 'staff'
      ? 'employee'
      : 'customer';
  const urlError = searchParams.get('error');

  const [roleTab, setRoleTab] = useState<RoleTab>(initialTab);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (urlError === 'NotStaff') {
      setErrorMsg(
        'Access Denied: Only authorized municipal staff and administrators can access the staff portal. Non-staff accounts cannot log in here.'
      );
      setRoleTab('employee');
    } else if (urlError === 'OAuthFailed') {
      setErrorMsg('OAuth authentication was cancelled or encountered an error. Please try again.');
    }
  }, [urlError]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 bg-bg text-ink max-w-md mx-auto">
      {/* Top Header */}
      <header className="w-full flex items-center justify-between py-2">
        <Link href="/" className="p-2 -ml-2 text-ink hover:text-primary transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <button
          type="button"
          onClick={() => {
            const nextLang = language === 'en' ? 'hi' : language === 'hi' ? 'te' : 'en';
            setLanguage(nextLang);
          }}
          className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface border border-line-soft text-ink hover:border-line transition-colors"
        >
          {language === 'hi' ? 'हिन्दी' : language === 'te' ? 'తెలుగు' : 'English'}
        </button>
      </header>

      {/* Main Container */}
      <div className="w-full my-auto space-y-6">
        {/* Role Selector Tabs: Citizen vs Staff / Admin */}
        <div className="grid grid-cols-2 p-1 bg-surface rounded-xl border border-line-soft text-sm font-semibold">
          <button
            type="button"
            onClick={() => {
              setRoleTab('customer');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
              roleTab === 'customer'
                ? 'bg-bg text-ink shadow-sm border border-line-soft'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <User className="w-4 h-4 text-primary" />
            <span>Citizen</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleTab('employee');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all ${
              roleTab === 'employee'
                ? 'bg-bg text-ink shadow-sm border border-line-soft'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-500" />
            <span>Staff / Admin</span>
          </button>
        </div>

        {/* Heading & Subheader */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            {roleTab === 'customer' ? 'Citizen Sign In / Sign Up' : 'Staff & Admin Login'}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1.5 leading-relaxed">
            {roleTab === 'customer'
              ? 'One-click sign in with your OAuth account. Report civic issues, track live repairs, and receive automated email updates.'
              : 'Restricted municipal portal. Only authorized municipal staff and administrators can access this system.'}
          </p>
        </div>

        {/* Staff/Admin Notice: Sign-ups are disabled, only pre-authorized staff can log in */}
        {roleTab === 'employee' && (
          <div className="p-3.5 bg-amber-500/10 border-l-4 border-amber-500 rounded-r-lg text-xs text-amber-200/90 flex gap-2.5 items-start">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300 block mb-0.5">
                Staff & Admin Sign-Up Is Disabled
              </span>
              Public self-registration is strictly disallowed. Only accounts pre-registered by municipal administration can log in.
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 bg-red/10 border-l-4 border-red text-red text-xs sm:text-sm rounded-r-lg flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary OAuth Authentication Section */}
        <div className="space-y-4 pt-2">
          <OAuthButton
            role={roleTab === 'employee' ? 'staff' : 'citizen'}
            label={
              roleTab === 'employee'
                ? 'Sign In with Official OAuth'
                : 'Continue with OAuth'
            }
          />

          {roleTab === 'customer' && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <CheckCircle2 className="w-3.5 h-3.5 text-green shrink-0" />
                <span>Instant 1-click verification via secure OAuth</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <CheckCircle2 className="w-3.5 h-3.5 text-green shrink-0" />
                <span>Automated email confirmations on complaint registration</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <CheckCircle2 className="w-3.5 h-3.5 text-green shrink-0" />
                <span>Live status update emails when field engineers take action</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Link */}
      <footer className="w-full py-4 text-center">
        {roleTab === 'customer' ? (
          <Link
            href="/"
            className="text-xs sm:text-sm font-medium text-primary-ink hover:underline"
          >
            {t('auth.continue_without')}
          </Link>
        ) : (
          <p className="text-xs text-ink-muted">
            Need municipal staff or admin access? Contact city IT administration.
          </p>
        )}
      </footer>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg text-ink">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
