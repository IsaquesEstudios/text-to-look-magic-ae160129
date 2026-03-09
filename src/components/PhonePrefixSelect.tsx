import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import React, { useCallback } from "react";

export const phonePrefixes = [
  { code: "+1", country: "US/CA", format: "(000) 000-0000", maxDigits: 10 },
  { code: "+55", country: "BR", format: "(00) 00000-0000", maxDigits: 11 },
  { code: "+351", country: "PT", format: "900 000 000", maxDigits: 9 },
  { code: "+44", country: "UK", format: "7000 000000", maxDigits: 10 },
  { code: "+34", country: "ES", format: "600 000 000", maxDigits: 9 },
  { code: "+33", country: "FR", format: "6 00 00 00 00", maxDigits: 9 },
  { code: "+49", country: "DE", format: "1500 0000000", maxDigits: 11 },
  { code: "+39", country: "IT", format: "300 000 0000", maxDigits: 10 },
  { code: "+81", country: "JP", format: "90 0000 0000", maxDigits: 10 },
  { code: "+86", country: "CN", format: "130 0000 0000", maxDigits: 11 },
  { code: "+91", country: "IN", format: "90000 00000", maxDigits: 10 },
  { code: "+61", country: "AU", format: "400 000 000", maxDigits: 9 },
  { code: "+52", country: "MX", format: "55 0000 0000", maxDigits: 10 },
  { code: "+54", country: "AR", format: "11 0000-0000", maxDigits: 10 },
  { code: "+56", country: "CL", format: "9 0000 0000", maxDigits: 9 },
  { code: "+57", country: "CO", format: "300 000 0000", maxDigits: 10 },
  { code: "+971", country: "AE", format: "50 000 0000", maxDigits: 9 },
];

function getPrefix(code: string) {
  return phonePrefixes.find((p) => p.code === code);
}

export function getPhoneFormat(prefix: string) {
  return getPrefix(prefix)?.format ?? "000000000";
}

/** Apply a mask pattern to raw digits. 0 = digit slot, space/()-. = literal */
function applyMask(digits: string, format: string): string {
  let result = "";
  let di = 0;
  for (let i = 0; i < format.length && di < digits.length; i++) {
    const ch = format[i];
    if (/[0-9]/.test(ch)) {
      result += digits[di++];
    } else {
      result += ch;
      // don't consume a digit for separator chars
    }
  }
  return result;
}

/** Strip non-digit characters */
function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

interface PhonePrefixSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
}

export function PhonePrefixSelect({ value, onValueChange, id }: PhonePrefixSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className="w-[110px] shrink-0">
        <SelectValue placeholder="+00" />
      </SelectTrigger>
      <SelectContent className="bg-popover z-50">
        {phonePrefixes.map((p) => (
          <SelectItem key={p.code} value={p.code}>
            {p.code} {p.country}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface MaskedPhoneInputProps {
  prefix: string;
  value: string; // raw digits
  onChange: (rawDigits: string) => void;
  id?: string;
  required?: boolean;
}

export function MaskedPhoneInput({ prefix, value, onChange, id, required }: MaskedPhoneInputProps) {
  const pref = getPrefix(prefix);
  const format = pref?.format ?? "000000000";
  const maxDigits = pref?.maxDigits ?? 15;

  const displayValue = applyMask(value, format);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = onlyDigits(e.target.value).slice(0, maxDigits);
      onChange(raw);
    },
    [onChange, maxDigits],
  );

  return (
    <Input
      id={id}
      type="tel"
      value={displayValue}
      onChange={handleChange}
      placeholder={format}
      required={required}
      maxLength={format.length + 5}
    />
  );
}
