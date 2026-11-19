'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Moon, Sun, Globe, LogOut, Trash2, Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import type { Language } from '@/types/database';

import {
  getLocalStorageItem,
  setLocalStorageItem,
  clearLocalStorage,
  clearSessionStorage,
} from '@/lib/storage';

export default function SettingsPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const supabase = createClient();

  const [isDark, setIsDark] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || user.phone || 'Signed in');
        const { data: profile } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', user.id)
          .single();
        if (profile?.user_type === 'staff' || profile?.user_type === 'admin') {
          setIsStaff(true);
        }
      }
    }
    checkUser();

    // Check dark mode
    if (typeof window !== 'undefined') {
      const isDarkMode = document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        getLocalStorageItem('theme') === 'dark';
      setIsDark(isDarkMode);
    }
  }, [supabase]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      setLocalStorageItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      setLocalStorageItem('theme', 'light');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  return (
    <main className="min-h-screen bg-bg text-ink pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-line-soft px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-primary-ink">
          <ArrowLeft className="w-5 h-5" />
          <span>{t('general.back')}</span>
        </Link>
        <h1 className="text-base font-bold text-ink">{t('settings.title')}</h1>
        <div className="w-12" />
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Profile Card if signed in */}
        {userEmail && (
          <div className="bg-surface border-2 border-line-soft rounded-photo p-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-ink-muted">Account</span>
              <p className="text-sm font-semibold text-ink mt-0.5">{userEmail}</p>
            </div>
            <Link href="/auth/profile">
              <Button variant="outline" size="sm" className="text-xs border-line">
                Edit Profile
              </Button>
            </Link>
          </div>
        )}

        {/* Staff Dashboard Shortcut for Staff/Admins */}
        {isStaff && (
          <Link href="/staff" className="block">
            <div className="bg-primary/10 border-2 border-primary-ink rounded-photo p-4 flex items-center justify-between hover:bg-primary/15 transition-colors">
              <div>
                <span className="text-xs uppercase font-bold text-primary-ink">Municipal Portal</span>
                <p className="text-sm font-bold text-ink mt-0.5">Open Staff Queue &rarr;</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            </div>
          </Link>
        )}

        {/* Language Selection */}
        <div className="bg-surface border-2 border-line-soft rounded-photo p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-ink">
            <Globe className="w-4 h-4 text-primary-ink" />
            <span>Language</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`p-2.5 rounded-control border-2 text-sm font-semibold text-center transition-all ${
                language === 'en'
                  ? 'border-primary-ink bg-primary/10 text-primary-ink'
                  : 'border-line-soft text-ink hover:border-line'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`p-2.5 rounded-control border-2 text-sm font-semibold text-center transition-all ${
                language === 'hi'
                  ? 'border-primary-ink bg-primary/10 text-primary-ink'
                  : 'border-line-soft text-ink hover:border-line'
              }`}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setLanguage('te')}
              className={`p-2.5 rounded-control border-2 text-sm font-semibold text-center transition-all ${
                language === 'te'
                  ? 'border-primary-ink bg-primary/10 text-primary-ink'
                  : 'border-line-soft text-ink hover:border-line'
              }`}
            >
              తెలుగు
            </button>
          </div>
        </div>

        {/* Notifications Center Link */}
        <Link href="/notifications" className="block">
          <div className="bg-surface border-2 border-line-soft hover:border-line rounded-photo p-4 flex items-center justify-between transition-colors shadow-sm">
            <div className="flex items-center gap-2.5 text-sm font-bold text-ink">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span>Notification Center</span>
                <p className="text-xs font-normal text-ink-muted">View live complaint and repair alerts</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-ink-muted" />
          </div>
        </Link>

        {/* Theme Preference */}
        <div className="bg-surface border-2 border-line-soft rounded-photo p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-ink">
            {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-accent" />}
            <span>Dark Theme</span>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              isDark ? 'bg-primary-ink justify-end' : 'bg-line-soft justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-surface shadow-sm" />
          </button>
        </div>

        {/* Account Actions */}
        <div className="space-y-3 pt-2">
          {userEmail ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleSignOut}
              className="w-full h-12 border-2 border-line text-ink font-semibold rounded-control flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {t('settings.sign_out')}
            </Button>
          ) : (
            <Link href="/auth" className="block">
              <Button className="w-full h-12 bg-accent hover:bg-accent/90 text-on-accent font-bold rounded-control">
                {t('auth.sign_in')}
              </Button>
            </Link>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (confirm('Clear all stored local data?')) {
                clearLocalStorage();
                clearSessionStorage();
                window.location.reload();
              }
            }}
            className="w-full text-xs text-red hover:bg-red/10 flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('settings.delete_data')}
          </Button>
        </div>
      </div>
    </main>
  );
}
