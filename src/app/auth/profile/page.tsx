'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import type { Language } from '@/types/database';

export default function ProfilePage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isEmailReadOnly, setIsEmailReadOnly] = useState(false);
  const [isPhoneReadOnly, setIsPhoneReadOnly] = useState(false);

  // Notifications
  const [pushNotifs, setPushNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      setUserId(user.id);

      // Check current profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (user.email) {
        setEmail(user.email);
        setIsEmailReadOnly(true);
        setEmailNotifs(true);
      } else if (profile?.email) {
        setEmail(profile.email);
      }

      if (user.phone) {
        setPhone(user.phone);
        setIsPhoneReadOnly(true);
        setSmsNotifs(true);
      } else if (profile?.phone) {
        setPhone(profile.phone);
      }

      if (profile?.full_name) {
        setFullName(profile.full_name);
      } else if (user.user_metadata?.full_name || user.user_metadata?.name) {
        setFullName(user.user_metadata.full_name || user.user_metadata.name);
      }

      if (profile?.preferred_language) {
        setLanguage(profile.preferred_language as Language);
      }

      setLoading(false);
    }

    loadUser();
  }, [router, setLanguage, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg(t('profile.name_error'));
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          preferred_language: language,
        })
        .eq('id', userId);

      if (userError) throw userError;

      // Update notification_preferences if supported
      try {
        await supabase
          .from('notification_preferences')
          .upsert({
            user_id: userId,
            email_notifications: emailNotifs && Boolean(email),
            sms_notifications: smsNotifs && Boolean(phone),
            push_notifications: pushNotifs,
          }, { onConflict: 'user_id' });
      } catch {
        // notification_preferences fallback if table not yet migrated
      }

      window.location.href = '/';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile';
      setErrorMsg(msg);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-primary-ink" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-bg text-ink max-w-md mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            {t('profile.title')}
          </h1>
          <p className="text-sm text-ink-muted mt-1.5">
            {t('auth.sign_in_desc')}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red/10 border-l-4 border-red text-red text-sm rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              {t('profile.name')} <span className="text-red">*</span>
            </label>
            <Input
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="h-12 border-2 border-line rounded-control text-ink bg-surface text-base"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              {isEmailReadOnly ? t('profile.email') : t('profile.email_optional')}
            </label>
            <div className="relative">
              <Input
                type="email"
                autoComplete="email"
                disabled={isEmailReadOnly}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`h-12 border-2 border-line rounded-control text-ink bg-surface text-base ${
                  isEmailReadOnly ? 'opacity-80 bg-surface/50' : ''
                }`}
              />
              {isEmailReadOnly && (
                <Check className="w-5 h-5 text-green absolute right-3 top-3.5" />
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              {isPhoneReadOnly ? t('profile.phone') : t('profile.phone_optional')}
            </label>
            <div className="relative">
              <Input
                type="tel"
                autoComplete="tel"
                disabled={isPhoneReadOnly}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919848012345"
                className={`h-12 border-2 border-line rounded-control text-ink bg-surface text-base ${
                  isPhoneReadOnly ? 'opacity-80 bg-surface/50' : ''
                }`}
              />
              {isPhoneReadOnly && (
                <Check className="w-5 h-5 text-green absolute right-3 top-3.5" />
              )}
            </div>
          </div>

          {/* Language Preference */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              {t('profile.language')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`h-11 rounded-control border-2 text-sm font-medium transition-all ${
                  language === 'en'
                    ? 'border-primary-ink bg-primary/10 text-primary-ink font-semibold'
                    : 'border-line bg-surface text-ink hover:border-line-soft'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`h-11 rounded-control border-2 text-sm font-medium transition-all ${
                  language === 'hi'
                    ? 'border-primary-ink bg-primary/10 text-primary-ink font-semibold'
                    : 'border-line bg-surface text-ink hover:border-line-soft'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Notification toggles */}
          <div className="pt-2 border-t border-line-soft space-y-3">
            <span className="text-sm font-medium text-ink block">Notifications</span>
            
            <label className="flex items-center justify-between text-sm text-ink cursor-pointer">
              <span>Push notifications</span>
              <input
                type="checkbox"
                checked={pushNotifs}
                onChange={(e) => setPushNotifs(e.target.checked)}
                className="w-5 h-5 rounded border-line text-primary focus:ring-primary-ink"
              />
            </label>

            <label className="flex items-center justify-between text-sm text-ink cursor-pointer">
              <span>Email updates {(!email && !isEmailReadOnly) && '(needs email)'}</span>
              <input
                type="checkbox"
                disabled={!email && !isEmailReadOnly}
                checked={emailNotifs && Boolean(email)}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-5 h-5 rounded border-line text-primary focus:ring-primary-ink disabled:opacity-50"
              />
            </label>

            <label className="flex items-center justify-between text-sm text-ink cursor-pointer">
              <span>SMS updates {(!phone && !isPhoneReadOnly) && '(needs mobile)'}</span>
              <input
                type="checkbox"
                disabled={!phone && !isPhoneReadOnly}
                checked={smsNotifs && Boolean(phone)}
                onChange={(e) => setSmsNotifs(e.target.checked)}
                className="w-5 h-5 rounded border-line text-primary focus:ring-primary-ink disabled:opacity-50"
              />
            </label>
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full h-12 bg-accent hover:bg-accent/90 text-on-accent font-semibold rounded-control mt-6"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('profile.save')}
          </Button>
        </form>
      </div>

      <div className="py-4 text-center">
        {fullName && (
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-sm text-ink-muted hover:text-ink font-medium"
          >
            {t('profile.skip')}
          </button>
        )}
      </div>
    </main>
  );
}
