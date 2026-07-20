// apps/web/src/app/(dashboard)/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HelpCircle, Building2, CalendarDays, ImageIcon } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { HelpModal } from "@/components/ui/HelpModal";
import { CompanyProvider } from "@/app/contexts/company-context";
import SplashScreen from "@/components/ui/SplashScreen";
import LicenseGuard from "@/components/license-guard"; // ← added
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Media", href: "/media", icon: ImageIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setHelpOpen(true);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <CompanyProvider>
      <LicenseGuard>
        <SplashScreen>
          <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Background gradient */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" />
              <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
            </div>

            {/* Top Navigation */}
            <header className="h-16 glass sticky top-0 z-40">
              {/* ... keep entire header ... */}
            </header>

            {/* Mobile Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-[var(--border-default)] bg-[var(--bg-primary)]/90 backdrop-blur-xl">
              {/* ... keep mobile nav ... */}
            </nav>

            {/* Main Content */}
            <main className="pb-16 md:pb-0">{children}</main>

            {/* Help Modal */}
            <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
          </div>
        </SplashScreen>
      </LicenseGuard>
    </CompanyProvider>
  );
}