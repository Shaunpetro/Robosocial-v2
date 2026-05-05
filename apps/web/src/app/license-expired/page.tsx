// apps/web/src/app/license-expired/page.tsx
export default function LicenseExpired() {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600">License Expired</h1>
          <p className="mt-4 text-gray-700">
            Your Robosocial license has expired. Please contact your
            administrator to renew.
          </p>
        </div>
      </div>
    );
  }