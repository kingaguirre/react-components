import React, { useState, useRef, useEffect } from "react";
import { Icon } from "src/atoms/Icon";
import { Notifications, NotificationItem } from "../../interface";
import { timeAgo } from "./utils";
import { theme } from "src/styles/theme";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import {
  NotificationContainer,
  BellButton,
  Badge,
  DropdownMenu,
  DropdownHeader,
  HeaderTitle,
  HeaderCloseButton,
  NotificationListWrapper,
  EmptyState,
  NotificationItemWrapper,
  DetailedNotificationItem,
  NotificationContent,
  NotificationTitle,
  NotificationMessage,
  NotificationTime,
  NewIndicator,
  NotificationImage,
  NotificationDetails,
  NotificationName,
  NotificationEmail,
  Footer,
  FooterButton,
  ClearIconWrapper,
  NotificationImageImg,
  NotificationIconWrapper,
} from "./styled";

const ANIMATION_DURATION = 300; // in ms
export const NotificationDropdown: React.FC<Notifications> = ({
  notifications = [],
  totalNewNotifications,
  onShowAllClick,
  dropdownHeight = "400px",
  showTotalCount = true,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [localNotifications, setLocalNotifications] =
    useState<NotificationItem[]>(notifications);

  useEffect(() => {
    if (notifications?.length > 0) {
      setLocalNotifications(notifications);
    }
  }, [notifications]);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  useOnClickOutside(containerRef, closeDropdown, dropdownOpen);

  // Control rendering: when opening, render immediately; when closing, wait for exit animation.
  useEffect(() => {
    if (dropdownOpen) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(
        () => setShouldRender(false),
        ANIMATION_DURATION,
      );
      return () => clearTimeout(timer);
    }
  }, [dropdownOpen]);

  const removeNotification = (id: string | number) => {
    setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const dismissAll = () => {
    setLocalNotifications([]);
  };

  const badgeCount =
    totalNewNotifications && totalNewNotifications > 10
      ? "9+"
      : totalNewNotifications?.toString();

  return notifications?.length > 0 ? (
    <NotificationContainer ref={containerRef}>
      <BellButton
        onClick={toggleDropdown}
        data-testid="notification-dropdown-button"
        className={dropdownOpen ? "open" : ""}
      >
        <Icon icon="bell" />
        {totalNewNotifications && totalNewNotifications > 0 && (
          <Badge $showTotalCount={showTotalCount}>{badgeCount}</Badge>
        )}
      </BellButton>
      {shouldRender && (
        <DropdownMenu $open={dropdownOpen} $dropdownHeight={dropdownHeight}>
          <DropdownHeader>
            <HeaderTitle>Notifications</HeaderTitle>
            <HeaderCloseButton
              data-testid="notification-dropdown-close-button"
              onClick={closeDropdown}
            >
              <Icon icon="clear" />
            </HeaderCloseButton>
          </DropdownHeader>
          <NotificationListWrapper>
            {localNotifications && localNotifications.length > 0 ? (
              localNotifications.map((notification) => {
                const clickable = !!notification.onClick;
                const commonOnClick = () => {
                  if (notification.onClick) {
                    notification.onClick();
                    closeDropdown();
                  }
                };
                const baseColor = notification.color
                  ? theme.colors[notification.color].base
                  : undefined;
                const computedBorderStyle = notification.color
                  ? notification.color === "warning" ||
                    notification.color === "danger"
                    ? { borderColor: baseColor }
                    : { borderLeftColor: baseColor }
                  : {};

                if (notification.type === "detailed") {
                  return (
                    <DetailedNotificationItem
                      key={notification.id}
                      onClick={clickable ? commonOnClick : undefined}
                      style={computedBorderStyle}
                    >
                      {notification.isNew && <NewIndicator />}
                      <ClearIconWrapper
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                      >
                        <Icon icon="trash" size={12} />
                      </ClearIconWrapper>
                      {notification.imageUrl ? (
                        <NotificationImage>
                          <NotificationImageImg
                            src={notification.imageUrl}
                            alt={notification.name}
                          />
                        </NotificationImage>
                      ) : (
                        <NotificationImage>
                          {notification.name
                            ? notification.name.charAt(0).toUpperCase()
                            : "?"}
                        </NotificationImage>
                      )}
                      <NotificationDetails>
                        <NotificationName $color={baseColor}>
                          {notification.name}
                        </NotificationName>
                        <NotificationEmail>
                          {notification.email}
                        </NotificationEmail>
                        <NotificationMessage>
                          {notification.message}
                        </NotificationMessage>
                        {notification.messageContent && (
                          <div onClick={(e) => e.stopPropagation()}>
                            {notification.messageContent}
                          </div>
                        )}
                        <NotificationTime>
                          {timeAgo(notification.dateTime)}
                        </NotificationTime>
                      </NotificationDetails>
                    </DetailedNotificationItem>
                  );
                } else {
                  // default type
                  return (
                    <NotificationItemWrapper
                      key={notification.id}
                      onClick={clickable ? commonOnClick : undefined}
                      style={computedBorderStyle}
                    >
                      {notification.isNew && <NewIndicator />}
                      <ClearIconWrapper
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                      >
                        <Icon icon="trash" size={12} />
                      </ClearIconWrapper>
                      {notification.icon && (
                        <NotificationIconWrapper>
                          <Icon
                            icon={notification.icon}
                            color={baseColor}
                            size={30}
                          />
                        </NotificationIconWrapper>
                      )}
                      <NotificationContent>
                        <NotificationTitle $color={baseColor}>
                          {notification.title}
                        </NotificationTitle>
                        <NotificationMessage>
                          {notification.message}
                        </NotificationMessage>
                        {notification.messageContent && (
                          <div onClick={(e) => e.stopPropagation()}>
                            {notification.messageContent}
                          </div>
                        )}
                        <NotificationTime>
                          {timeAgo(notification.dateTime)}
                        </NotificationTime>
                      </NotificationContent>
                    </NotificationItemWrapper>
                  );
                }
              })
            ) : (
              <EmptyState>No notifications</EmptyState>
            )}
          </NotificationListWrapper>
          <Footer>
            <div>
              {onShowAllClick && (
                <FooterButton
                  onClick={() => {
                    onShowAllClick();
                    closeDropdown();
                  }}
                >
                  Show All
                </FooterButton>
              )}
            </div>
            <FooterButton
              onClick={() => {
                dismissAll();
                closeDropdown();
              }}
            >
              Dismiss All
            </FooterButton>
          </Footer>
        </DropdownMenu>
      )}
    </NotificationContainer>
  ) : null;
};
