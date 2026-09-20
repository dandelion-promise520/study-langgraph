import { createFileRoute } from "@tanstack/react-router";

import { ChatPane } from "@/components/chat-pane";
import { useThreads } from "@/hooks";

export const Route = createFileRoute("/c/$threadId/")({
  component: ThreadChatPage,
});

function ThreadChatPage() {
  const { threadId } = Route.useParams();
  const { threads } = useThreads();

  const currentThread = threads.find((t) => t.id === threadId);

  return <ChatPane threadId={threadId} key={threadId} threadTitle={currentThread?.title} />;
}
