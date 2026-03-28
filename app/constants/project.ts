// app/constants/project.ts
import {
  IconRocket,
  IconCode,
  IconDeviceLaptop,
  IconPalette,
  IconCpu,
  IconDatabase,
  IconBrandRust,
  IconMessage,
} from "@tabler/icons-react";

export const ICON_MAP: Record<
  string,
  React.FC<{ size?: number; stroke?: number }>
> = {
  IconRocket,
  IconCode,
  IconDeviceLaptop,
  IconPalette,
  IconCpu,
  IconDatabase,
  IconBrandRust,
  IconMessage,
};

export const STATUS_THEMES: Record<string, { color: string; label: string }> = {
  "In Progress": { color: "blue", label: "進行中" },
  Completed: { color: "teal", label: "完了" },
  Planning: { color: "orange", label: "準備中" },
  "On Hold": { color: "gray", label: "保留" },
};

export const POSITION_OPTIONS = [
  { value: "Frontend", label: "Frontend" },
  { value: "Backend", label: "Backend" },
  { value: "Design", label: "Design" },
  { value: "Infra", label: "Infra" },
  { value: "App", label: "Mobile App" },
  { value: "Collaborator", label: "Collaborator" },
];

export const DASHBOARD_GRID_COLS = "1fr 120px 150px 140px 120px 45px";
