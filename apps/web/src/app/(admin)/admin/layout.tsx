// apps/web/src/app/(admin)/admin/layout.tsx
import { AuthGuard } from "./AuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            Robosocial Admin
          </span>
          <form action="/admin/logout" method="get">
            <button
              type="submit"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-600"
            >
              Logout
            </button>
          </form>
        </nav>
        <main className="max-w-5xl mx-auto p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}