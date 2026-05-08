// apps/web/src/app/(admin)/admin/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    // Simple validation: store key in session storage and redirect
    if (!key.trim()) {
      setError("Admin key is required");
      return;
    }
    sessionStorage.setItem("admin_key", key.trim());
    router.push("/admin/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-8 shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Admin Access
        </h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter admin key"
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
        />
        <button
          onClick={handleLogin}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Enter Admin Panel
        </button>
      </div>
    </div>
  );
}