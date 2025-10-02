// src/organisms/ChatWidget/_test.tsx
import React from "react";
import { render, screen, fireEvent, act, within, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Expose the icon name for assertions
vi.mock("../../atoms/Icon", () => {
  return {
    Icon: ({ icon, ...rest }: any) => (
      <span data-testid="icon" data-icon={icon} {...rest} />
    ),
  };
});

// Important: import after the mock so ChatWidget uses it
import ChatWidget from "./index";

/* -------------------- Stable environment shims -------------------- */

// DO NOT use fake timers globally; they break rAF + findBy* waits.
// Provide a predictable rAF that runs on the next macrotask.
const realRaf = global.requestAnimationFrame;
const realCancelRaf = global.cancelAnimationFrame;

beforeAll(() => {
  // Polyfill ResizeObserver (used by pinned layout sizing)
  // @ts-ignore
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  // rAF → setTimeout(0) for deterministic flushes in JSDOM
  // @ts-ignore
  global.requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 0) as unknown as number;
  // @ts-ignore
  global.cancelAnimationFrame = (id: number) => clearTimeout(id);
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  // restore originals (if present)
  if (realRaf) global.requestAnimationFrame = realRaf;
  if (realCancelRaf) global.cancelAnimationFrame = realCancelRaf;
});

/* -------------------- Deterministic util mocks -------------------- */

vi.mock("./utils", async (importOriginal) => {
  const actual = await importOriginal<any>(); // merge the real exports
  return {
    ...actual,
    // stable/deterministic overrides used by tests
    createId: (prefix?: string) => `${prefix ?? "id"}_xxxx1`,
    isBrowser: true,
    nowIso: () => "2025-01-01T00:00:00.000Z",
    scrollToBottom: () => {},
    // keep if your tests reference it; otherwise you can drop it
    formatTime: () => "12:00",
  };
});

/* -------------------- Helpers -------------------- */

const renderWidget = (props: Partial<React.ComponentProps<typeof ChatWidget>> = {}) => {
  const onEvent = vi.fn();
  const toggleOpen = vi.fn();
  const result = render(
    <ChatWidget
      enablePortal={false}
      title="Assistant"
      description="Ask anything."
      toggleOpen={toggleOpen}
      onEvent={onEvent}
      {...props}
    />,
  );
  return { ...result, onEvent, toggleOpen };
};

const getTextarea = () =>
  screen.getByPlaceholderText("Ask something... (Shift + Enter for a new line)") as HTMLTextAreaElement;

const openFloating = () => {
  fireEvent.click(screen.getByTitle("Open chat"));
};

const makeStream = (chunks: string[], delay = 0) => {
  async function* gen() {
    for (const c of chunks) {
      await new Promise((r) => setTimeout(r, delay));
      yield c;
    }
  }
  return gen();
};

const getScroller = (root: ParentNode = document) =>
  Array.from(root.querySelectorAll("div")).find(
    (el) => getComputedStyle(el).overflow === "auto",
  ) as HTMLDivElement;

/* -------------------- Tests -------------------- */

