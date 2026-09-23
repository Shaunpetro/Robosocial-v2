// apps/web/src/app/(dashboard)/special-dates/_components/CompanySelector.tsx

"use client";

import { ChevronDown } from "lucide-react";
import type { Company } from "./types";

interface Props {
  companies: Company[];
  selectedCompanyId: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function CompanySelector({ companies, selectedCompanyId, onChange }: Props) {
  return (
    <div className="mb-8">
      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
        Select Organization
      </label>
      <div className="relative">
        <select
          value={selectedCompanyId}
          onChange={onChange}
          className="w-full appearance-none px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)] pr-10 focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)] pointer-events-none" />
      </div>
    </div>
  );
}