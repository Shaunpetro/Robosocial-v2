// apps/web/src/app/(dashboard)/companies/[id]/media/page.tsx

import { redirect } from "next/navigation";

export default async function CompanyMediaRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/media?companyId=${id}`);
}