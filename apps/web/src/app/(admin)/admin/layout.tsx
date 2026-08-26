// apps/web/src/app/(admin)/admin/layout.tsx
import { AuthGuard } from "./AuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-5xl mx-auto p-6">{children}</main>
      </div>
    </AuthGuard>
  );
}