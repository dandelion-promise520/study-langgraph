export type StreamTokenEvent = {
  event: "token";
  data: string;
};

export type StreamToolStartEvent = {
  event: "tool_start";
  data: {
    name: string;
    input: unknown;
  };
};

export type StreamToolEndEvent = {
  event: "tool_end";
  data: {
    name: string;
    output: unknown;
  };
};

export type StreamDoneEvent = {
  event: "done";
  data: "[DONE]";
};

export type AgentStreamEvent =
  | StreamTokenEvent
  | StreamToolStartEvent
  | StreamToolEndEvent
  | StreamDoneEvent;
