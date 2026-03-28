// lib/notify.ts
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX, IconAlertTriangle } from "@tabler/icons-react";
import React from "react";

export const notify = {
  success: (message: string, title?: string) =>
    notifications.show({
      title,
      message,
      color: "teal",
      icon: React.createElement(IconCheck, { size: 16 }),
      radius: "md",
      autoClose: 3000,
    }),

  error: (message: string, title?: string) =>
    notifications.show({
      title,
      message,
      color: "red",
      icon: React.createElement(IconX, { size: 16 }),
      radius: "md",
      autoClose: 5000,
    }),

  warning: (message: string, title?: string) =>
    notifications.show({
      title,
      message,
      color: "orange",
      icon: React.createElement(IconAlertTriangle, { size: 16 }),
      radius: "md",
      autoClose: 4000,
    }),
};
