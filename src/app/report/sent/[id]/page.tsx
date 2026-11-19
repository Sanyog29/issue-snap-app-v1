'use client';

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Share2, ArrowRight, Bell, AlertTriangle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { requestNotificationPermission } from '@/lib/firebase';
import { registerDevice } from '@/lib/notifications';
import type { Request } from '@/types/database';

export default function ReportSentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { t, tf } = useLanguage();
  const supabase = createClient();

  const [request, setRequest] = useState<Partial<Request> | null>(null);
  const [copied, setCopied] = useState(false);
  const [notifState, setNotifState] = useState<'idle' | 'enabling' | 'enabled'>('idle');
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadRequest() {
      const { data } = await supabase
        .from('requests')
        .select('*')
        .eq('id', resolvedParams.id)
        .single();

      if (data) setRequest(data as Request);
    }
    loadRequest();
  }, [resolvedParams.id, supabase]);

  const handleShare = () => {
    const trackUrl = `${window.location.origin}/track/${token || resolvedParams.id}`;
    if (navigator.share) {
      navigator.share({
        title: 'IssueSnap Complaint',
        text: `Track complaint status: ${request?.title || ''}`,
        url: trackUrl,
      });
    } else {
      navigator.clipboard.writeText(trackUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleEnablePush = async () => {
    try {
      setNotifState('enabling');
      setPushFeedback(null);
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) {
        await registerDevice(fcmToken);
        setNotifState('enabled');
        setPushFeedback('Push notifications enabled for this device.');
      } else {
        setNotifState('idle');
        if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
          setPushFeedback('Notifications are blocked in your browser settings.');
        } else {
          setPushFeedback('Push notification service not configured or unavailable. Realtime & email alerts remain active.');
        }
      }
    } catch {
      setNotifState('idle');
      setPushFeedback('Could not enable push notifications.');
    }
  };

  return (
    <main className="min-h-screen bg-bg text-ink flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto">
      <div className="space-y-6 pt-6">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-green/10 text-green flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {/* Headline */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
            {tf('sent.headline', { department: request?.department || 'Department' })}
          </h1>
          <p className="text-sm text-ink-muted">
            {tf('sent.usually_seen', { hours: 24 })}
          </p>
        </div>

        {/* Report ID Badge */}
        <div className="bg-surface border-2 border-line-soft rounded-photo p-4 text-center">
          <span className="text-xs uppercase font-bold text-ink-muted block mb-1">
            {t('sent.report_id')}
          </span>
          <span className="font-mono font-bold text-lg text-primary-ink select-all">
            #{resolvedParams.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Registered User Email Notice */}
        <div className="flex items-center gap-2.5 p-3.5 bg-surface border-2 border-line-soft rounded-control text-xs text-ink shadow-sm">
          <div className="p-1.5 rounded-full bg-primary/10 text-primary shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="leading-relaxed">
            <strong className="font-bold block text-ink">Confirmation Email Dispatched</strong>
            <span className="text-ink-muted">A tracking summary and receipt has been sent to your registered email address.</span>
          </div>
        </div>

        {/* Safety Call Notice */}
        {request?.priority === 'urgent' && (
          <div className="bg-red/10 border-l-4 border-red text-red p-3.5 rounded-control flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold">{t('sent.safety_call')}</span>
          </div>
        )}

        {/* Action: Push pre-prompt card */}
        {notifState !== 'enabled' ? (
          <div className="bg-surface border-2 border-line-soft rounded-photo p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 text-primary-ink shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="text-sm">
                <strong className="block font-bold text-ink">{t('notify.pre_prompt_title')}</strong>
                <span className="text-ink-muted text-xs">{t('notify.pre_prompt_body')}</span>
              </div>
            </div>
            {pushFeedback && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-control font-medium">
                {pushFeedback}
              </p>
            )}
            <Button
              type="button"
              onClick={handleEnablePush}
              disabled={notifState === 'enabling'}
              className="w-full h-11 bg-accent hover:bg-accent/90 text-on-accent font-semibold rounded-control text-sm"
            >
              {notifState === 'enabling' ? 'Enabling...' : t('notify.turn_on')}
            </Button>
          </div>
        ) : (
          <div className="p-3 bg-green/10 border border-green text-green text-xs font-semibold rounded-control text-center">
            {pushFeedback || 'Push notifications enabled for this device.'}
          </div>
        )}

        {/* Secondary Buttons */}
        <div className="space-y-3 pt-2">
          <Link href={`/track/${token || resolvedParams.id}`} className="block">
            <Button
              type="button"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded-control flex items-center justify-center gap-2"
            >
              {t('sent.track')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Button
            type="button"
            variant="outline"
            onClick={handleShare}
            className="w-full h-12 border-2 border-line text-ink font-semibold rounded-control flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            {copied ? 'Link Copied!' : t('sent.share')}
          </Button>
        </div>
      </div>

      {/* Return to Camera */}
      <footer className="py-6 text-center">
        <Link href="/" className="text-sm font-semibold text-primary-ink hover:underline">
          &larr; Back to Camera
        </Link>
      </footer>
    </main>
  );
}
