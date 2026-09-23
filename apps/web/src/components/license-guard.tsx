// apps/web/src/components/license-guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LicenseGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    // No session — send to login with a return path
    if (!session) {
      const url = new URL("/login", window.location.origin);
      url.searchParams.set("callbackUrl", pathname);
      router.replace(url.pathname + url.search);
      return;
    }

    // Suspended — dead end
    if ((session.user as any).suspended === true) {
      router.replace("/license-expired");
      return;
    }

    // No license assigned yet — go activate
    if (!(session.user as any).licenseId) {
      router.replace("/activate");
      return;
    }

    // Validate the assigned license against the server.
    // On network error: fail closed. Do NOT grant access.
    let cancelled = false;

    fetch("/api/license/validate", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.valid) {
          router.replace("/license-expired");
          return;
        }
        setChecking(false);
      })
      .catch(() => {
        if (cancelled) return;
        // Fail closed — network error means we cannot prove the license is
        // valid, so treat it as invalid. The user retries by reloading.
        router.replace("/license-expired");
      });

    return () => {
      cancelled = true;
    };
  }, [session, status, router, pathname]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  return <>{children}</>;
}