import { MessagesView } from "@/components/business/MessagesView";
import { BusinessShell } from "@/components/business/BusinessShell";

export default async function BusinessMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ candidate?: string }>;
}) {
  const { candidate } = await searchParams;
  return (
    <BusinessShell active="messages">
      <MessagesView initialCandidateId={candidate} />
    </BusinessShell>
  );
}
