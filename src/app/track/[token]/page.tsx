'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, Star, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/tracking/status-chip';
import { BeforeAfter } from '@/components/tracking/before-after';
import { useLanguage } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import type { Request, RequestUpdate } from '@/types/database';

export default function PublicTrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const { t } = useLanguage();
  const supabase = createClient();

  const [request, setRequest] = useState<Request | null>(null);
  const [updates, setUpdates] = useState<RequestUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number>(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Find request by tracking_token or ID (sanitizing any share text)
      const rawToken = resolvedParams.token ? decodeURIComponent(resolvedParams.token).trim() : '';
      const cleanToken = rawToken.split(/\s+/)[0] || rawToken;

      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .or(`tracking_token.eq.${cleanToken},id.eq.${cleanToken}`)
        .single();

      if (data && !error) {
        setRequest(data as Request);
        if (data.citizen_rating) {
          setRating(data.citizen_rating);
          setRatingSubmitted(true);
        }

        // Fetch updates thread
        const { data: updateData } = await supabase
          .from('request_updates')
          .select('*')
          .eq('request_id', data.id)
          .order('created_at', { ascending: false });

        if (updateData) setUpdates(updateData as RequestUpdate[]);
      }
      setLoading(false);
    }

    loadData();

    // Subscribe to Realtime changes on this specific request
    const channel = supabase
      .channel(`request-${resolvedParams.token}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests' },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as Request;
            setRequest((prev) => (prev && prev.id === updated.id ? updated : prev));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'request_updates' },
        (payload) => {
          if (payload.new) {
            const newUpdate = payload.new as RequestUpdate;
            setUpdates((prev) => {
              if (prev.some((u) => u.id === newUpdate.id)) return prev;
              return [newUpdate, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resolvedParams.token, supabase]);

  const handleRating = async (stars: number) => {
    if (!request) return;
    setRating(stars);
    setRatingSubmitted(true);

    await supabase
      .from('requests')
      .update({ citizen_rating: stars })
      .eq('id', request.id);
  };

  const handleReopen = async () => {
    if (!request) return;
    await supabase
      .from('requests')
      .update({ status: 'reopened' })
      .eq('id', request.id);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('request_updates').insert({
        request_id: request.id,
        user_id: user.id,
        update_type: 'Report reopened by citizen',
      });
    }

    setRequest({ ...request, status: 'reopened' });
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg text-ink">
        <Loader2 className="w-8 h-8 animate-spin text-primary-ink" />
      </main>
    );
  }

  if (!request) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-bg text-ink">
        <h1 className="text-xl font-bold mb-2">Report Not Found</h1>
        <p className="text-sm text-ink-muted mb-6">
          The requested tracking token or ID is invalid or expired.
        </p>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90 text-on-primary font-bold">
            Back to Home
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg text-ink pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-line-soft px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-primary-ink">
          <ArrowLeft className="w-5 h-5" />
          <span>{t('general.back')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green animate-pulse" />
          <span className="text-xs font-bold text-green uppercase tracking-wide">
            {t('track.live')}
          </span>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Issue Details Card */}
        <div className="bg-surface border-2 border-line-soft rounded-photo p-4 space-y-3">
          <div className="flex items-center justify-between">
            <StatusChip status={request.status} department={request.department} />
            <span className="text-xs font-mono font-bold text-ink-muted">
              #{request.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <h1 className="text-xl font-bold text-ink leading-snug">{request.title}</h1>
          <p className="text-sm text-ink-muted leading-relaxed">{request.description}</p>

          <div className="text-xs text-ink-muted pt-2 border-t border-line-soft space-y-1">
            <div>📍 <strong>Location:</strong> {request.location_address || 'Unspecified'}</div>
            <div>🏢 <strong>Department:</strong> {request.department || 'Unassigned'}</div>
            <div>⏱ <strong>Reported:</strong> {new Date(request.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Before / After Section (if resolved) */}
        {request.status === 'resolved' && (
          <BeforeAfter
            beforeUrl={request.original_image_url}
            afterUrl={request.completion_image_url}
          />
        )}

        {/* Rating and Reopen (if resolved) */}
        {request.status === 'resolved' && (
          <div className="bg-surface border-2 border-line-soft rounded-photo p-4 space-y-3 text-center">
            <h3 className="text-sm font-bold text-ink">{t('track.rate')}</h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? 'fill-accent text-accent' : 'text-line-soft'
                    }`}
                  />
                </button>
              ))}
            </div>
            {ratingSubmitted && (
              <p className="text-xs text-green font-semibold">Thank you for rating!</p>
            )}

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReopen}
                className="text-xs border-line text-ink-muted hover:text-red hover:border-red"
              >
                <RefreshCcw className="w-3.5 h-3.5 mr-1" />
                {t('track.not_fixed')}
              </Button>
            </div>
          </div>
        )}

        {/* Vertical Status Updates Thread */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase text-ink-muted tracking-wider">
            Status Updates
          </h2>

          <div className="space-y-4 relative border-l-2 border-line-soft ml-3 pl-4">
            {/* Initial submission event */}
            <div className="relative">
              <span className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface" />
              <div className="text-sm font-semibold text-ink">Complaint Registered</div>
              <div className="text-xs text-ink-muted">
                {new Date(request.created_at).toLocaleString()}
              </div>
            </div>

            {/* Dynamic request_updates items */}
            {updates.map((update) => (
              <div key={update.id} className="relative">
                <span className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-green border-2 border-surface" />
                <div className="text-sm font-semibold text-ink">{update.update_type}</div>
                {update.image_url && (
                  <div className="relative w-28 h-20 rounded-md overflow-hidden my-1.5 border border-line-soft">
                    <Image src={update.image_url} alt="Update" fill className="object-cover" />
                  </div>
                )}
                <div className="text-xs text-ink-muted">
                  {new Date(update.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
