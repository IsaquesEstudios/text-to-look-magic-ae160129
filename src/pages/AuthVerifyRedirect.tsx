import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import discoveryLogo from "@/assets/discovery-logo.png";

const CANONICAL_ORIGIN = "https://app.discoveryinvestimentos.com";

const getSafeResetUrl = () => {
  return `${CANONICAL_ORIGIN}/reset-password`;
};

export default function AuthVerifyRedirect() {
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const verifyUrl = new URL(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/verify`);

    currentUrl.searchParams.forEach((value, key) => {
      if (key !== "redirect_to") {
        verifyUrl.searchParams.set(key, value);
      }
    });

    verifyUrl.searchParams.set("redirect_to", getSafeResetUrl());
    window.location.replace(verifyUrl.toString());
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <img src={discoveryLogo} alt="Discovery" className="h-12 mb-6" />
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
