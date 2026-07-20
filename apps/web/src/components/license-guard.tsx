// apps/web/src/components/license-guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LicenseGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    // If the user is suspended, redirect to a suspended page (or expired page for now)
    if ((session.user as any).suspended) {
      router.push("/license-expired");
      return;
    }

    // If no license assigned, redirect to activate
    if (!(session.user as any).licenseId) {
      router.push("/activate");
      return;
    }

    // Verify license validity
    fetch("/api/license/validate")
      .then((res) => res.json())
      .then((data) => {
        if (!data.valid) {
          router.push("/license-expired");
        }
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [session, status, router]);

  if (checking) {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Checking licence...</p></div>;
  }

  return <>{children}</>;
}