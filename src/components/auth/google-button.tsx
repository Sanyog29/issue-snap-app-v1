'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { initiateOAuthSignIn } from '@/modules/auth';

interface OAuthButtonProps {
  role?: 'citizen' | 'staff';
  label?: string;
  className?: string;
}

export function OAuthButton({
  role = 'citizen',
  label,
  className = '',
}: OAuthButtonProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const defaultLabel =
    role === 'staff' ? 'Sign in with Official OAuth' : 'Continue with OAuth';
  const buttonText = label || defaultLabel;

  const handleOAuthSignIn = async () => {
    try {
      setLoading(true);
      const res = await initiateOAuthSignIn(supabase, { role });
      if (!res.success && res.error) {
        console.error('OAuth sign-in error:', res.error);
        setLoading(false);
      }
    } catch (err) {
      console.error('OAuth sign-in error:', err);
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleOAuthSignIn}
      disabled={loading}
      className={`w-full h-12 border-2 border-line text-ink font-semibold hover:bg-surface/60 rounded-control flex items-center justify-center gap-2.5 transition-colors shadow-sm ${className}`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
          <KeyRound className="w-3.5 h-3.5" />
        </div>
      )}
      <span>{buttonText}</span>
    </Button>
  );
}

// Retain GoogleButton as alias for backward compatibility
export const GoogleButton = OAuthButton;
