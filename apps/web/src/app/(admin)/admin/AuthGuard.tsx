"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const key = sessionStorage.getItem("admin_key");
    if (!key) {
      router.push("/admin/login");
    } else {
      setAllowed(true);
    }
  }, []);

  if (!allowed) return null;
  return <>{children}</>;
}