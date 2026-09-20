import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { ChatPane } from "@/components/chat-pane";

export const Route = createFileRoute("/")({
  component: NewChatPage,
});

function NewChatPage() {
  const navigate = useNavigate();

  const handleThreadCreated = (newThreadId: string) => {
    navigate({
      to: "/c/$threadId",
      params: { threadId: newThreadId },
      replace: true,
    });
  };
  return <ChatPane threadId={null} onThreadCreated={handleThreadCreated} />;
}
