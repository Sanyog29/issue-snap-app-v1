'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/tracking/status-chip';
import { useLanguage } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import type { Request } from '@/types/database';

export default function MyReportsPage() {
  const { t } = useLanguage();
  const supabase = createClient();

  const [reports, setReports] = useState<Request[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'fixed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMyReports() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setReports(data as Request[]);
      }
      setLoading(false);
    }

    loadMyReports();
  }, [supabase]);

  const filteredReports = reports.filter((r) => {
    if (filter === 'open') return r.status !== 'resolved';
    if (filter === 'fixed') return r.status === 'resolved';
    return true;
  });

  return (
    <main className="min-h-screen bg-bg text-ink pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-line-soft px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-primary-ink">
          <ArrowLeft className="w-5 h-5" />
          <span>{t('general.back')}</span>
        </Link>
        <h1 className="text-base font-bold text-ink">{t('my.title')}</h1>
        <Link href="/">
          <Button size="sm" className="h-8 bg-accent hover:bg-accent/90 text-on-accent font-semibold px-2.5 rounded-control">
            <Plus className="w-4 h-4 mr-1" />
            Snap
          </Button>
        </Link>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-surface rounded-control border border-line-soft text-sm font-medium">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`py-1.5 rounded-control text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-primary-ink text-white'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t('my.all')} ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('open')}
            className={`py-1.5 rounded-control text-xs font-semibold transition-colors ${
              filter === 'open'
                ? 'bg-primary-ink text-white'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t('my.open')} (
            {reports.filter((r) => r.status !== 'resolved').length}
            )
          </button>
          <button
            type="button"
            onClick={() => setFilter('fixed')}
            className={`py-1.5 rounded-control text-xs font-semibold transition-colors ${
              filter === 'fixed'
                ? 'bg-primary-ink text-white'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {t('my.fixed')} (
            {reports.filter((r) => r.status === 'resolved').length}
            )
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-ink-muted">
            <Loader2 className="w-7 h-7 animate-spin text-primary-ink" />
            <span className="text-sm">{t('general.loading')}</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-surface border-2 border-line-soft rounded-photo p-8 text-center space-y-4 my-8">
            <p className="text-sm text-ink-muted leading-relaxed">{t('my.empty')}</p>
            <Link href="/">
              <Button className="bg-accent hover:bg-accent/90 text-on-accent font-bold rounded-control">
                {t('my.empty_action')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <Link
                key={report.id}
                href={`/me/${report.id}`}
                className="block bg-surface border-2 border-line-soft hover:border-line rounded-photo p-3.5 transition-colors shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 border border-line-soft">
                    <Image
                      src={report.original_image_url}
                      alt={report.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-ink truncate">{report.title}</h2>
                      <p className="text-xs text-ink-muted truncate mt-0.5">
                        {report.location_address || 'Unspecified location'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <StatusChip status={report.status} />
                      <span className="text-[11px] text-ink-muted font-mono">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
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
