// src/components/__tests__/AIEndpointTester.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

// 🔧 adjust this import if your file lives elsewhere
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

const API_BASE = "http://localhost:4000";
const DEV_KEY_EP = `${API_BASE}/api/dev/openai-key`;
const PREFS_EP = `${API_BASE}/api/dev/openai-prefs`;
const TARGET = `${API_BASE}/api/ai/openai`;

// Utilities
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

// Clipboard mock
beforeEach(() => {
  fetchMock = vi.fn();
  // @ts-expect-error override global fetch
  global.fetch = fetchMock;

  // minimal clipboard
  (global.navigator as any).clipboard = {
    writeText: vi.fn().mockResolvedValue(undefined),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

function primeBootstrapGets({
  key = "sk-test-123",
  prefs = {
    baseUrl: "https://custom.openai/v1",
    model: "gpt-test",
    stream: false,
  },
}: { key?: string; prefs?: any } = {}) {
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const method = (init?.method || "GET").toUpperCase();

    if (url === DEV_KEY_EP && method === "GET") {
      return new Response(JSON.stringify({ key }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url === PREFS_EP && method === "GET") {
      return new Response(
        JSON.stringify({ hasPrefs: true, prefs }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    // default fallback so tests can plug POST later
    return new Response("not found", { status: 404 });
  });
}

describe("AIEndpointTester", () => {
  it("loads server key and defaults on mount", async () => {
    primeBootstrapGets();

    render(<AIEndpointTester />);

    // baseUrl input should reflect server prefs
    const baseUrlInput = await screen.findByLabelText("OpenAI Base URL") as HTMLInputElement;
    expect(baseUrlInput.value).toBe("https://custom.openai/v1");

    // model input reflects prefs
    const modelInput = screen.getByLabelText("Model") as HTMLInputElement;
    expect(modelInput.value).toBe("gpt-test");

    // server key field shows saved key
    const keyInput = screen.getByPlaceholderText("sk-...") as HTMLInputElement;
    expect(keyInput.value).toBe("sk-test-123");
  });

  it("sends POST with server header and streams text chunks into Output", async () => {
    // 2 GETs first, then POST returns text stream
    primeBootstrapGets();
    fetchMock.mockImplementationOnce(fetchMock.mock.calls[0]?.[0]) // keep the first GET behavior
    fetchMock.mockImplementationOnce(fetchMock.mock.calls[1]?.[0]);

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();

      if (url === DEV_KEY_EP && method === "GET") {
        return new Response(JSON.stringify({ key: "sk-test-123" }), {
          status: 200, headers: { "Content-Type": "application/json" },
        });
      }
      if (url === PREFS_EP && method === "GET") {
        return new Response(JSON.stringify({
          hasPrefs: true,
          prefs: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini", stream: true },
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      if (url === TARGET && method === "POST") {
        // Assert headers include X-OpenAI-Key
        expect((init!.headers as any)["X-OpenAI-Key"]).toBe("sk-test-123");

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

    const send = await screen.findByRole("button", { name: /send/i });
    fireEvent.click(send);

    // Output should accumulate streamed text
    await waitFor(() => {
      expect(screen.getByText(/hello world/)).toBeInTheDocument();
    });

    // The POST got hit
    expect(fetchMock).toHaveBeenCalledWith(
      TARGET,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-OpenAI-Key": "sk-test-123",
        }),
      }),
    );
  });

  it("shows auth hint on 401 error", async () => {
    primeBootstrapGets();

    // After the two GETs, POST returns 401
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();

      if (url === DEV_KEY_EP && method === "GET") {
        return new Response(JSON.stringify({ key: "" }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url === PREFS_EP && method === "GET") {
        return new Response(JSON.stringify({ hasPrefs: false, prefs: {} }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url === TARGET && method === "POST") {
        return new Response(JSON.stringify({ error: "no auth" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("not found", { status: 404 });
    });

    render(<AIEndpointTester />);

    const send = await screen.findByRole("button", { name: /send/i });
    fireEvent.click(send);

    await waitFor(() => {
      expect(screen.getByText(/Auth failed \(key missing\/invalid\)\./i)).toBeInTheDocument();
    });
  });

  it("Abort sets state to 'aborted' even if fetch is still pending", async () => {
    primeBootstrapGets();

    // POST never resolves (simulate a hanging request)
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();

      if (url === DEV_KEY_EP && method === "GET") {
        return new Response(JSON.stringify({ key: "sk-test-123" }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url === PREFS_EP && method === "GET") {
        return new Response(JSON.stringify({ hasPrefs: true, prefs: {} }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (url === TARGET && method === "POST") {
        return new Promise<Response>(() => { /* never resolve */ });
      }
      return new Response("not found", { status: 404 });
    });

    render(<AIEndpointTester />);

    const send = await screen.findByRole("button", { name: /send/i });
    fireEvent.click(send);

    const abortBtn = screen.getByRole("button", { name: /abort/i });
    fireEvent.click(abortBtn);

    // Status pill shows 'aborted'
    expect(await screen.findByText(/^aborted$/i)).toBeInTheDocument();
  });

  it("copies cURL to clipboard", async () => {
    primeBootstrapGets();

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
      expect((navigator.clipboard as any).writeText).toHaveBeenCalledWith(curlText)
    );
  });
});
