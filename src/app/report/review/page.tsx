'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles, AlertTriangle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SurveyFrame } from '@/components/capture/survey-frame';
import { DraftTag } from '@/components/report/draft-tag';
import { useLanguage } from '@/i18n/context';
import { analyzeImage } from '@/ai/flows/analyze-image';
import { createClient } from '@/lib/supabase/client';
import {
  getSessionStorageItem,
  removeSessionStorageItem,
} from '@/lib/storage';
import { CATEGORIES, type Category, type Priority } from '@/types/ai';
import { submitComplaintReport } from '@/modules/reports';

export default function ReportReviewPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const supabase = createClient();

  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('My Location');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  // AI draft state
  const [analyzing, setAnalyzing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [department, setDepartment] = useState('Public Works');
  const [priority, setPriority] = useState<Priority>('medium');
  const [confidence, setConfidence] = useState(0.85);
  const [safetyFlag, setSafetyFlag] = useState(false);
  const [reporterPhone, setReporterPhone] = useState('');

  useEffect(() => {
    const storedPhoto = getSessionStorageItem('issuesnap_pending_photo');
    if (!storedPhoto) {
      router.replace('/');
      return;
    }
    setPhotoDataUri(storedPhoto);

    const storedAddress = getSessionStorageItem('issuesnap_pending_address');
    if (storedAddress) setAddress(storedAddress);

    const storedCoords = getSessionStorageItem('issuesnap_pending_coords');
    if (storedCoords) {
      try {
        setCoords(JSON.parse(storedCoords));
      } catch {
        // invalid coordinates format in storage
      }
    }

    // Run VLM tool-use flow
    async function runAnalysis(photo: string) {
      try {
        setAnalyzing(true);
        const result = await analyzeImage({
          photoDataUri: photo,
          locationAddress: storedAddress || undefined,
          language: language,
        });

        setTitle(result.title);
        setDescription(result.description);
        if (result.category) setCategory(result.category);
        if (result.department_id) setDepartment(result.department_id);
        setPriority(result.priority);
        setConfidence(result.confidence);
        setSafetyFlag(result.safety_flag);
      } catch (err) {
        console.warn('VLM analysis error, falling back to manual entry:', err);
        setTitle('Civic Issue');
        setDescription('Please describe the issue observed.');
      } finally {
        setAnalyzing(false);
      }
    }

    runAnalysis(storedPhoto);
  }, [router, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoDataUri) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);

      // Check current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      // Submit report through decoupled Reports service
      const result = await submitComplaintReport(supabase, {
        title,
        description,
        category,
        department,
        priority,
        locationLat: coords.lat,
        locationLng: coords.lng,
        locationAddress: address,
        reporterId: user?.id,
        reporterEmail: user?.email,
        reporterPhone: reporterPhone || user?.phone,
        photoDataUri,
        aiAnalysisData: {
          confidence,
          safety_flag: safetyFlag,
          model: 'gemini-2.5-flash',
          detected_objects: [],
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit report');
      }

      // Clean up session storage
      removeSessionStorageItem('issuesnap_pending_photo');
      removeSessionStorageItem('issuesnap_pending_coords');
      removeSessionStorageItem('issuesnap_pending_address');

      router.push(`/report/sent/${result.requestId}?token=${result.trackingToken || ''}`);
    } catch (err: unknown) {
      // Extract detailed error message from Supabase or standard Error
      let msg = 'Failed to submit report';
      if (typeof err === 'object' && err !== null) {
        const anyErr = err as Record<string, unknown>;
        if (typeof anyErr.message === 'string') {
          msg = anyErr.message;
        } else if (typeof anyErr.error_description === 'string') {
          msg = anyErr.error_description;
        } else if (typeof anyErr.details === 'string') {
          msg = anyErr.details;
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setErrorMsg(msg);
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg text-ink pb-24">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-line-soft px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-primary-ink">
          <ArrowLeft className="w-5 h-5" />
          <span>{t('general.back')}</span>
        </Link>
        <span className="text-sm font-bold text-ink">{t('report.check')}</span>
        <div className="w-12" />
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Photo with Survey Frame */}
        {photoDataUri && (
          <SurveyFrame className="w-full aspect-[4/3] bg-surface relative shadow-sm">
            <Image
              src={photoDataUri}
              alt="Issue photo"
              fill
              className="object-cover"
            />
          </SurveyFrame>
        )}

        {/* Safety Alert Banner */}
        {safetyFlag && (
          <div className="bg-red/10 border-l-4 border-red text-red p-3.5 rounded-control flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <strong className="block font-semibold">Immediate Safety Hazard Flagged</strong>
              <span>Priority escalated to Urgent. If anyone is in immediate physical danger, call 112.</span>
            </div>
          </div>
        )}

        {/* AI Draft Tag (Shown while analyzing or once ready) */}
        {analyzing ? (
          <div className="bg-surface border-2 border-line-soft rounded-photo p-6 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-primary-ink" />
            <p className="text-sm font-medium text-ink">{t('ai.reading')}...</p>
          </div>
        ) : (
          <DraftTag
            title={title}
            category={category}
            department={department}
            priority={priority}
            confidence={confidence}
          />
        )}

        {errorMsg && (
          <div className="p-3.5 bg-red/10 border-l-4 border-red text-red text-sm rounded">
            {errorMsg}
          </div>
        )}

        {/* Inline Editable Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-ink-muted mb-1">
              {t('report.title')}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={analyzing || submitting}
              className="h-11 border-2 border-line rounded-control text-ink bg-surface text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-ink-muted mb-1">
              {t('report.whats_wrong')}
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
              disabled={analyzing || submitting}
              className="border-2 border-line rounded-control text-ink bg-surface text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-ink-muted mb-1">
                {t('report.category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                disabled={analyzing || submitting}
                className="w-full h-11 border-2 border-line rounded-control text-ink bg-surface text-sm font-medium px-3 outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-ink-muted mb-1">
                {t('report.department')}
              </label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={analyzing || submitting}
                className="h-11 border-2 border-line rounded-control text-ink bg-surface text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-ink-muted mb-1">
              {t('report.location')}
            </label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={submitting}
              className="h-11 border-2 border-line rounded-control text-ink bg-surface text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-ink-muted mb-1">
              {t('report.phone_optional')}
            </label>
            <Input
              type="tel"
              value={reporterPhone}
              onChange={(e) => setReporterPhone(e.target.value)}
              placeholder="+91..."
              disabled={submitting}
              className="h-11 border-2 border-line rounded-control text-ink bg-surface text-sm"
            />
          </div>

          {/* Sticky Bottom Submit Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface/95 border-t border-line-soft max-w-md mx-auto z-40">
            <Button
              type="submit"
              disabled={analyzing || submitting || !title}
              className="w-full h-14 bg-accent hover:bg-accent/90 text-on-accent text-base font-bold rounded-control shadow-md flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {t('report.send')}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
