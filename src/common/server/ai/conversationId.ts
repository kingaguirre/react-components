// conversationId.ts
export function getConversationId(): string {
  const key = "wd_conversation_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    // Use the browser crypto API
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function resetConversationId() {
  sessionStorage.removeItem("wd_conversation_id");
}
