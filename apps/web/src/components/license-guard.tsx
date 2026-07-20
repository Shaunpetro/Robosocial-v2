// apps/web/src/components/license-guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function LicenseGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    // If the user doesn't have a licenseId yet, redirect to activate
    if (!(session.user as any).licenseId) {
      router.push("/activate");
      return;
    }

    // Verify the licence is still valid
    fetch("/api/license/validate")
      .then((res) => res.json())
      .then((data) => {
        if (!data.valid) {
          router.push("/license-expired");
        }
        setChecking(false);
      })
      .catch(() => {
        // If the endpoint fails, still allow access but log warning
        setChecking(false);
      });
  }, [session, status, router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Checking licence...</p>
      </div>
    );
  }

  return <>{children}</>;
}