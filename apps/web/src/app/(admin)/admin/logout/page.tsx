"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Logout() {
  const router = useRouter();
  useEffect(() => {
    sessionStorage.removeItem("admin_key");
    router.push("/admin/login");
  }, []);
  return null;
}