"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginWithGoogleButton({
  nextPath,
}: {
  nextPath?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback${
        nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""
      }`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
      }
      // On success, the browser navigates away to Google.
    } catch (err) {
      console.error(err);
      toast.error("No pudimos iniciar el login.");
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      size="lg"
      variant="outline"
      className="w-full gap-3"
      onClick={handleClick}
      disabled={loading}
    >
      <GoogleIcon />
      {loading ? "Redirigiendo…" : "Continuar con Google"}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.44c-.28 1.4-1.11 2.59-2.35 3.39v2.82h3.79c2.22-2.04 3.61-5.05 3.61-8.45z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.94-2.92l-3.79-2.94c-1.05.7-2.39 1.12-4.15 1.12-3.19 0-5.89-2.15-6.85-5.05H1.27v3.03A11.99 11.99 0 0012 24z"
        fill="#34A853"
      />
      <path
        d="M5.15 14.21c-.24-.7-.38-1.45-.38-2.21s.14-1.51.38-2.21V6.76H1.27A12.007 12.007 0 000 12c0 1.94.47 3.77 1.27 5.24l3.88-3.03z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.36.61 4.61 1.8l3.38-3.38C17.95 1.18 15.24 0 12 0A12 12 0 001.27 6.76l3.88 3.03C6.11 6.9 8.81 4.75 12 4.75z"
        fill="#EA4335"
      />
    </svg>
  );
}
