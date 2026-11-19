'use client';

import { Input } from '@/components/ui/input';

interface PhoneInputProps {
  countryCode: string;
  onCountryCodeChange: (code: string) => void;
  phone: string;
  onPhoneChange: (val: string) => void;
  disabled?: boolean;
}

export function PhoneInput({
  countryCode,
  onCountryCodeChange,
  phone,
  onPhoneChange,
  disabled = false,
}: PhoneInputProps) {
  return (
    <div className="flex w-full items-center border-2 border-line focus-within:border-primary-ink focus-within:ring-2 focus-within:ring-primary-ink/20 rounded-control overflow-hidden h-12 bg-surface">
      <select
        value={countryCode}
        onChange={(e) => onCountryCodeChange(e.target.value)}
        disabled={disabled}
        aria-label="Country Code"
        className="h-full bg-transparent border-r-2 border-line px-3 text-ink text-sm font-medium focus:outline-none min-w-[76px]"
      >
        <option value="+91">+91 (IN)</option>
        <option value="+1">+1 (US)</option>
        <option value="+44">+44 (UK)</option>
        <option value="+61">+61 (AU)</option>
      </select>
      <Input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="98480 12345"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value.replace(/[^0-9]/g, ''))}
        disabled={disabled}
        className="h-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-ink text-base px-3 tracking-wide"
      />
    </div>
  );
}