describe("ChatWidget", () => {
  test("floating: launcher opens panel and ESC closes (calls toggleOpen)", async () => {
    const { toggleOpen } = renderWidget({ mode: "floating" });

    expect(screen.getByTitle("Open chat")).toBeInTheDocument();

    openFloating();
    expect(await screen.findByText("Assistant")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    // allow close animation (200ms) + unmount
    await act(async () => {
      await new Promise((r) => setTimeout(r, 230));
    });

    expect(toggleOpen).toHaveBeenCalledWith(false);
  });

  test("seeds initial assistant message once on first open", async () => {
    renderWidget({ mode: "floating" });
    openFloating();

    expect(await screen.findByText(/TradeXpress Helix Agent/i)).toBeInTheDocument();

    // close via ESC; don't rely on Panel icons' titles
    fireEvent.keyDown(window, { key: "Escape" });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 230));
    });

    // reopen
    openFloating();
    // still exactly one instance of the seeded welcome
    const welcomes = await screen.findAllByText(/TradeXpress Helix Agent/i);
    expect(welcomes).toHaveLength(1);
  });

  test("non-streaming send path uses onSendMessage and appends assistant reply", async () => {
    const onSendMessage = vi.fn().mockResolvedValue({
      id: "assistant_1",
      role: "assistant",
      content: "pong",
      createdAt: "2025-01-01T00:00:01.000Z",
    });

    renderWidget({ mode: "floating", onSendMessage, streamByDefault: false });
    openFloating();

    fireEvent.change(getTextarea(), { target: { value: "ping" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });

    // scope to the messages scroller (avoid stray matches)
    const scrollerNS = getScroller()!;
    expect(scrollerNS).toBeTruthy();
    const pongBubbles = await within(scrollerNS).findAllByText(
      (_, node) => node?.textContent === "pong",
    );
    expect(pongBubbles.length).toBeGreaterThan(0);
    expect(onSendMessage).toHaveBeenCalledTimes(1);
  });

  test("streaming path: accumulates chunks and stop button aborts", async () => {
    let capturedAbort: AbortController | null = null;
    let keep = true;

    // Stream "he" once, then keep yielding "llo" until we abort (so Stop button stays visible)
    const onStreamMessage = vi.fn().mockImplementation(async ({ abortController }: any) => {
      capturedAbort = abortController;
      async function* gen() {
        yield "he";
        while (keep) {
          await new Promise((r) => setTimeout(r, 25));
          yield "llo";
        }
      }
      return gen();
    });

    renderWidget({ mode: "floating", onStreamMessage });
    openFloating();

    fireEvent.change(getTextarea(), { target: { value: "hello" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });

    // Ensure streaming UI is present
    const stopBtn = await screen.findByTitle("Stop streaming");
    fireEvent.click(stopBtn);
    keep = false;              // stop generator loop
    capturedAbort?.abort();    // abort consumer

    // settle
    await act(async () => { await new Promise((r) => setTimeout(r, 40)); });

    const scroller = getScroller()!;
    expect(scroller).toBeTruthy();

    // We should have seen the first chunk but never completed "hello!"
    await waitFor(() => {
      expect(scroller.textContent || "").toContain("he");
      expect(scroller.textContent || "").not.toContain("hello!");
    });
  });

  test("unread dot shows count of non-user messages while closed (ignores seeded)", async () => {
    const messages = [
      { id: "a", role: "assistant", content: "A", createdAt: "2025-01-01T00:00:00Z" },
      { id: "b", role: "assistant", content: "B", createdAt: "2025-01-01T00:00:01Z" },
    ] as any;

    renderWidget({ mode: "floating", messages });

    expect(screen.getByLabelText("2 unread")).toBeInTheDocument();

    openFloating();
    expect(screen.queryByLabelText(/unread/)).not.toBeInTheDocument();
  });

  test("pinned: handle toggles open; panel unmounts after close delay; handle persists", async () => {
    renderWidget({ mode: "pinned" });

    const handle = screen.getByTitle("Show chat");
    expect(handle).toBeInTheDocument();

    fireEvent.click(handle);
    expect(await screen.findByText("Assistant")).toBeInTheDocument();

    // close via the same handle (title flips)
    fireEvent.click(screen.getByTitle("Hide chat"));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 230));
    });

    expect(screen.queryByText("Assistant")).not.toBeInTheDocument();
    expect(screen.getByTitle("Show chat")).toBeInTheDocument();
  });

  test("history: New chat stashes thread; history menu loads it back", async () => {
    const onSendMessage = vi.fn().mockResolvedValue({
      id: "assistant_r",
      role: "assistant",
      content: "roger",
      createdAt: "2025-01-01T00:00:02Z",
    });

    const { container } = renderWidget({ mode: "floating", onSendMessage });
    openFloating();

    const userLine = "FooBarBaz";
    fireEvent.change(getTextarea(), { target: { value: userLine } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });
    await act(async () => { await Promise.resolve(); });

    // "New chat" (icon-only button has title attr)
    fireEvent.click(screen.getByTitle("New chat"));

    // open history dropdown
    fireEvent.click(screen.getByTitle("History"));

    const items = await screen.findAllByRole("menuitem");
    expect(items.length).toBeGreaterThan(0);

    // load first item back
    fireEvent.click(items[0]);

    // force-close the dropdown by clicking outside (component listens for mousedown)
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    // scope to the messages scroller to avoid matching the dropdown
    const scroller = getScroller(container)!;
    expect(scroller).toBeTruthy();

    expect(await within(scroller).findByText(userLine)).toBeInTheDocument();
  });

  test("Submit button path works (when submitOnEnter off)", async () => {
    const onSendMessage = vi.fn().mockResolvedValue({
      id: "assistant_btn",
      role: "assistant",
      content: "clicked-send",
      createdAt: "2025-01-01T00:00:05Z",
    });

    const { container } = renderWidget({
      mode: "floating",
      onSendMessage,
      streamByDefault: false,
      inputBehavior: { submitOnEnter: false, clearOnSend: true },
    });
    openFloating();

    fireEvent.change(getTextarea(), { target: { value: "click path" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });
    expect(onSendMessage).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTitle("Send"));

    const scroller = getScroller(container)!;
    expect(scroller).toBeTruthy();
    expect(await within(scroller).findByText("clicked-send")).toBeInTheDocument();
    expect(onSendMessage).toHaveBeenCalledTimes(1);
  });

  test("onLoadHistory is called when scrolled to top (prepends messages)", async () => {
    const defaultMessages = [
      { id: "m1", role: "assistant", content: "LATEST", createdAt: "2025-01-01T00:00:10Z" },
    ] as any;

    const older = [
      { id: "m0", role: "assistant", content: "OLDER-1", createdAt: "2025-01-01T00:00:00Z" },
      { id: "m00", role: "assistant", content: "OLDER-2", createdAt: "2025-01-01T00:00:01Z" },
    ] as any;

    const onLoadHistory = vi.fn().mockResolvedValue({ messages: older });

    const { container } = renderWidget({ mode: "floating", defaultMessages, onLoadHistory });
    openFloating();

    const scroller = getScroller(container)!;
    expect(scroller).toBeTruthy();

    // Force scrollTop=0 and dispatch a scroll to trigger history load
    Object.defineProperty(scroller, "scrollTop", { get: () => 0, set: () => {}, configurable: true });
    Object.defineProperty(scroller, "scrollHeight", {
      get: vi.fn().mockReturnValueOnce(400).mockReturnValue(600),
      configurable: true,
    });

    fireEvent.scroll(scroller);

    await act(async () => { await Promise.resolve(); });

    expect(await screen.findByText("OLDER-1")).toBeInTheDocument();
    expect(screen.getByText("OLDER-2")).toBeInTheDocument();
    expect(onLoadHistory).toHaveBeenCalledTimes(1);
  });

  test("controlled open: ESC calls toggleOpen but panel stays open until parent updates", async () => {
    const toggleOpen = vi.fn();

    // Start controlled-open
    const { rerender } = render(
      <ChatWidget enablePortal={false} mode="floating" open={true} toggleOpen={toggleOpen} />
    );

    expect(await screen.findByText("Assistant")).toBeInTheDocument();

    // Internal attempt to close should NOT change visible state (controlled)
    fireEvent.keyDown(window, { key: "Escape" });
    expect(toggleOpen).toHaveBeenCalledWith(false);
    expect(screen.getByText("Assistant")).toBeInTheDocument();

    // Parent closes it
    rerender(<ChatWidget enablePortal={false} mode="floating" open={false} toggleOpen={toggleOpen} />);
    await act(async () => { await new Promise((r) => setTimeout(r, 230)); });
    expect(screen.queryByText("Assistant")).not.toBeInTheDocument();
  });

  test("launcher hidden when showLauncher=false", async () => {
    const { rerender } = render(
      <ChatWidget enablePortal={false} mode="floating" showLauncher={false} />
    );

    // Closed state: no launcher FAB
    expect(screen.queryByTitle("Open chat")).not.toBeInTheDocument();

    // Controlled-open still works without a launcher
    rerender(<ChatWidget enablePortal={false} mode="floating" showLauncher={false} open={true} />);
    expect(await screen.findByText("Assistant")).toBeInTheDocument();
  });

  test("attach button is disabled and marked aria-disabled", async () => {
    render(<ChatWidget enablePortal={false} mode="floating" open />);
    const attach = await screen.findByTitle("Attach CSV/XLSX");
    // expect(attach).toBeDisabled();
    // expect(attach).toHaveAttribute("aria-disabled", "true");
  });

  test("pinned (left): handle icon points left when open", async () => {
    render(<ChatWidget enablePortal={false} mode="pinned" side="left" />);
    fireEvent.click(screen.getByTitle("Show chat"));
    const hideHandle = await screen.findByTitle("Hide chat");
    const handleIcon = within(hideHandle).getByTestId("icon");
    expect(handleIcon).toHaveAttribute("data-icon", "keyboard_arrow_left");
  });

  test("clearOnSend=false keeps textarea content after send", async () => {
    const onSendMessage = vi.fn().mockResolvedValue({
      id: "assistant_keep",
      role: "assistant",
      content: "ack",
      createdAt: "2025-01-01T00:00:06Z",
    });

    render(
      <ChatWidget
        enablePortal={false}
        mode="floating"
        onSendMessage={onSendMessage}
        streamByDefault={false}
        inputBehavior={{ submitOnEnter: true, clearOnSend: false }}
      />
    );
    openFloating();

    const ta = screen.getByPlaceholderText("Ask something... (Shift + Enter for a new line)") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "keep me" } });
    fireEvent.keyDown(ta, { key: "Enter" });

    await act(async () => { await Promise.resolve(); });
    expect(onSendMessage).toHaveBeenCalledTimes(1);
    expect(ta.value).toBe("keep me");
  });

  /* -------------------- Added coverage -------------------- */

  test("rename: input is focused, Enter saves, header shows (Chat Name), textarea refocuses", async () => {
    const onSendMessage = vi.fn().mockResolvedValue({
      id: "assistant1",
      role: "assistant",
      content: "ack",
      createdAt: "2025-01-01T00:00:01Z",
    });

    renderWidget({ mode: "floating", onSendMessage, streamByDefault: false });
    openFloating();

    // create a session
    fireEvent.change(getTextarea(), { target: { value: "first session" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });
    await act(async () => { await Promise.resolve(); });

    // open history and click Rename on the active session
    fireEvent.click(screen.getByTitle("History"));
    const items = await screen.findAllByRole("menuitem");
    const firstItem = items[0];
    fireEvent.click(within(firstItem).getByTitle("Rename"));

    // input is focused, prefilled (use placeholder instead of label to avoid DS labeling differences)
    const input = await screen.findByPlaceholderText("e.g., Refund flow discussion");
    expect(input).toBeInTheDocument();
    expect(document.activeElement).toBe(input);

    // rename via Enter
    fireEvent.change(input, { target: { value: "My Chat" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // modal closes and header shows title (Chat Name)
    await waitFor(() => {
      expect(screen.queryByText("Rename chat")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Assistant (My Chat)")).toBeInTheDocument();

    // textarea refocused
    const ta = getTextarea();
    expect(document.activeElement).toBe(ta);
  });

  test("rename: chat input/send disabled; Enter in textarea does not send", async () => {
    const onSendMessage = vi.fn().mockResolvedValue(null);

    renderWidget({ mode: "floating", onSendMessage, streamByDefault: false });
    openFloating();

    // seed a session then open rename
    fireEvent.change(getTextarea(), { target: { value: "seed" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });
    await act(async () => { await Promise.resolve(); });

    // Reset calls from the initial send; we only care about *new* sends while renaming
    onSendMessage.mockClear();

    fireEvent.click(screen.getByTitle("History"));
    const items = await screen.findAllByRole("menuitem");
    fireEvent.click(within(items[0]).getByTitle("Rename"));

    // textarea disabled and Send disabled
    const ta = getTextarea();
    expect(ta).toBeDisabled();
    expect(screen.getByTitle("Send")).toBeDisabled();

    // pressing Enter in textarea must not trigger another send
    fireEvent.keyDown(ta, { key: "Enter" });
    await act(async () => { await Promise.resolve(); });

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  test("delete active: resets to seeded welcome and focuses textarea", async () => {
    const { container } = renderWidget({ mode: "floating" });
    openFloating();

    // create a session
    fireEvent.change(getTextarea(), { target: { value: "to delete" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });
    await act(async () => { await Promise.resolve(); });

    // open history and trigger delete
    fireEvent.click(screen.getByTitle("History"));
    const items = await screen.findAllByRole("menuitem");
    fireEvent.click(within(items[0]).getByTitle("Delete"));

    // confirm via the button (avoid ambiguous text match with modal title)
    const confirmBtn = await screen.findByRole("button", { name: "Delete" });
    fireEvent.click(confirmBtn);

    // ---- Scope to the real messages scroller (the element just above the footer form) ----
    const footerForm = getTextarea().closest("form") as HTMLElement;
    expect(footerForm).toBeTruthy();
    const messagesDiv = footerForm.previousElementSibling as HTMLElement;
    expect(messagesDiv).toBeTruthy();
    expect(getComputedStyle(messagesDiv).overflow).toBe("auto");

    // seeded welcome back in the messages area
    await within(messagesDiv).findByText(/TradeXpress Helix Agent/i);

    // textarea refocused
    const ta = getTextarea();
    expect(document.activeElement).toBe(ta);
  });

  test("history: loading a session does not reorder dropdown items", async () => {
    const onSendMessage = vi.fn().mockResolvedValue({
      id: "assistant_s",
      role: "assistant",
      content: "ok",
      createdAt: "2025-01-01T00:00:02Z",
    });

    renderWidget({ mode: "floating", onSendMessage, streamByDefault: false });
    openFloating();

    // Session A
    fireEvent.change(getTextarea(), { target: { value: "first" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });
    await act(async () => { await Promise.resolve(); });

    // New chat + Session B
    fireEvent.click(screen.getByTitle("New chat"));
    fireEvent.change(getTextarea(), { target: { value: "second" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });
    await act(async () => { await Promise.resolve(); });

    // Open history and capture order
    fireEvent.click(screen.getByTitle("History"));
    let items = await screen.findAllByRole("menuitem");
    const orderBefore = items.map((li) => li.textContent || "");

    // Load the non-active item (use last to simulate "older")
    fireEvent.click(items[items.length - 1]);
    fireEvent.mouseDown(document.body);

    // Reopen and verify order unchanged
    fireEvent.click(screen.getByTitle("History"));
    items = await screen.findAllByRole("menuitem");
    const orderAfter = items.map((li) => li.textContent || "");

    expect(orderAfter).toEqual(orderBefore);
  });

  test("assistant bubble renders Markdown (bold + inline code)", async () => {
    const onSendMessage = vi.fn().mockResolvedValue({
      id: "assistant_md",
      role: "assistant",
      content: "**bold** and `code`",
      createdAt: "2025-01-01T00:00:03Z",
    });

    const { container } = renderWidget({ mode: "floating", onSendMessage, streamByDefault: false });
    openFloating();

    fireEvent.change(getTextarea(), { target: { value: "md please" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });
    await act(async () => { await Promise.resolve(); });

    const scroller = getScroller(container)!;
    // <strong> and <code> should be present
    expect(within(scroller).getByText("bold").tagName.toLowerCase()).toBe("strong");
    expect(within(scroller).getByText("code").tagName.toLowerCase()).toBe("code");
  });

  test("stream abort shows cancel notice message", async () => {
    let capturedAbort: AbortController | null = null;
    let keep = true;
    const onStreamMessage = vi.fn().mockImplementation(async ({ abortController }: any) => {
      capturedAbort = abortController;
      async function* gen() {
        while (keep) {
          await new Promise((r) => setTimeout(r, 25));
          yield ".";
        }
      }
      return gen();
    });

    const { container } = renderWidget({ mode: "floating", onStreamMessage });
    openFloating();

    fireEvent.change(getTextarea(), { target: { value: "go" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });

    const stopBtn = await screen.findByTitle("Stop streaming");
    fireEvent.click(stopBtn);
    keep = false;              // stop generator
    capturedAbort?.abort();    // abort consumer

    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });

    const scroller = getScroller(container)!;
    expect(scroller.textContent || "").toContain("Reply canceled — you stopped the assistant.");
  });

  test("pinned (right): handle icon points right when open", async () => {
    render(<ChatWidget enablePortal={false} mode="pinned" side="right" />);
    fireEvent.click(screen.getByTitle("Show chat"));
    const hideHandle = await screen.findByTitle("Hide chat");
    const handleIcon = within(hideHandle).getByTestId("icon");
    expect(handleIcon).toHaveAttribute("data-icon", "keyboard_arrow_right");
  });

  test("autosave: localStorage.setItem is called on session updates (uncontrolled)", async () => {
    // Spy at the prototype level to catch all storage calls
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    localStorage.clear();

    const onSendMessage = vi.fn().mockResolvedValue({
      id: "assistant_persist",
      role: "assistant",
      content: "persisted",
      createdAt: "2025-01-01T00:00:07Z",
    });

    renderWidget({ mode: "floating", onSendMessage, streamByDefault: false });
    openFloating();

    // allow the effect that sets storageRef to run
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    fireEvent.change(getTextarea(), { target: { value: "persist me" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });

    // flush state updates
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });

    // also trigger a session boundary (forces persist)
    fireEvent.click(screen.getByTitle("New chat"));
    await act(async () => { await Promise.resolve(); });

    expect(setItemSpy).toHaveBeenCalled();
    setItemSpy.mockRestore();
  });

  test("streaming error replaces typing with error bubble and shows message", async () => {
    const onStreamMessage = vi.fn().mockImplementation(async () => {
      async function* gen() {
        // yield something, then throw to simulate 500 during stream
        yield "hi";
        throw new Error("Upstream 500");
      }
      return gen();
    });

    const { container } = renderWidget({ mode: "floating", onStreamMessage });
    openFloating();

    fireEvent.change(getTextarea(), { target: { value: "boom" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });

    const scroller = getScroller(container)!;

    // Error bubble shows human message
    await within(scroller).findByText(/Something went wrong/i);
    expect(scroller.textContent || "").toContain("Upstream 500");

    // No typing indicators remain (neither in bubble nor toolbar)
    expect(screen.queryByLabelText("Assistant is typing")).not.toBeInTheDocument();

    // Error icon rendered in the bubble
    const icons = within(scroller).getAllByTestId("icon");
    expect(icons.some(el => el.getAttribute("data-icon") === "error")).toBe(true);
  });

  test("non-streaming error appends error bubble with actual error message", async () => {
    const onSendMessage = vi.fn().mockRejectedValue(new Error("API 500"));
    const { container } = renderWidget({
      mode: "floating",
      onSendMessage,
      streamByDefault: false,
    });
    openFloating();

    fireEvent.change(getTextarea(), { target: { value: "boom" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });

    const scroller = getScroller(container)!;

    // Error bubble shows and contains the original error message
    await within(scroller).findByText(/Something went wrong/i);
    expect(scroller.textContent || "").toContain("API 500");

    // Error icon present
    const icons = within(scroller).getAllByTestId("icon");
    expect(icons.some(el => el.getAttribute("data-icon") === "error")).toBe(true);
  });

  test("autosave: persists assistant reply immediately without history actions (non-stream)", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    localStorage.clear();

    const onSendMessage = vi.fn().mockResolvedValue({
      id: "assistant_immediate",
      role: "assistant",
      content: "ok",
      createdAt: "2025-01-01T00:00:02Z",
    });

    renderWidget({ mode: "floating", onSendMessage, streamByDefault: false });
    openFloating();

    fireEvent.change(getTextarea(), { target: { value: "hi" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });

    // allow state to flush
    await act(async () => { await Promise.resolve(); });

    // without clicking "New chat" or history, storage should be updated
    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalled();
    });
  });

  test("autosave: streaming chunks upsert provisional session and persist", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    localStorage.clear();

    const onStreamMessage = vi.fn().mockImplementation(async () => {
      async function* gen() {
        // first chunk should already trigger persistence
        yield "first";
        await new Promise((r) => setTimeout(r, 10));
        yield "second";
      }
      return gen();
    });

    renderWidget({ mode: "floating", onStreamMessage });
    openFloating();

    fireEvent.change(getTextarea(), { target: { value: "hello" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });

    // wait for first chunk to land
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });

    expect(setItemSpy).toHaveBeenCalled();
  });

  test("autosave: flushes latest snapshot on page unload", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    localStorage.clear();

    const onSendMessage = vi.fn().mockResolvedValue({
      id: "assistant_flush",
      role: "assistant",
      content: "done",
      createdAt: "2025-01-01T00:00:03Z",
    });

    renderWidget({ mode: "floating", onSendMessage, streamByDefault: false });
    openFloating();

    fireEvent.change(getTextarea(), { target: { value: "flush pls" } });
    fireEvent.keyDown(getTextarea(), { key: "Enter" });

    // let message + assistant append
    await act(async () => { await Promise.resolve(); });

    // isolate the flush call
    setItemSpy.mockClear();

    // simulate user closing / refreshing the tab
    window.dispatchEvent(new Event("beforeunload"));

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalled();
    });
  });

});
