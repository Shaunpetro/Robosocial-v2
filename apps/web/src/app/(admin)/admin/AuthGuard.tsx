// apps/web/src/app/(admin)/admin/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // Never block the login page itself
    if (pathname === "/admin/login") {
      setAllowed(true);
      return;
    }

    const key = sessionStorage.getItem("admin_key");
    if (!key) {
      router.push("/admin/login");
    } else {
      setAllowed(true);
    }
  }, [pathname, router]);

  if (!allowed) return null;
  return <>{children}</>;
}