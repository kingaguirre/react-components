import React from "react";
/** ----------------------------------------------------------------------
 * Reusable demo container for “empty” areas when the ChatWidget portals out.
 * Provides consistent padding, styling, and helpful guidance.
 * --------------------------------------------------------------------- */
export const DemoContainer: React.FC<{
  height?: number;
  icon?: string;
  title?: string;
  note?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({
  height = 200,
  icon = "💬",
  title = "Demo Area",
  note = (
    <>
      This area looks empty because the chat panel renders via a <b>portal</b>.{" "}
      <br />
      Use the launcher on the right to open the chat.
    </>
  ),
  style,
}) => {
  return (
    <div
      style={{
        position: "relative",
        height,
        border: "1px dashed #cbd5e1",
        borderRadius: 8,
        padding: 16,
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        boxShadow:
          "inset 0 0 0 1px rgba(148,163,184,0.08), 0 1px 2px rgba(0,0,0,0.03)",
        ...style,
      }}
    >
      <div style={{ maxWidth: 640, pointerEvents: "none" }}>
        <div style={{ fontSize: 28, lineHeight: 1 }}>{icon}</div>
        <div style={{ fontWeight: 650, marginTop: 6 }}>{title}</div>
        <div
          style={{ opacity: 0.9, fontSize: 13, marginTop: 6, lineHeight: 1.45 }}
        >
          {note}
        </div>
      </div>
    </div>
  );
};
