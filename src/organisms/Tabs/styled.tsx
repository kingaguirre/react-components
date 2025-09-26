// src/components/Tabs/styled.tsx
import styled, { keyframes, css } from "styled-components";
import { theme } from "../../styles/theme";
import { ifElse } from "../../utils/index";
import { ColorType } from "../../common/interface";

export const TabWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

export const TabsContainer = styled.div<{
  $fullHeader: boolean;
  $variant: "default" | "pill";
}>`
  display: flex;
  align-items: center;
  overflow-x: auto;
  margin-bottom: -2px;
  white-space: nowrap;
  scrollbar-width: none;
  -ms-overflow-style: none;
  ${({ $fullHeader }) => ($fullHeader ? "width: 100%;" : "")}

  &::-webkit-scrollbar {
    display: none;
  }

  /* Pill track background + spacing — lighter than the pills */
  ${({ $variant }) =>
    $variant === "pill" &&
    css`
      padding: 6px;
      border-radius: 8px;
      gap: 6px;
    `}
`;

export const TabItem = styled.button<{
  $active: boolean;
  $focused: boolean;
  $disabled: boolean;
  $color: ColorType;
  $fullHeader: boolean;
  $variant: "default" | "pill";
}>`
  /* shared base */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  border: 2px solid transparent;
  transition:
    transform 0.06s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
  cursor: ${({ $disabled, $active }) =>
    $disabled ? "not-allowed" : ifElse($active, "default", "pointer")};
  color: ${({ $disabled }) =>
    $disabled ? theme.colors.default.dark : theme.colors.default.darker};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  ${({ $fullHeader }) => ($fullHeader ? "flex: 1;" : "")}

  .badge {
    margin: -4px 0;
  }

  /* ---------- DEFAULT (unchanged look) ---------- */
  ${({ $variant, $active, $color }) =>
    $variant === "default" &&
    css`
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      background-color: ${$active ? theme.colors[$color].pale : "transparent"};
      border-color: ${$active ? theme.colors[$color].base : "transparent"};
      border-bottom-color: transparent;

      .title {
        transition: color 0.2s ease;
        color: ${!$active
          ? theme.colors[$color].base
          : theme.colors[$color].dark};
      }

      .icon {
        font-size: 16px;
        color: ${theme.colors.default.darker};
      }

      &:hover .title {
        color: ${!$active ? theme.colors[$color].dark : undefined};
      }
    `}

  /* ---------- PILL (refined) ---------- */
  ${({ $variant, $active, $color, $disabled }) =>
    $variant === "pill" &&
    css`
      border-radius: 8px;
      border-width: 1px;
      border-color: ${$active ? theme.colors[$color].base : "transparent"};

      /* ✅ Backgrounds:
         - ACTIVE: solid brand
         - INACTIVE: very light tint (distinct from track) */
      ${$active
        ? css`
            background: ${theme.colors[$color].base};
          `
        : css`
            /* fallback */
            background:
              linear-gradient(
                0deg,
                rgba(255, 255, 255, 0.88),
                rgba(255, 255, 255, 0.88)
              ),
              ${theme.colors[$color].pale};

            /* modern browsers: slightly stronger than track (track = 20%) */
            background: color-mix(
              in srgb,
              ${theme.colors[$color].pale} 35%,
              white
            );
          `}

      /* elevated active; hairline for inactive */
      box-shadow: ${$active
        ? "0 4px 12px rgba(0,0,0,0.12), inset 0 -1px 0 rgba(255,255,255,0.15)"
        : "inset 0 0 0 1px rgba(0,0,0,0.06)"};

      /* nicer scroll behavior for many tabs */
      scroll-snap-align: center;

      .title {
        transition: color 0.2s ease;
        color: ${$active ? "#fff" : theme.colors[$color].dark};
      }

      .icon {
        font-size: 16px;
        color: ${$active ? "#fff" : theme.colors[$color].base};
      }

      .badge {
        ${$active
          ? "filter: brightness(1.15); opacity: 0.95;"
          : "opacity: 0.9;"}
      }

      &:hover {
        ${!$disabled && !$active
          ? css`
              /* hover: nudge a bit richer than the base inactive */
              background: color-mix(
                in srgb,
                ${theme.colors[$color].pale} 45%,
                white
              );
              border-color: ${theme.colors[$color].base};
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            `
          : ""}
      }

      &:active {
        transform: translateY(1px);
        box-shadow: ${$active
          ? "0 3px 10px rgba(0,0,0,0.10), inset 0 -1px 0 rgba(255,255,255,0.12)"
          : "inset 0 0 0 1px rgba(0,0,0,0.08)"};
      }

      &:focus-visible {
        outline: none;
        box-shadow:
          0 0 0 3px ${theme.colors[$color].pale},
          ${$active
            ? "0 4px 12px rgba(0,0,0,0.12)"
            : "inset 0 0 0 1px rgba(0,0,0,0.10)"};
      }
    `}

  /* Keyboard focus hint for default variant */
  ${({ $focused, $disabled, $color, $active, $variant }) =>
    $focused &&
    !$disabled &&
    ($variant === "pill"
      ? css`
          box-shadow: 0 0 0 4px ${theme.colors[$color].pale};
          border-color: ${theme.colors[$color].base};
        `
      : css`
          background-color: ${theme.colors[$color].pale};
          ${!$active
            ? `border-bottom-color: ${theme.colors[$color].base};`
            : ""}
        `)}
`;

