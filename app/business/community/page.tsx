import { BusinessShell } from "@/components/business/BusinessShell";
import { CommunityView } from "@/components/business/CommunityView";

export const dynamic = "force-dynamic";

export default async function BusinessCommunityPage({
  searchParams,
}: {
  searchParams?: Promise<{ preview?: string }>;
}) {
  const resolved = searchParams ? await searchParams : {};
  return (
    <BusinessShell active="community" hideTopbar>
      <CommunityView preview={resolved.preview} />
    </BusinessShell>
  );
}
