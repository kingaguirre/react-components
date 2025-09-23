import React, { useState, useRef, useEffect } from "react";
import {
  Container,
  ChatWindow,
  Bubble,
  InputRow,
  TextInput,
  SendButton,
  JsonContainer,
  RawJsonArea,
  CopyButton,
} from "./styled";
import { askAI, askAIWithImage } from "./aiService";

interface Message {
  fromUser: boolean;
  text: string;
}

export const FieldSettingsAIAgent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fieldSettings, setFieldSettings] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    if (!input.trim() && !imageFile) return;

    const promptToSend = input.trim()
      ? input
      : imageFile
        ? "Generate fields based on the uploaded image"
        : "";

    setMessages((m) => [...m, { fromUser: true, text: promptToSend }]);
    setInput("");

    try {
      const placeholder = "Generating…";
      setMessages((m) => [...m, { fromUser: false, text: placeholder }]);

      let settings;
      if (imageFile) {
        // Read file as Data URL
        const b64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("Failed to read file"));
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(imageFile);
        });
        settings = await askAIWithImage(promptToSend, b64);
      } else {
        settings = await askAI(promptToSend);
      }

      // replace placeholder
      setMessages((m) =>
        m.map((msg) =>
          msg.text === placeholder
            ? { fromUser: false, text: "Here you go:" }
            : msg,
        ),
      );
      setFieldSettings(settings);
      setImageFile(null);
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { fromUser: false, text: `Error: ${err.message}` },
      ]);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, fieldSettings]);

  const rawJson = fieldSettings ? JSON.stringify(fieldSettings, null, 2) : "";
  const copyRaw = () => navigator.clipboard.writeText(rawJson);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageFile(e.target.files?.[0] ?? null);
  };

  return (
    <Container>
      <ChatWindow>
        {messages.map((m, i) => (
          <Bubble key={i} fromUser={m.fromUser}>
            {m.text}
          </Bubble>
        ))}
        <div ref={chatEndRef} />
      </ChatWindow>

      <InputRow>
        <TextInput
          placeholder="Ask for fieldSettings…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <SendButton onClick={send}>Send</SendButton>
      </InputRow>

      <InputRow>
        <input type="file" accept="image/*" onChange={onFileChange} />
      </InputRow>

      {fieldSettings && (
        <JsonContainer>
          <RawJsonArea readOnly value={rawJson} />
          <CopyButton onClick={copyRaw}>Copy JSON</CopyButton>
        </JsonContainer>
      )}
    </Container>
  );
};
