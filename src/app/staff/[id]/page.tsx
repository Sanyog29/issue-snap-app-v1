'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MapPin, CheckCircle, Wrench, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/tracking/status-chip';
import { ResolveSheet } from '@/components/staff/resolve-sheet';
import { useLanguage } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import type { Request, RequestUpdate } from '@/types/database';
import { updateRequestStatus } from '@/modules/staff';

export default function StaffWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolved = use(params);
  const router = useRouter();
  const { t } = useLanguage();
  const supabase = createClient();

  const [request, setRequest] = useState<Request | null>(null);
  const [updates, setUpdates] = useState<RequestUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadIssue() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      // Role check: only staff or admin allowed
      const { data: profile } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (!profile || (profile.user_type !== 'staff' && profile.user_type !== 'admin')) {
        router.replace('/auth?tab=employee&error=NotStaff');
        return;
      }

      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('id', resolved.id)
        .single();

      if (data && !error) {
        setRequest(data as Request);

        const { data: updateData } = await supabase
          .from('request_updates')
          .select('*')
          .eq('request_id', data.id)
          .order('created_at', { ascending: false });

        if (updateData) setUpdates(updateData as RequestUpdate[]);
      }
      setLoading(false);
    }

    loadIssue();
  }, [resolved.id, router, supabase]);

  const handleStatusChange = async (nextStatus: 'in_progress' | 'acknowledged') => {
    if (!request) return;
    try {
      setUpdatingStatus(true);
      const { data: { user } } = await supabase.auth.getUser();
      const result = await updateRequestStatus(supabase, {
        requestId: request.id,
        newStatus: nextStatus,
        oldStatus: request.status,
        userId: user?.id,
      });

      if (result.success && result.data) {
        setRequest(result.data);
      }
    } catch {
      // Failed to update status
    } finally {
      setUpdatingStatus(false);
    }
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
        <h1 className="text-xl font-bold mb-2">Issue Not Found</h1>
        <Link href="/staff">
          <Button className="bg-primary text-on-primary">Back to {t('staff.queue')}</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg text-ink pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-line-soft px-4 py-3 flex items-center justify-between">
        <Link href="/staff" className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-primary-ink">
          <ArrowLeft className="w-5 h-5" />
          <span>{t('staff.queue')}</span>
        </Link>
        <span className="font-mono font-bold text-xs text-ink-muted">
          #{request.id.slice(0, 8).toUpperCase()}
        </span>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Main Photo */}
        <div className="relative aspect-[4/3] rounded-photo overflow-hidden border-2 border-line-soft bg-surface shadow-sm">
          <Image
            src={request.original_image_url}
            alt={request.title}
            fill
            className="object-cover"
          />
        </div>

        {/* Status + Metadata Overview */}
        <div className="bg-surface border-2 border-line-soft rounded-photo p-4 space-y-4">
          <div className="flex items-center justify-between">
            <StatusChip status={request.status} />
            <span
              className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded ${
                request.priority === 'urgent'
                  ? 'bg-red/10 text-red'
                  : request.priority === 'high'
                  ? 'bg-amber/10 text-amber'
                  : 'bg-primary/10 text-primary-ink'
              }`}
            >
              Priority: {request.priority}
            </span>
          </div>

          <div>
            <h1 className="text-xl font-bold text-ink">{request.title}</h1>
            <p className="text-sm text-ink-muted mt-1 leading-relaxed">{request.description}</p>
          </div>

          <div className="text-xs text-ink-muted pt-3 border-t border-line-soft space-y-1.5">
            <div className="flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span><strong>Location:</strong> {request.location_address || 'Unspecified'} ({request.location_lat.toFixed(4)}, {request.location_lng.toFixed(4)})</span>
            </div>
            {request.reporter_phone && (
              <div>📞 <strong>Reporter Contact:</strong> {request.reporter_phone}</div>
            )}
            <div>🏢 <strong>Department:</strong> {request.department}</div>
            <div>⏱ <strong>Reported on:</strong> {new Date(request.created_at).toLocaleString()}</div>
          </div>
        </div>

        {/* AI VLM Inspection summary */}
        {request.ai_analysis_data && (
          <div className="bg-surface border-2 border-line-soft rounded-photo p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase text-ink-muted">AI Diagnostic Summary</h3>
            <div className="text-xs text-ink space-y-1">
              <div>Model: <span className="font-mono text-ink-muted">{request.ai_analysis_data.model}</span></div>
              <div>Confidence: <span className="font-bold text-primary-ink">{Math.round((request.ai_analysis_data.confidence || 0.8) * 100)}%</span></div>
              {request.ai_analysis_data.safety_flag && (
                <div className="text-red font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Public safety risk detected by AI vision system.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Work Activity Log */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase text-ink-muted">Activity History</h2>
          <div className="border-l-2 border-line-soft ml-3 pl-4 space-y-3">
            {updates.map((up) => (
              <div key={up.id} className="relative">
                <span className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-surface" />
                <div className="text-xs font-bold text-ink">{up.update_type}</div>
                <div className="text-[11px] text-ink-muted">{new Date(up.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Actions Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface/95 border-t border-line-soft max-w-2xl mx-auto z-40 flex gap-3">
          {request.status !== 'in_progress' && request.status !== 'resolved' && (
            <Button
              type="button"
              variant="outline"
              disabled={updatingStatus}
              onClick={() => handleStatusChange('in_progress')}
              className="flex-1 h-12 border-2 border-primary-ink text-primary-ink font-bold rounded-control"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Start Work
            </Button>
          )}

          {request.status !== 'resolved' && (
            <Button
              type="button"
              onClick={() => setIsResolveOpen(true)}
              className="flex-1 h-12 bg-accent hover:bg-accent/90 text-on-accent font-bold rounded-control shadow-md"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Resolved
            </Button>
          )}
        </div>
      </div>

      {/* Resolve Dialog Modal */}
      {isResolveOpen && (
        <ResolveSheet
          request={request}
          isOpen={isResolveOpen}
          onClose={() => setIsResolveOpen(false)}
          onResolved={(updated) => setRequest(updated)}
        />
      )}
    </main>
  );
}
