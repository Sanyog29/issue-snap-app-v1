'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, Filter, AlertCircle, Loader2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/tracking/status-chip';
import { useLanguage } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import type { Request } from '@/types/database';

export default function StaffQueuePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const supabase = createClient();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  useEffect(() => {
    async function loadQueue() {
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

      // Fetch requests
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        setRequests(data as Request[]);
      }
      setLoading(false);
    }

    loadQueue();

    // Subscribe to live queue updates
    const channel = supabase
      .channel('staff-queue-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRequests((prev) => [payload.new as Request, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRequests((prev) =>
              prev.map((r) => (r.id === payload.new.id ? (payload.new as Request) : r))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  const filteredRequests = requests.filter((r) => {
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (selectedPriority !== 'all' && r.priority !== selectedPriority) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-bg text-ink pb-20">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-line-soft px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          <h1 className="text-base font-bold text-ink">{t('staff.queue')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/notifications">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-ink-muted hover:text-primary flex items-center gap-1.5"
            >
              <Bell className="w-4 h-4 text-primary" />
              <span>Alerts</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-xs text-ink-muted hover:text-red flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            {t('settings.sign_out')}
          </Button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Sticky Filters Row */}
        <div className="flex gap-2 p-1.5 bg-surface border border-line-soft rounded-control text-xs font-semibold overflow-x-auto">
          <div className="flex items-center gap-1.5 px-2 text-ink-muted">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-transparent border border-line-soft rounded px-2 py-1 outline-none text-ink font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">New / Submitted</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="reopened">Reopened</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-transparent border border-line-soft rounded px-2 py-1 outline-none text-ink font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Queue Items */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-ink-muted">
            <Loader2 className="w-8 h-8 animate-spin text-primary-ink" />
            <span className="text-sm">{t('general.loading')}...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-surface border-2 border-line-soft rounded-photo p-8 text-center space-y-2 my-8">
            <p className="text-sm font-medium text-ink-muted">
              {t('staff.empty')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => (
              <Link
                key={req.id}
                href={`/staff/${req.id}`}
                className="block bg-surface border-2 border-line-soft hover:border-primary-ink rounded-photo p-4 transition-colors shadow-sm relative overflow-hidden"
              >
                {/* 4px Left edge priority bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    req.priority === 'urgent'
                      ? 'bg-red'
                      : req.priority === 'high'
                      ? 'bg-amber'
                      : 'bg-primary-ink'
                  }`}
                />

                <div className="flex gap-3 pl-1">
                  <div className="relative w-20 h-20 rounded-md overflow-hidden shrink-0 border border-line-soft">
                    <Image
                      src={req.original_image_url}
                      alt={req.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-ink-muted">
                          #{req.id.slice(0, 8).toUpperCase()}
                        </span>
                        <StatusChip status={req.status} />
                      </div>
                      <h2 className="text-sm font-bold text-ink truncate mt-1">{req.title}</h2>
                      <p className="text-xs text-ink-muted truncate mt-0.5">
                        📍 {req.location_address || 'Unspecified'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-line-soft/60">
                      <span className="font-semibold text-primary-ink">{req.category || 'Issue'}</span>
                      <span className="font-mono">{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
