import { MessagesView } from "@/components/business/MessagesView";
import { BusinessShell } from "@/components/business/BusinessShell";
import { threadIdFromQuery } from "@/lib/replyn-proposals";

export default async function BusinessMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ candidate?: string; thread?: string | string[] }>;
}) {
  const { candidate, thread } = await searchParams;
  return (
    <BusinessShell active="messages" hideTopbar>
      {/* ?thread= comes from Replyn ("back to the Nova conversation"); a malformed id is ignored. */}
      <MessagesView initialCandidateId={candidate} initialThreadId={threadIdFromQuery(thread)} />
    </BusinessShell>
  );
}
