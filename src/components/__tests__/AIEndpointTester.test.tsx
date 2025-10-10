// src/components/__tests__/AIEndpointTester.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

// 🔧 adjust if your file lives elsewhere
import AIEndpointTester from "../AIEndpointTester";

// Mock the theme module used by styled-components
vi.mock("../styles", () => ({
  theme: {
    fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
    colors: {
      light: { darker: "#111", dark: "#333", pale: "#f6f7fb" },
      default: { lighter: "#e5e7eb" },
      primary: { base: "#2563eb", dark: "#1e40af" },
      danger: { dark: "#b91c1c", light: "#fecaca" },
      warning: { pale: "#fff7ed", light: "#fed7aa", darker: "#9a3412" },
    },
    sizes: { label: { md: 12 }, buttonPadding: { md: "8px 12px" } },
  },
}));

// ==== helpers for streaming ====
const enc = new TextEncoder();
function rsFromStrings(chunks: string[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((c) => controller.enqueue(enc.encode(c)));
      controller.close();
    },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();

  fetchMock = vi.fn();
  // @ts-expect-error override global fetch for tests
  global.fetch = fetchMock;

  // minimal clipboard
  (global.navigator as any).clipboard = {
    writeText: vi.fn().mockResolvedValue(undefined),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---- common responders for initial server loads ----
function primeServerLoadResponses({
  key = "sk-test-123",
  settings = {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    stream: true,
    payloadMode: "messages",
    parser: "auto",
  },
  hasSettings = true,
}: {
  key?: string;
  settings?: any;
  hasSettings?: boolean;
} = {}) {
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const method = (init?.method || "GET").toUpperCase();
    // same-origin by default; Dev API Base is empty unless user fills it
    if (method === "GET" && url.endsWith("/api/dev/openai-key")) {
      return new Response(JSON.stringify({ key }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (method === "GET" && url.endsWith("/api/dev/openai-settings")) {
      return new Response(JSON.stringify({ settings, hasSettings }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("not found", { status: 404 });
  });
}

describe("AIEndpointTester (Direct)", () => {
  it("loads key and saved settings from the server on mount", async () => {
    primeServerLoadResponses({
      key: "sk-test-123",
      settings: {
        baseUrl: "https://custom.openai/v1",
        model: "gpt-test",
        stream: false,
        payloadMode: "messages",
        parser: "auto",
      },
      hasSettings: true,
    });

    render(<AIEndpointTester />);

    // baseUrl input should reflect saved settings
    const baseUrlInput = await screen.findByLabelText("Upstream Base URL") as HTMLInputElement;
    expect(baseUrlInput.value).toBe("https://custom.openai/v1");

    // model input reflects saved settings
    const modelInput = screen.getByLabelText("Model") as HTMLInputElement;
    expect(modelInput.value).toBe("gpt-test");

    // server key field shows saved key
    const keyInput = screen.getByPlaceholderText("<JWT or sk-...>") as HTMLInputElement;
    expect(keyInput.value).toBe("sk-test-123");
  });

  it("sends POST to {baseUrl}/chat/completions with Bearer auth and streams text", async () => {
    const settings = {
      baseUrl: "http://localhost:4000",
      model: "gpt-4o-mini",
      stream: true,
      payloadMode: "messages",
      parser: "auto",
    };
    const DIRECT = "http://localhost:4000/chat/completions";

    // first stub the server loads…
    primeServerLoadResponses({ key: "sk-test-123", settings });

    // …then extend the mock for the direct POST
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();

      if (method === "GET" && url.endsWith("/api/dev/openai-key")) {
        return new Response(JSON.stringify({ key: "sk-test-123" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (method === "GET" && url.endsWith("/api/dev/openai-settings")) {
        return new Response(JSON.stringify({ settings, hasSettings: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === DIRECT && method === "POST") {
        // Assert headers include Bearer authorization
        const headers = (init!.headers as any) || {};
        expect(headers["Content-Type"]).toBe("application/json");
        expect(headers["Authorization"]).toBe("Bearer sk-test-123");

        // Return a text/plain stream
        const body = rsFromStrings(["hello", " ", "world"]);
        return new Response(body, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      }
      return new Response("not found", { status: 404 });
    });

    render(<AIEndpointTester />);

    const send = await screen.findByRole("button", { name: /^send$/i });
    fireEvent.click(send);

    // Output should accumulate streamed text
    await waitFor(() => {
      expect(screen.getByText(/hello world/)).toBeInTheDocument();
    });

    // The POST got hit with expected shape
    expect(fetchMock).toHaveBeenCalledWith(
      DIRECT,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer sk-test-123",
        }),
      }),
    );
  });

  it("shows auth hint on 401 error", async () => {
    const settings = { baseUrl: "http://localhost:4000" };
    const DIRECT = "http://localhost:4000/chat/completions";

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();

      if (method === "GET" && url.endsWith("/api/dev/openai-key")) {
        // simulate missing key on server
        return new Response(JSON.stringify({ key: "" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (method === "GET" && url.endsWith("/api/dev/openai-settings")) {
        return new Response(JSON.stringify({ settings, hasSettings: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === DIRECT && method === "POST") {
        return new Response(JSON.stringify({ error: "no auth" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("not found", { status: 404 });
    });

    render(<AIEndpointTester />);

    const send = await screen.findByRole("button", { name: /^send$/i });
    fireEvent.click(send);

    await waitFor(() => {
      expect(
        screen.getByText(/Auth failed \(key missing\/invalid\)\./i),
      ).toBeInTheDocument();
    });
  });

  it("Abort sets state to 'aborted' even if fetch is still pending", async () => {
    const settings = { baseUrl: "http://localhost:4000" };
    const DIRECT = "http://localhost:4000/chat/completions";

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();

      if (method === "GET" && url.endsWith("/api/dev/openai-key")) {
        return new Response(JSON.stringify({ key: "sk-test-123" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (method === "GET" && url.endsWith("/api/dev/openai-settings")) {
        return new Response(JSON.stringify({ settings, hasSettings: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url === DIRECT && method === "POST") {
        // never resolve to simulate a hanging request
        return new Promise<Response>(() => {});
      }
      return new Response("not found", { status: 404 });
    });

    render(<AIEndpointTester />);

    const send = await screen.findByRole("button", { name: /^send$/i });
    fireEvent.click(send);

    const abortBtn = screen.getByRole("button", { name: /^abort$/i });
    fireEvent.click(abortBtn);

    // Status pill shows 'aborted'
    expect(await screen.findByText(/^aborted$/i)).toBeInTheDocument();
  });

  it("copies cURL to clipboard", async () => {
    // Use defaults; server provides a key so Authorization appears in cURL
    primeServerLoadResponses({
      key: "sk-test-123",
      settings: {
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini",
        stream: true,
        payloadMode: "messages",
        parser: "auto",
      },
      hasSettings: true,
    });

    render(<AIEndpointTester />);

    // Scope to the cURL panel header row
    const headerRow = await screen.findByText(/cURL \(copy to terminal\)/i);
    const copyBtn = within(headerRow.parentElement!).getByRole("button", { name: /copy/i });

    // The displayed cURL (already generated before sending)
    const curlPre = screen.getByText(/curl -X POST/i, { selector: "pre" });
    const curlText = curlPre.textContent || "";

    // Click and assert copy
    fireEvent.click(copyBtn);
    await waitFor(() =>
      expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith(curlText),
    );
  });

  // extra: ensures Parser segmented control toggles affects ctype/guess hinting path
  it("lets you toggle Parser without crashing (UI-only sanity)", async () => {
    primeServerLoadResponses();

    render(<AIEndpointTester />);

    // Click the 'ndjson' segmented button and then 'text'
    const ndjsonBtn = await screen.findByRole("button", { name: /^ndjson$/i });
    fireEvent.click(ndjsonBtn);

    const textBtn = screen.getByRole("button", { name: /^text$/i });
    fireEvent.click(textBtn);

    // No assertion beyond "did not throw"; ensure buttons were found and clickable
    expect(ndjsonBtn).toBeInTheDocument();
    expect(textBtn).toBeInTheDocument();
  });
});
