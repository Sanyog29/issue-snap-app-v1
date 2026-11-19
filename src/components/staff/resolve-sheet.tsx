'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import type { Request } from '@/types/database';
import { updateRequestStatus } from '@/modules/staff';

interface ResolveSheetProps {
  request: Request;
  isOpen: boolean;
  onClose: () => void;
  onResolved: (updated: Request) => void;
}

export function ResolveSheet({ request, isOpen, onClose, onResolved }: ResolveSheetProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoUri(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUri) {
      setErrorMsg('Resolution photo is required.');
      return;
    }
    if (!notes.trim()) {
      setErrorMsg('Resolution note is required.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      // Upload completion image
      const res = await fetch(photoUri);
      const blob = await res.blob();
      const fileName = `res-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('complaint-images')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      let completionUrl = photoUri;
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('complaint-images')
          .getPublicUrl(fileName);
        completionUrl = urlData.publicUrl;
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Update request status through decoupled Staff service (triggers email + audit trail)
      const result = await updateRequestStatus(supabase, {
        requestId: request.id,
        newStatus: 'resolved',
        oldStatus: request.status,
        completionImageUrl: completionUrl,
        staffNotes: notes.trim(),
        userId: user?.id,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to resolve issue');
      }

      onResolved(result.data);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resolve issue';
      setErrorMsg(msg);
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full p-5 bg-surface text-ink border-2 border-line-soft rounded-sheet sm:rounded-sheet">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-ink">
            Mark Issue as Resolved
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 bg-red/10 border-l-4 border-red text-red text-xs rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleResolve} className="space-y-4 pt-2">
          {/* Resolution Photo Upload */}
          <div>
            <label className="block text-xs font-bold uppercase text-ink-muted mb-1.5">
              Upload After Photo <span className="text-red">*</span>
            </label>
            {photoUri ? (
              <div className="relative aspect-[4/3] rounded-photo overflow-hidden border-2 border-primary mb-2">
                <Image src={photoUri} alt="Resolution" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUri(null)}
                  className="absolute bottom-2 right-2 px-2.5 py-1 bg-surface/90 text-xs font-semibold rounded shadow"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-line hover:border-primary-ink rounded-photo p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-bg/50">
                <Camera className="w-8 h-8 text-primary-ink mb-1.5" />
                <span className="text-xs font-bold text-ink">Take or Select Photo</span>
                <span className="text-[11px] text-ink-muted mt-0.5">Proof of work completed</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Resolution Notes */}
          <div>
            <label className="block text-xs font-bold uppercase text-ink-muted mb-1.5">
              Resolution Note <span className="text-red">*</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe work performed (e.g. Pothole filled and leveled with hot asphalt mix)..."
              rows={3}
              required
              className="text-sm border-2 border-line rounded-control text-ink bg-bg"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={saving || !photoUri || !notes.trim()}
              className="w-full h-12 bg-accent hover:bg-accent/90 text-on-accent font-bold rounded-control flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Confirm Resolution
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
