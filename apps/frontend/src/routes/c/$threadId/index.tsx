import { ChatPane } from "@frontend/components/chat";
import { useThreads } from "@frontend/hooks";
import { createFileRoute } from "@tanstack/react-router";

const ThreadChatPage = () => {
  const { threadId } = Route.useParams();
  const { threads } = useThreads();

  const currentThread = threads.find((t) => t.id === threadId);
  return <ChatPane threadId={threadId} threadTitle={currentThread?.title} />;
};

export const Route = createFileRoute("/c/$threadId/")({
  component: ThreadChatPage,
});
