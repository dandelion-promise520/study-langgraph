export type AddedMessage = {
  id: string;
  from: "user" | "assistant";
  content: string;
  streaming?: boolean;
};
