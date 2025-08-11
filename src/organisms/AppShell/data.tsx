import React from "react";
import { NotificationItem } from "./interface";
import { Button } from "src/atoms/Button";

// Notifications with 'dateTime' instead of 'time'
export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    type: "default",
    icon: "info",
    color: "info",
    title: "Info Notification",
    message: "This is an info notification. With custom button rendered.",
    dateTime: new Date().toISOString(), // current time
    isNew: true,
    onClick: () => alert("Info notification clicked"),
    messageContent: (
      <Button size="xs" onClick={() => alert("Custom button clicked!")}>
        Click Me
      </Button>
    ),
  },
  {
    id: 2,
    type: "default",
    color: "default", // default color example
    title: "Reminder",
    message: "Your subscription will expire soon.",
    // 5 minutes ago
    dateTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isNew: false,
    onClick: () => alert("Reminder clicked"),
  },
  {
    id: 3,
    type: "detailed",
    message: "You have a new friend request.",
    color: "primary",
    // 10 minutes ago
    dateTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    name: "Jane Smith",
    email: "jane.smith@example.com",
    isNew: true,
    onClick: () => alert("Friend request clicked"),
  },
  {
    id: 4,
    type: "default",
    icon: "warning",
    color: "warning",
    title: "Security Alert",
    message: "Suspicious login detected.",
    // 3 hours ago
    dateTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    isNew: true,
    onClick: () => alert("Security alert clicked"),
  },
  {
    id: 5,
    type: "detailed",
    message: "App update available: Version 2.0 is ready to install.",
    // 4 hours ago
    dateTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    name: "App Support",
    email: "support@app.com",
    isNew: true,
    onClick: () => alert("Update notification clicked"),
  },
  {
    id: 7,
    type: "default",
    title: "Maintenance Scheduled",
    message: "System maintenance is scheduled for tonight.",
    // 1 day ago
    dateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isNew: false,
    onClick: () => alert("Maintenance notification clicked"),
  },
  {
    id: 6,
    type: "default",
    icon: "check",
    color: "success",
    title: "Operation Successful",
    message: "Your data has been synced successfully.",
    // 2 days ago
    dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isNew: true,
    onClick: () => alert("Success notification clicked"),
  },
  {
    id: 8,
    type: "detailed",
    message: "New comment received on your post.",
    // 5 days ago
    dateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    isNew: true,
    onClick: () => alert("Comment notification clicked"),
  },
  {
    id: 11,
    type: "default",
    icon: "info",
    color: "info",
    title: "Weekly Summary",
    message: "Your weekly performance summary is now available.",
    // 1 month ago (30 days)
    dateTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    isNew: false,
    onClick: () => alert("Summary notification clicked"),
  },
  {
    id: 10,
    type: "detailed",
    message: "Invitation: Join the new project team.",
    // 2 months ago (60 days)
    dateTime: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    name: "Project Manager",
    email: "pm@example.com",
    isNew: true,
    onClick: () => alert("Project invitation clicked"),
  },
  {
    id: 9,
    type: "default",
    icon: "alert",
    color: "danger",
    title: "Sync Error",
    message: "Failed to sync your data with the server.",
    // approx 3 months ago (90 days)
    dateTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    isNew: false,
    onClick: () => alert("Error notification clicked"),
  },
  {
    id: 12,
    type: "detailed",
    message: "Event Invitation: Join the Tech Conference 2025.",
    // 2 years ago
    dateTime: new Date(
      Date.now() - 2 * 365 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    name: "Event Coordinator",
    email: "events@techconf.com",
    isNew: true,
    onClick: () => alert("Event invitation clicked"),
  },
  {
    id: 13,
    type: "default",
    icon: "message",
    color: "primary",
    title: "New Message",
    message: "You have received a new message in your inbox.",
    // 5 years ago
    dateTime: new Date(
      Date.now() - 5 * 365 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    isNew: true,
    onClick: () => alert("Message notification clicked"),
  },
];