const getPosition = (position: string) => {
  switch (true) {
    case position === "left":
      return "left: 0;";
    case position === "left-adjusted":
      return "left: 35px;";
    case position === "right":
      return "right: 0;";
    default:
      return "right: 35px;";
  }
};

export const ScrollButton = styled.button<{
  $position: "left" | "left-adjusted" | "right" | "right-adjusted";
  $variant: "default" | "pill";
}>`
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 4px;
  top: 0;
  transition: all 0.2s ease;
  z-index: 2;
  color: ${theme.colors.primary.dark};
  outline: none;

  ${({ $position }) => getPosition($position)}

  /* round icon button feel when pills are on */
  ${({ $variant }) =>
    $variant === "pill" &&
    css`
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: transparent;

      &:hover {
        background: rgba(0, 0, 0, 0.05);
        color: ${theme.colors.primary.base};
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      }

      &:active {
        transform: translateY(1px);
      }
    `}

  /* default hover */
  &:hover {
    color: ${theme.colors.primary.base};
  }
`;

export const TabContentWrapper = styled.div<{
  $color: ColorType;
  $variant: "default" | "pill";
}>`
  padding: 12px;
  border-top: ${({ $variant, $color }) =>
    $variant === "pill"
      ? "0"
      : `2px solid ${theme.colors[$color || "primary"].base}`};
  font-size: 14px;
  color: ${theme.colors.default.dark};
  outline: none;
  transition: all 0.3s ease;
  /* prevent bleed during height animation */
  overflow: hidden;

  /* Modern content styling to match pill header */
  ${({ $variant, $color }) =>
    $variant === "pill" &&
    css`
      position: relative;
      padding: 12px;
      border-radius: 6px;

      /* soft card background, lighter than track */
      background:
        linear-gradient(
          0deg,
          rgba(255, 255, 255, 0.95),
          rgba(255, 255, 255, 0.95)
        ),
        ${theme.colors.default.pale};

      /* hairline card border + tiny depth */
      box-shadow:
        inset 0 0 0 1px rgba(0, 0, 0, 0.04),
        0 1px 2px rgba(0, 0, 0, 0.04);

      /* subtle colored accent that echoes default's border-top */
      &::before {
        content: "";
        position: absolute;
        left: 3px;
        right: 3px;
        top: 0;
        height: 3px;
        border-radius: 3px;
        /* soft tint of the active color */
        background: color-mix(
          in srgb,
          ${theme.colors[$color].base} 26%,
          transparent
        );
      }
    `}

  p {
    margin: 0 0 16px;
  }
`;

export const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  background: transparent;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 4px;
  color: ${theme.colors.primary.dark};
  transition: all 0.3s ease;
  outline: none;

  &:hover {
    color: ${theme.colors.primary.base};
  }
`;

/* ✅ Only fade-in (No flickering) */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const TabContent = styled.div`
  animation: ${fadeIn} 0.2s ease-in-out;
`;
