// src/organisms/ChatWidget/aiUtils/adapters/interfaces.ts

export type Msg = { role: "system" | "user" | "assistant"; content: string };

export type AdapterAugmentArgs = {
  text: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content?: string;
    id?: string;
  }>;
  context?: any;
};

export type AIAdapter = {
  buildMemory?: () => Promise<Msg | undefined> | Msg | undefined;
  augment: (args: AdapterAugmentArgs) => Promise<Msg[]> | Msg[];
};

export type RunAdaptersArgs = {
  text: string;
  messages: any[];
  context?: any;
  dataBase?: string;
};

export type RunAdaptersFn = (args: RunAdaptersArgs) => Promise<Msg[]>;

export type MakeDownloadLinkFn = (
  bytes: Uint8Array,
  filename: string,
  mime: string,
  ttlMs?: number,
) => string | Promise<string>;
