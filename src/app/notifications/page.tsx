'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Wrench,
  Eye,
  Inbox,
  Star,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/context';
import { markAllAsRead, markAsRead } from '@/lib/notifications';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/types/notifications';

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function loadNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/auth');
          return;
        }

        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }

        // Live Realtime listener for incoming notifications
        channel = supabase
          .channel('notifications-live')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              setNotifications((prev) => [payload.new as Notification, ...prev]);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const updated = payload.new as Notification;
              setNotifications((prev) =>
                prev.map((n) => (n.id === updated.id ? updated : n))
              );
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [router, supabase]);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleItemClick = async (item: Notification) => {
    if (!item.is_read) {
      await markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
    }
    if (item.url) {
      router.push(item.url);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'report_fixed':
        return <CheckCircle2 className="w-5 h-5 text-green" />;
      case 'report_in_progress':
        return <Wrench className="w-5 h-5 text-primary" />;
      case 'report_seen':
      case 'report_submitted':
        return <Eye className="w-5 h-5 text-primary" />;
      case 'queue_urgent':
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red" />;
      case 'rating_received':
        return <Star className="w-5 h-5 text-accent fill-accent" />;
      default:
        return <Bell className="w-5 h-5 text-primary" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filteredNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.is_read : true
  );

  return (
    <main className="min-h-screen bg-bg text-ink pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-line-soft px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>{t('general.back')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold text-ink">{t('notify.title')}</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-accent text-on-accent animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="text-xs font-semibold text-primary hover:underline disabled:opacity-40 flex items-center gap-1 transition-opacity"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>{t('notify.mark_all')}</span>
        </button>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Filter Pills */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface border border-line-soft text-ink-muted hover:text-ink'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface border border-line-soft text-ink-muted hover:text-ink'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                filter === 'unread' ? 'bg-on-primary text-primary' : 'bg-accent text-on-accent'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-ink-muted">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm">{t('general.loading')}...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-surface border border-line-soft rounded-2xl p-8 text-center space-y-3 my-8 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-surface/50 border border-line-soft flex items-center justify-center mx-auto text-ink-muted">
              <Inbox className="w-6 h-6 opacity-60" />
            </div>
            <h3 className="text-sm font-semibold text-ink">
              {filter === 'unread' ? 'No unread notifications' : t('notify.empty')}
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed max-w-xs mx-auto">
              Real-time alerts regarding your reported civic issues and municipal updates will appear here automatically.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex gap-3.5 relative overflow-hidden group ${
                item.is_read
                  ? 'bg-surface/70 border-line-soft hover:border-line'
                  : 'bg-surface border-primary/40 shadow-sm hover:border-primary'
              }`}
            >
              {!item.is_read && (
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}
              <div className="shrink-0 mt-0.5">
                <div className={`p-2 rounded-lg ${item.is_read ? 'bg-bg' : 'bg-primary/10'}`}>
                  {getIcon(item.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h2 className={`text-sm tracking-tight truncate ${item.is_read ? 'font-medium text-ink' : 'font-bold text-ink'}`}>
                    {item.title}
                  </h2>
                  <span className="text-[11px] text-ink-muted font-mono shrink-0">
                    {formatTimeAgo(item.created_at)}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed line-clamp-2">
                  {item.body}
                </p>
                {item.url && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-primary mt-2 group-hover:underline">
                    <span>View details</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
