import Image from 'next/image';

interface BeforeAfterProps {
  beforeUrl: string;
  afterUrl?: string | null;
}

export function BeforeAfter({ beforeUrl, afterUrl }: BeforeAfterProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase text-ink-muted">Resolution Verification</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Before */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-ink-muted">Original Issue</span>
          <div className="relative aspect-[4/3] rounded-photo overflow-hidden border-2 border-line-soft bg-surface">
            <Image src={beforeUrl} alt="Before" fill className="object-cover" />
          </div>
        </div>

        {/* After */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-green">Fixed Resolution</span>
          <div className="relative aspect-[4/3] rounded-photo overflow-hidden border-2 border-line-soft bg-surface flex items-center justify-center">
            {afterUrl ? (
              <Image src={afterUrl} alt="After" fill className="object-cover" />
            ) : (
              <div className="text-xs text-ink-muted italic">Pending resolution photo</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
