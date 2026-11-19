'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Image as ImageIcon, MapPin, Settings, Loader2, LogIn, User as UserIcon, Shield, Bell } from 'lucide-react';
import { SurveyFrame } from '@/components/capture/survey-frame';
import { useLanguage } from '@/i18n/context';
import { createClient } from '@/lib/supabase/client';
import { setSessionStorageItem } from '@/lib/storage';

export default function CapturePage() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [locationStr, setLocationStr] = useState<string>('Detecting...');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string; isStaff?: boolean } | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Request camera stream
  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = mediaStream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setCameraActive(false);
    }
  }, []);

  // Auto-acquire location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationStr(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        () => {
          setLocationStr('Location unavailable');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationStr('Geolocation not supported');
    }

    startCamera();

    // Check signed in user status & unread notifications
    const supabase = createClient();
    let notifChannel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', user.id)
          .single();
        setCurrentUser({
          id: user.id,
          email: user.email,
          isStaff: profile?.user_type === 'staff' || profile?.user_type === 'admin',
        });

        // Fetch unread notification count
        try {
          const res = await fetch('/api/notifications/unread-count');
          if (res.ok) {
            const data = await res.json();
            setUnreadCount(data.count ?? 0);
          }
        } catch {
          // non-blocking
        }

        // Live Realtime listener for incoming notifications
        notifChannel = supabase
          .channel(`user-notifs-badge-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              setUnreadCount((prev) => prev + 1);
            }
          )
          .subscribe();
      }
    });

    return () => {
      if (notifChannel) {
        supabase.removeChannel(notifChannel);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [startCamera]);

  // Compress and resize image to keep uploads fast and light (< 250KB)
  const compressImage = (img: HTMLImageElement | HTMLVideoElement): string => {
    const canvas = document.createElement('canvas');
    const maxDim = 1280;
    const origWidth = 'videoWidth' in img ? img.videoWidth : img.naturalWidth || img.width;
    const origHeight = 'videoHeight' in img ? img.videoHeight : img.naturalHeight || img.height;

    let width = origWidth;
    let height = origHeight;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width || 640;
    canvas.height = height || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  // Snap photo from live video canvas
  const handleShutter = () => {
    const video = videoRef.current;
    if (!video || !cameraActive || !video.videoWidth) {
      fileInputRef.current?.click();
      return;
    }

    const dataUri = compressImage(video);
    if (dataUri) {
      proceedToReview(dataUri);
    }
  };

  // Upload photo from gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUri = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const compressed = compressImage(img);
        proceedToReview(compressed || rawDataUri);
      };
      img.onerror = () => {
        proceedToReview(rawDataUri);
      };
      img.src = rawDataUri;
    };
    reader.readAsDataURL(file);
  };

  const proceedToReview = (dataUri: string) => {
    setIsProcessing(true);
    stopCamera();
    setSessionStorageItem('issuesnap_pending_photo', dataUri);
    if (coords) {
      setSessionStorageItem('issuesnap_pending_coords', JSON.stringify(coords));
    }
    setSessionStorageItem('issuesnap_pending_address', locationStr);
    router.push('/report/review');
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col bg-[#0B1820] text-[#E6EEF3] select-none justify-between overflow-hidden">
      {/* Top Header */}
      <header className="flex items-center justify-between p-4 z-20">
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/10 text-sm font-medium hover:bg-surface/20 transition-colors">
              <Settings className="w-4 h-4" />
              {t('capture.settings')}
            </button>
          </Link>

          {currentUser ? (
            currentUser.isStaff ? (
              <Link href="/staff">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/40 text-xs font-bold hover:bg-primary/30 transition-colors">
                  <Shield className="w-3.5 h-3.5" />
                  Staff
                </button>
              </Link>
            ) : (
              <Link href="/me">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/10 text-xs font-semibold hover:bg-surface/20 transition-colors text-ink">
                  <UserIcon className="w-3.5 h-3.5 text-primary" />
                  Account
                </button>
              </Link>
            )
          ) : (
            <Link href="/auth">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent hover:bg-accent/90 text-on-accent text-xs font-bold transition-all shadow-sm">
                <LogIn className="w-3.5 h-3.5" />
                Login
              </button>
            </Link>
          )}

          {currentUser && (
            <Link href="/notifications">
              <button
                className="relative flex items-center justify-center p-2 rounded-full bg-surface/10 hover:bg-surface/20 transition-colors text-ink"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-primary" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-accent text-[10px] font-bold text-on-accent flex items-center justify-center animate-pulse shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            const nextLang = language === 'en' ? 'hi' : language === 'hi' ? 'te' : 'en';
            setLanguage(nextLang);
          }}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-surface/10 text-primary hover:bg-surface/20 transition-colors"
          title="Change language"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {language === 'hi' ? 'हिन्दी' : language === 'te' ? 'తెలుగు' : 'English'}
        </button>
      </header>

      {/* Main Viewfinder Frame */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <SurveyFrame className="w-full max-w-sm aspect-[3/4] bg-[#13242E] shadow-2xl flex items-center justify-center relative">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-center p-6 text-ink-muted">
              <Camera className="w-14 h-14 mb-3 text-primary opacity-60" />
              <p className="text-sm font-medium">{t('capture.hint')}</p>
              <p className="text-xs mt-1 text-[#9FB1BC] opacity-80">{t('capture.camera_off')}</p>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-[#0B1820]/80 flex flex-col items-center justify-center gap-3 z-30">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm font-medium text-white">{t('ai.reading')}...</span>
            </div>
          )}
        </SurveyFrame>
      </div>

      {/* Bottom Controls */}
      <footer className="p-4 pb-8 flex flex-col items-center gap-4 z-20">
        <div className="flex items-center justify-around w-full max-w-xs">
          {/* Gallery Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex flex-col items-center gap-1 text-xs text-[#9FB1BC] hover:text-white transition-colors"
          >
            <div className="w-11 h-11 rounded-full bg-surface/10 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            {t('capture.choose_photo')}
          </button>

          {/* Shutter Button (Coral CTA) */}
          <button
            type="button"
            onClick={handleShutter}
            disabled={isProcessing}
            className="w-20 h-20 rounded-full bg-accent flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            aria-label="Snap Photo"
          >
            <div className="w-16 h-16 rounded-full border-4 border-[#0E2230] bg-transparent" />
          </button>

          {/* Location Badge */}
          <div className="flex flex-col items-center gap-1 text-xs text-[#9FB1BC]">
            <div className="w-11 h-11 rounded-full bg-surface/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <span className="truncate max-w-[70px]">{coords ? 'Ready' : 'Loc'}</span>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* My Reports Link */}
        <Link
          href="/me"
          className="text-sm font-medium text-primary hover:underline pt-2 tracking-wide"
        >
          {t('capture.my_reports')} &rarr;
        </Link>
      </footer>
    </main>
  );
}
