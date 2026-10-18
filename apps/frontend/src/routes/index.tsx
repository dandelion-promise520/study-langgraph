import { ChatPane } from "@frontend/components/chat";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

const NewChatPage = () => {
  const navigate = useNavigate();

  const handleThreadCreated = (newThreadId: string) => {
    navigate({
      to: "/c/$threadId",
      params: { threadId: newThreadId },
      replace: true,
    });
  };
  return <ChatPane threadId={null} onThreadCreated={handleThreadCreated} />;
};

export const Route = createFileRoute("/")({
  component: NewChatPage,
});
