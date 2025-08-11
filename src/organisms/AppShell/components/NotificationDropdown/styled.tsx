import styled from "styled-components";
import { scrollStyle, theme, fadeInOnMount } from "src/styles";

export const NotificationContainer = styled.div`
  position: relative;
  display: block;
`;

export const BellButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  padding: 0;
  font-size: 13px;
  line-height: 1;
  color: ${theme.colors.warning.darker};
  height: 32px;
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top-right-radius: 2px;
  border-top-left-radius: 2px;
  transition: all 0.3s ease;
  &.open,
  &:hover {
    background-color: ${theme.colors.warning.pale};
  }
`;

export const Badge = styled.div<{ $showTotalCount?: boolean }>`
  position: absolute;
  background: #bf0711;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  ${({ $showTotalCount }) =>
    $showTotalCount
      ? `
    top: 6px;
    right: 6px;
    font-size: 5px;
    width: 8px;
    height: 8px;
  `
      : `
    top: 8px;
    right: 9px;
    font-size: 0;
    width: 5px;
    height: 5px;
  `};
`;

export const DropdownMenu = styled.div<{
  $open: boolean;
  $dropdownHeight: string;
}>`
  ${fadeInOnMount}
  position: absolute;
  top: 100%;
  right: 0;
  width: 320px;
  background: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: ${(props) => props.$dropdownHeight};
  display: flex;
  flex-direction: column;
  opacity: ${(props) => (props.$open ? 1 : 0)};
  transition: opacity 0.3s ease;
  min-width: 120px;
  border-radius: 2px;
  overflow: hidden;
`;

export const DropdownHeader = styled.div`
  padding: 4px 16px;
  background-color: ${theme.colors.lightA};
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
`;

export const HeaderTitle = styled.div`
  font-weight: bold;
  font-size: 12px;
  color: ${theme.colors.primary.darker};
`;

export const HeaderCloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: ${theme.colors.primary.darker};
  line-height: 1;
  padding: 0;
  transition: all 0.3s ease;
  right: -4px;
  position: relative;
  &:hover {
    color: ${theme.colors.danger.base};
  }
`;

export const NotificationListWrapper = styled.div`
  flex: 1;
  overflow-y: scroll;
  ${scrollStyle}
`;

export const EmptyState = styled.div`
  padding: 1rem;
  text-align: center;
  color: #999;
`;

export const ClearIconWrapper = styled.div`
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.3s ease,
    color 0.3s ease;
  color: ${theme.colors.default.dark};

  &:hover {
    color: ${theme.colors.danger.base};
  }

  &:hover svg {
    fill: ${theme.colors.danger.base};
  }
`;

export const NotificationItemWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px;
  border-width: 1px 1px 1px 4px;
  border-style: solid;
  border-color: transparent;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  &:hover {
    background-color: ${theme.colors.primary.pale};
  }
  &:last-child {
    border-bottom: none;
  }
  &:hover ${ClearIconWrapper} {
    opacity: 1;
  }
`;

export const NotificationContent = styled.div`
  flex: 1;
  overflow: hidden;
`;

export const NotificationTitle = styled.div<{ $color?: string }>`
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: ${(props) => props.$color || "inherit"};
  text-transform: uppercase;
  margin-bottom: 4px;
`;

export const NotificationMessage = styled.div`
  font-size: 12px;
  color: ${theme.colors.default.darker};
  margin-bottom: 4px;
`;

export const NotificationTime = styled.div`
  margin-top: 12px;
  font-size: 10px;
  color: ${theme.colors.default.base};
  font-style: italic;
`;

export const DetailedNotificationItem = styled(NotificationItemWrapper)`
  flex-direction: row;
  border-width: 1px 1px 1px 4px;
  border-style: solid;
  border-color: transparent;
  border-bottom: 1px solid #f0f0f0;
`;

export const NotificationImage = styled.div`
  width: 30px;
  min-width: 30px;
  max-width: 30px;
  height: 30px;
  margin-right: 12px;
  background: #ccc;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
`;

export const NotificationImageImg = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
`;

export const NotificationDetails = styled.div`
  flex: 1;
  overflow: hidden;
`;

export const NotificationName = styled.div<{ $color?: string }>`
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: ${(props) => props.$color || theme.colors.default.dark};
`;

export const NotificationEmail = styled.div`
  font-size: 10px;
  margin-bottom: 4px;
  color: ${theme.colors.default.base};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Footer = styled.div`
  border-top: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const FooterButton = styled.button`
  padding: 6px 12px;
  background: #f9f9f9;
  border: none;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.3s ease;
  color: ${theme.colors.primary.dark};
  &:hover {
    background: #f0f0f0;
    text-decoration: underline;
    color: ${theme.colors.primary.darker};
  }
`;

export const NewIndicator = styled.div`
  position: absolute;
  top: 12px;
  right: 4px;
  width: 8px;
  height: 8px;
  background-color: ${theme.colors.primary.base};
  border-radius: 50%;
`;

export const NotificationIconWrapper = styled.div`
  width: 30px;
  min-width: 30px;
  max-width: 30px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
