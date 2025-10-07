import { Icon } from "../../atoms/Icon";

export const DEFAULT_INITIAL_MESSAGE = (
  <>
    <div>
      Hi, I’m your <b>TradeXpress Helix Agent</b>.
    </div>
    <br />
    <div>Questions about TradeXpress Helix? I’m here to help.</div>
    <hr />
    <div>
      <b>Module Shortcut</b>: with <code>Alt + /</code>
    </div>
  </>
);

export const REPLY_CANCEL_MESSAGE = (
  <>
    <Icon icon="warning" />
    &nbsp;
    <span>Reply canceled — you stopped the assistant.</span>
  </>
);

export const TIMEAGO_TICK_MS = 30_000;
