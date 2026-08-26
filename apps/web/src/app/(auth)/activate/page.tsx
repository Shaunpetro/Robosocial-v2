// apps/web/src/app/(auth)/activate/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ActivatePage() {
  const { data: session, status, update } = useSession();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (status === "loading") return <div className="p-8 text-center">Loading...</div>;
  if (!session) {
    router.push("/login");
    return null;
  }

  const handleActivate = async () => {
    if (!key.trim()) {
      setError("Please enter your licence key.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: key.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update the session so LicenseGuard sees the new licenseId
        await update({ licenseId: data.licenseId });
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.error || "Activation failed. Please check your key.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-8 shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Activate Your Licence
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Enter the licence key you received from your administrator.
        </p>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="RS-XXXX-XXXX-XXXX"
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <button
          onClick={handleActivate}
          disabled={loading}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Activating..." : "Activate Licence"}
        </button>
      </div>
    </div>
  );
}