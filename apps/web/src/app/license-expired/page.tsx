// apps/web/src/app/license-expired/page.tsx
import Link from "next/link";

export default function LicenseExpired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Your Licence Is Not Active
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please contact your administrator to renew, or enter a new licence key.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/activate"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
          >
            Enter new licence key
          </Link>
          <a
            href="https://wa.me/27813877744"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
            ðŸ’¬ Message us on WhatsApp
          </a>
          <a
            href="mailto:petrographics.adm@gmail.com"
            className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
          >
            ðŸ“§ Email Administrator
          </a>
        </div>
      </div>
    </div>
  );
}