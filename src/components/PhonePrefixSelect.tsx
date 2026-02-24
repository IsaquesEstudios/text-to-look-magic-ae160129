import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const phonePrefixes = [
  { code: "+1", country: "US/CA", format: "(000) 000-0000" },
  { code: "+55", country: "BR", format: "(00) 00000-0000" },
  { code: "+351", country: "PT", format: "900 000 000" },
  { code: "+44", country: "UK", format: "7000 000000" },
  { code: "+34", country: "ES", format: "600 000 000" },
  { code: "+33", country: "FR", format: "6 00 00 00 00" },
  { code: "+49", country: "DE", format: "1500 0000000" },
  { code: "+39", country: "IT", format: "300 000 0000" },
  { code: "+81", country: "JP", format: "90 0000 0000" },
  { code: "+86", country: "CN", format: "130 0000 0000" },
  { code: "+91", country: "IN", format: "90000 00000" },
  { code: "+61", country: "AU", format: "400 000 000" },
  { code: "+52", country: "MX", format: "55 0000 0000" },
  { code: "+54", country: "AR", format: "11 0000-0000" },
  { code: "+56", country: "CL", format: "9 0000 0000" },
  { code: "+57", country: "CO", format: "300 000 0000" },
  { code: "+971", country: "AE", format: "50 000 0000" },
];

export function getPhoneFormat(prefix: string) {
  return phonePrefixes.find((p) => p.code === prefix)?.format ?? "000000000";
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
