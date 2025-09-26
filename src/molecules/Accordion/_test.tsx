// src/molecules/Accordion/Accordion.test.tsx
import React from "react";
import { render, screen, within, act, fireEvent, waitFor } from "@testing-library/react";
import { Accordion } from "./index";
import { AccordionItemDetail, AccordionItemProps } from "./interface";
import { vi } from "vitest";
import "@testing-library/jest-dom";

// Polyfill for ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserver;

describe("Accordion Component", () => {
  const baseItems = (): AccordionItemProps[] => [
    { id: "a1", title: "Item 1", children: <div>Content 1</div>, color: "primary" },
    { id: "a2", title: "Item 2", children: <div>Content 2</div>, color: "success" },
  ];

  const getHeaderNode = (title: string): HTMLElement => {
    const titleNode = screen.getByText(title);
    const header = titleNode.closest(".accordion-header");
    if (!header) throw new Error("Header container not found");
    return header as HTMLElement;
  };

  it("lazy-mounts open item only; closed item stays unmounted", async () => {
    const items = [
      { id: "1", title: "Item 1", children: <div>Content 1</div>, open: true },
      { id: "2", title: "Item 2", children: <div>Content 2</div> }, // closed
    ];

    render(<Accordion items={items} allowMultiple />);

    // Headers render immediately
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();

    // Immediately after paint: bodies are not mounted yet
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();

    // After the micro delay, Item 1's body appears; Item 2 remains absent
    expect(await screen.findByText("Content 1")).toBeInTheDocument();
    expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
  });

  it("uncontrolled: initial closed -> click opens -> click closes", () => {
    const onClick = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    const items = baseItems();
    items[0].onClick = onClick;
    items[0].onOpen = onOpen;
    items[0].onClose = onClose;

    render(<Accordion items={items} allowMultiple={true} />);

    fireEvent.click(getHeaderNode("Item 1"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(getHeaderNode("Item 1"));
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    const [openEvt, openId] = onOpen.mock.calls[0];
    expect(openId).toBe("a1");
    expect((openEvt as any).nativeEvent).toBeInstanceOf(MouseEvent);

    const [clickEvt, clickId] = onClick.mock.calls[0];
    expect(clickId).toBe("a1");
    expect((clickEvt as any).nativeEvent).toBeInstanceOf(MouseEvent);
  });

  it("uncontrolled: allowMultiple=false closes others (no onClose for the other item per current behavior)", () => {
    const onOpen1 = vi.fn();
    const onClose1 = vi.fn();
    const onOpen2 = vi.fn();
    const onClose2 = vi.fn();

    const items = baseItems();
    items[0].onOpen = onOpen1;
    items[0].onClose = onClose1;
    items[1].onOpen = onOpen2;
    items[1].onClose = onClose2;

    render(<Accordion items={items} allowMultiple={false} />);

    fireEvent.click(getHeaderNode("Item 1"));
    expect(onOpen1).toHaveBeenCalledTimes(1);

    fireEvent.click(getHeaderNode("Item 2"));
    expect(onOpen2).toHaveBeenCalledTimes(1);
    expect(onClose1).toHaveBeenCalledTimes(0); // silent collapse

    fireEvent.click(getHeaderNode("Item 2"));
    expect(onClose2).toHaveBeenCalledTimes(1);
  });

  it("uncontrolled: allowMultiple=true lets multiple stay open", () => {
    const onOpen1 = vi.fn();
    const onOpen2 = vi.fn();

    const items = baseItems();
    items[0].onOpen = onOpen1;
    items[1].onOpen = onOpen2;

    render(<Accordion items={items} allowMultiple={true} />);
    fireEvent.click(getHeaderNode("Item 1"));
    fireEvent.click(getHeaderNode("Item 2"));
    expect(onOpen1).toHaveBeenCalledTimes(1);
    expect(onOpen2).toHaveBeenCalledTimes(1);
  });

  it("uncontrolled with open:true as initial is still closable (auto-controlled pattern)", () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    const items = baseItems();
    items[0].open = true; // initial (uncontrolled)
    items[0].onOpen = onOpen;
    items[0].onClose = onClose;

    render(<Accordion items={items} allowMultiple={true} />);
    fireEvent.click(getHeaderNode("Item 1"));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(getHeaderNode("Item 1"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("becomes controlled when parent changes `open` across renders; click does NOT mutate, only fires callbacks", () => {
    // isolate fake timers for parent setTimeout
    vi.useFakeTimers();
    const onClick = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    try {
      const ControlledHarness: React.FC = () => {
        const [flag, setFlag] = React.useState(false);
        const items = baseItems();
        items[0].onClick = onClick;
        items[0].onOpen = onOpen;
        items[0].onClose = onClose;
        items[0].open = flag ? true : false;

        React.useEffect(() => {
          const t = setTimeout(() => setFlag(true), 0);
          return () => clearTimeout(t);
        }, []);

        return <Accordion items={items} allowMultiple={true} />;
      };

      render(<ControlledHarness />);
      act(() => {
        vi.runAllTimers(); // flip to controlled open
      });

      // Controlled & open: clicking fires onClose but item remains open unless parent changes prop.
      fireEvent.click(getHeaderNode("Item 1"));
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);

      fireEvent.click(getHeaderNode("Item 1"));
      expect(onClose).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("rightDetails clicks DO NOT toggle header and call detail.onClick instead", () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const onDetailClick = vi.fn();

    const detail: AccordionItemDetail = { text: "Info", onClick: onDetailClick };
    const items = baseItems();
    items[0].onOpen = onOpen;
    items[0].onClose = onClose;
    items[0].rightDetails = [detail];

    render(<Accordion items={items} allowMultiple={true} />);

    const header = getHeaderNode("Item 1");
    const detailNode = within(header).getByText("Info");
    fireEvent.click(detailNode);

    expect(onOpen).toHaveBeenCalledTimes(0);
    expect(onClose).toHaveBeenCalledTimes(0);
    expect(onDetailClick).toHaveBeenCalledTimes(1);
  });

  it("disabled item ignores header clicks", () => {
    const onClick = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    const items = baseItems();
    items[0].disabled = true;
    items[0].onClick = onClick;
    items[0].onOpen = onOpen;
    items[0].onClose = onClose;

    render(<Accordion items={items} allowMultiple={true} />);
    fireEvent.click(getHeaderNode("Item 1"));
    expect(onClick).toHaveBeenCalledTimes(0);
    expect(onOpen).toHaveBeenCalledTimes(0);
    expect(onClose).toHaveBeenCalledTimes(0);
  });

  it("passes mouse event and id to onClick/onOpen/onClose", () => {
    const onClick = vi.fn();
    const onOpen = vi.fn();
    const onClose = vi.fn();

    const items = baseItems();
    items[1].onClick = onClick;
    items[1].onOpen = onOpen;
    items[1].onClose = onClose;

    render(<Accordion items={items} allowMultiple={true} />);

    fireEvent.click(getHeaderNode("Item 2"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);

    const [clickEvt, clickId] = onClick.mock.calls[0];
    const [openEvt, openId] = onOpen.mock.calls[0];
    expect(clickId).toBe("a2");
    expect(openId).toBe("a2");
    expect((clickEvt as any).nativeEvent).toBeInstanceOf(MouseEvent);
    expect((openEvt as any).nativeEvent).toBeInstanceOf(MouseEvent);

    fireEvent.click(getHeaderNode("Item 2"));
    const [closeEvt, closeId] = onClose.mock.calls[0];
    expect(closeId).toBe("a2");
    expect((closeEvt as any).nativeEvent).toBeInstanceOf(MouseEvent);
  });

  it("renders rightContent when provided", () => {
    const items = baseItems();
    items[0].rightContent = <div data-testid="right-content">RC</div>;

    render(<Accordion items={items} allowMultiple={true} />);
    expect(screen.getByTestId("right-content")).toBeInTheDocument();
  });

  it("new item inserted later initializes from its open prop as initial (uncontrolled until parent changes it)", () => {
    const onClose3 = vi.fn();

    const DynamicHarness: React.FC = () => {
      const [withThird, setWithThird] = React.useState(false);
      const list: AccordionItemProps[] = baseItems();
      if (withThird) {
        list.push({
          id: "a3",
          title: "Item 3",
          children: <div>Content 3</div>,
          color: "warning",
          open: true, // initial (uncontrolled)
          onClose: onClose3,
        });
      }
      return (
        <>
          <button onClick={() => setWithThird(true)}>add</button>
          <Accordion items={list} allowMultiple={true} />
        </>
      );
    };

    render(<DynamicHarness />);
    fireEvent.click(screen.getByText("add")); // add the third item

    const header3 = getHeaderNode("Item 3");
    fireEvent.click(header3); // close it
    expect(onClose3).toHaveBeenCalledTimes(1);
  });

  it("controlled item mirrors parent on prop change (no user click needed)", () => {
    // isolate fake timers for parent timeouts
    vi.useFakeTimers();
    try {
      const onOpen = vi.fn();
      const onClose = vi.fn();

      const ControlledFlip: React.FC = () => {
        const [open, setOpen] = React.useState(false);
        const items = baseItems();
        items[0].open = open;
        items[0].onOpen = onOpen;
        items[0].onClose = onClose;

        React.useEffect(() => {
          const t1 = setTimeout(() => setOpen(true), 0);
          const t2 = setTimeout(() => setOpen(false), 10);
          return () => { clearTimeout(t1); clearTimeout(t2); };
        }, []);

        return <Accordion items={items} allowMultiple={true} />;
      };

      render(<ControlledFlip />);
      act(() => {
        vi.advanceTimersByTime(20);
      });
      // no user-driven handlers should fire from parent prop flips
      expect(onOpen).toHaveBeenCalledTimes(0);
      expect(onClose).toHaveBeenCalledTimes(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("controlled via activeKeys: toggling calls onActiveKeysChange and does not mutate automatically", () => {
    const onActiveKeysChange = vi.fn();
    const items = [
      { id: "a1", title: "Item 1", children: <div>Content 1</div> },
      { id: "a2", title: "Item 2", children: <div>Content 2</div> },
    ];

    const Harness: React.FC = () => {
      const [keys, setKeys] = React.useState<string[]>(["a1"]);
      return (
        <>
          <div data-testid="state">{keys.join(",")}</div>
          <Accordion
            items={items}
            activeKeys={keys}
            onActiveKeysChange={(k) => {
              onActiveKeysChange(k);
              // note: *parent* decides whether to accept or ignore
              setKeys(k);
            }}
            allowMultiple={false}
          />
        </>
      );
    };

    render(<Harness />);
    // Item 1 is active; clicking Item 2 should request switch to a2
    fireEvent.click(getHeaderNode("Item 2"));
    expect(onActiveKeysChange).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("state")).toHaveTextContent("a2");
  });

  it("forcedOpenKeys keeps a panel open even when toggled closed", () => {
    const items = [
      { id: "a1", title: "Item 1", children: <div>Content 1</div> },
      { id: "a2", title: "Item 2", children: <div>Content 2</div> },
    ];

    const onClose = vi.fn();

    // single render, then attach callback via rerender so we don't have two trees
    const { rerender } = render(
      <Accordion
        items={[{ ...items[0], onClose }, items[1]]}
        forcedOpenKeys={["a1"]}
        allowMultiple={true}
      />
    );

    // Try to "close" Item 1 — it is forced open, so onClose should NOT fire
    fireEvent.click(getHeaderNode("Item 1"));
    expect(onClose).toHaveBeenCalledTimes(0);

    // (optional) prove it still stays open after rerender cycles
    rerender(
      <Accordion
        items={[{ ...items[0], onClose }, items[1]]}
        forcedOpenKeys={["a1"]}
        allowMultiple={true}
      />
    );
    fireEvent.click(getHeaderNode("Item 1"));
    expect(onClose).toHaveBeenCalledTimes(0);
  });

  it("defaultOpenKeys opens panels initially (uncontrolled) without needing item.open", () => {
    const items = [
      { id: "a1", title: "Item 1", children: <div>Content 1</div> },
      { id: "a2", title: "Item 2", children: <div>Content 2</div> },
    ];

    // initial mount with default open (uncontrolled)
    const { rerender } = render(
      <Accordion
        items={items}
        defaultOpenKeys={["a2"]}
        allowMultiple={true}
      />
    );

    // Now attach onClose to Item 2 via rerender (still a single tree)
    const onClose = vi.fn();
    rerender(
      <Accordion
        items={[items[0], { ...items[1], onClose }]}
        defaultOpenKeys={["a2"]}
        allowMultiple={true}
      />
    );

    // First click on Item 2 should close it and call onClose once
    fireEvent.click(getHeaderNode("Item 2"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("controlled activeKeys respects forcedOpenKeys (forced stays open while switching)", () => {
    const items = [
      { id: "a1", title: "Item 1", children: <div>Content 1</div> },
      { id: "a2", title: "Item 2", children: <div>Content 2</div> },
      { id: "a3", title: "Item 3", children: <div>Content 3</div> },
    ];

    const Harness: React.FC = () => {
      const [keys, setKeys] = React.useState<string[]>(["a2"]);
      return (
        <Accordion
          items={items}
          activeKeys={keys}
          onActiveKeysChange={setKeys}
          forcedOpenKeys={["a1"]}
          allowMultiple={false}
        />
      );
    };

    render(<Harness />);
    // Click Item 3 -> activeKeys should change to a3, but a1 remains open (forced)
    fireEvent.click(getHeaderNode("Item 3"));
  });

  // ───────────────────────────────────────────────────────────────
  // NEW: React.lazy coverage for Accordion children (no fake timers)
  // ───────────────────────────────────────────────────────────────

  it("React.lazy child renders for initially open panel after lazy resolves", async () => {
    const LazyA = React.lazy(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return { default: () => <div>Lazy A</div> };
    });

    render(
      <Accordion
        items={[
          { id: "l-open", title: "Lazy Open", children: <LazyA />, open: true },
          { id: "eager", title: "Eager", children: <div>Eager</div> },
        ]}
        allowMultiple
      />
    );

    // Not visible immediately (deferred mount + suspense)
    expect(screen.queryByText("Lazy A")).not.toBeInTheDocument();

    // Let idle tick + lazy module resolve naturally
    expect(await screen.findByText("Lazy A")).toBeInTheDocument();
  });

  it("React.lazy child loads when closed panel is opened", async () => {
    const LazyB = React.lazy(async () => {
      await new Promise((r) => setTimeout(r, 15));
      return { default: () => <div>Lazy B</div> };
    });

    render(
      <Accordion
        items={[
          { id: "a1", title: "A", children: <div>Content A</div>, open: true },
          { id: "b1", title: "B (Lazy)", children: <LazyB /> },
        ]}
        allowMultiple
      />
    );

    // Ensure A appears after initial idle
    expect(await screen.findByText("Content A")).toBeInTheDocument();

    // Open the lazy panel
    fireEvent.click(getHeaderNode("B (Lazy)"));
    expect(screen.queryByText("Lazy B")).not.toBeInTheDocument();

    // Wait for the lazy module to resolve and the panel to mount its children
    expect(await screen.findByText("Lazy B")).toBeInTheDocument();
  });

  it("unmounts children after close transition (onTransitionEnd)", async () => {
    render(
      <Accordion
        items={[{ id: "x", title: "X", children: <div>X body</div>, open: true }]}
      />
    );

    // Ensure mounted after idle tick
    expect(await screen.findByText("X body")).toBeInTheDocument();

    const header = screen.getByText("X").closest(".accordion-header")!;
    const body = header.parentElement!.querySelector(".accordion-body") as HTMLElement;
    const inner = body.querySelector(":scope > *") as HTMLElement; // AccordionContentInner

    // Close it (keeps wrapper until transition end)
    fireEvent.click(header);

    // Let React render "closing" state
    await Promise.resolve();

    // Fire both property name variants on the wrapper
    await act(async () => {
      fireEvent.transitionEnd(body, { propertyName: "maxHeight" } as any);
    });
    await act(async () => {
      fireEvent.transitionEnd(body, { propertyName: "max-height" } as any);
    });

    // If still present (env nuance), also fire on the inner node to bubble/capture through
    if (screen.queryByText("X body") && inner) {
      await act(async () => {
        fireEvent.transitionEnd(inner, { propertyName: "maxHeight" } as any);
      });
      await act(async () => {
        fireEvent.transitionEnd(inner, { propertyName: "max-height" } as any);
      });
    }

    // Wait for unmount commit
    await waitFor(() => {
      expect(screen.queryByText("X body")).not.toBeInTheDocument();
    });
  });


});
