"use client";

import {
  Badge,
  Group,
  Stack,
  Text,
  Box,
  Progress,
  Avatar,
  rem,
  Tooltip,
  ActionIcon,
  Button,
  ThemeIcon,
} from "@mantine/core";
import {
  IconUserPlus,
  IconUserMinus,
  IconUserCheck,
  IconHash,
  IconPencil,
  IconLock,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Project } from "../types/project";
import { User } from "@supabase/supabase-js";
import { notify } from "@/lib/notify";
import { modals } from "@mantine/modals";
import { ICON_MAP, STATUS_THEMES } from "@/app/constants/project";

export const ProjectRow = ({
  proj,
  currentUser,
  onEdit,
}: {
  proj: Project;
  currentUser: User | null;
  onEdit?: (p: Project) => void;
}) => {
  const router = useRouter();
  const members = proj.member_details ?? [];

  const isApproved = members.some(
    (m) => m.user_id === currentUser?.id && m.status === "approved",
  );
  const isPending = members.some(
    (m) => m.user_id === currentUser?.id && m.status === "pending",
  );
  const isOwner = proj.owner_id === currentUser?.id;

  const ProjectIcon =
    ICON_MAP[proj.icon as keyof typeof ICON_MAP] || ICON_MAP.IconRocket;
  const theme =
    STATUS_THEMES[proj.status as keyof typeof STATUS_THEMES] ||
    STATUS_THEMES.Planning;

  const handleAction = async (
    e: React.MouseEvent,
    action: "join" | "cancel" | "leave",
  ) => {
    e.stopPropagation();
    if (!currentUser) return;

    try {
      if (action === "join") {
        const { error } = await supabase.from("project_members").insert({
          project_id: proj.id,
          user_id: currentUser.id,
          role: "member",
          status: "pending",
        });
        if (error) throw error;
      } else if (action === "cancel") {
        const { error } = await supabase
          .from("project_members")
          .delete()
          .eq("project_id", proj.id)
          .eq("user_id", currentUser.id)
          .eq("status", "pending");
        if (error) throw error;
      } else if (action === "leave") {
        modals.openConfirmModal({
          title: "プロジェクトから退出",
          children: (
            <Text size="sm">
              このプロジェクトから退出します。よろしいですか？
            </Text>
          ),
          labels: { confirm: "退出する", cancel: "キャンセル" },
          confirmProps: { color: "red", radius: "md" },
          onConfirm: async () => {
            const { error } = await supabase
              .from("project_members")
              .delete()
              .eq("project_id", proj.id)
              .eq("user_id", currentUser.id);
            if (error) notify.error("退出に失敗しました");
          },
        });
      }
    } catch (err) {
      notify.error("操作を完了できませんでした");
    }
  };

  return (
    <>
      <Box
        onClick={() => router.push(`/projects/${proj.id}`)}
        className="project-row-container"
      >
        {/* 1. PROJECT: メイン情報 */}
        <Group gap="sm" wrap="nowrap" className="grid-project">
          <ThemeIcon
            variant="light"
            color={proj.visibility === "private" ? "gray" : "blue"}
            size={40}
            radius="md"
            className="flex-shrink-0"
          >
            <ProjectIcon size={22} />
          </ThemeIcon>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Group gap={6} wrap="nowrap">
              {proj.visibility === "private" && (
                <IconLock size={14} color="gray" />
              )}
              <Text fw={600} size="sm" truncate>
                {proj.title}
              </Text>
            </Group>
          </Box>
        </Group>

        {/* 2. STATUS */}
        <Box className="grid-status">
          <Badge variant="dot" color={theme.color} size="sm">
            {theme.label}
          </Badge>
        </Box>

        {/* 3. PROGRESS */}
        <Box className="grid-progress">
          <Group justify="space-between" mb={4} visibleFrom="sm">
            <Text size="xs" fw={800} c="dimmed">
              Progress
            </Text>
          </Group>
          <Stack gap={2}>
            <Text size="xs" fw={800} ta="right" className="progress-text">
              {proj.progress}%
            </Text>
            <Progress
              value={proj.progress}
              size="xs"
              color={theme.color}
              radius="xl"
            />
          </Stack>
        </Box>

        {/* 4. TAGS */}
        <Box className="grid-tags">
          <Box visibleFrom="sm" mb={4}>
            <Text size="xs" fw={800} c="dimmed">
              Tags
            </Text>
          </Box>

          <Group gap={4} wrap="wrap">
            {proj.tags?.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                color="gray"
                size="xs"
                leftSection={<IconHash size={10} />}
                style={{ textTransform: "none" }}
              >
                {tag}
              </Badge>
            ))}
          </Group>
        </Box>

        {/* 5. TEAM */}
        <Box className="grid-team">
          <Group justify="space-between" mb={4} visibleFrom="sm">
            <Text size="xs" fw={800} c="dimmed">
              Members
            </Text>
          </Group>
          <Avatar.Group spacing="xs">
            {members
              .filter((m) => m.status === "approved")
              .slice(0, 3)
              .map((m) => (
                <Tooltip key={m.user_id} label={m.username} withArrow>
                  <Avatar
                    src={m.avatar_url}
                    key={m.avatar_url}
                    size={28}
                    radius="xl"
                  />
                </Tooltip>
              ))}
          </Avatar.Group>
        </Box>

        {/* 6. ACTIONS */}
        <Group justify="flex-end" className="grid-actions">
          {currentUser && !isOwner && (
            <Box onClick={(e) => e.stopPropagation()}>
              <Button
                variant="light"
                color={isApproved ? "red" : isPending ? "gray" : "blue"}
                size="xs"
                radius="md"
                leftSection={
                  isApproved ? (
                    <IconUserMinus size={14} />
                  ) : isPending ? (
                    <IconUserCheck size={14} />
                  ) : (
                    <IconUserPlus size={14} />
                  )
                }
                onClick={(e) =>
                  handleAction(
                    e,
                    isApproved ? "leave" : isPending ? "cancel" : "join",
                  )
                }
                className="action-button"
              >
                {isApproved ? "退出" : isPending ? "申請中" : "参加"}
              </Button>
            </Box>
          )}
          {isOwner && onEdit && (
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(proj);
              }}
            >
              <IconPencil size={18} />
            </ActionIcon>
          )}
        </Group>
      </Box>

      <style>{`
        /* ベーススタイル (スマホ) */
        .project-row-container {
          display: grid;
          padding: ${rem(16)};
          gap: ${rem(12)};
          border-bottom: 1px solid #f1f3f5;
          cursor: pointer;
          transition: background 0.2s ease;
          /* スマホでは2列レイアウト */
          grid-template-columns: 1fr auto;
        }

        .project-row-container:hover { background-color: #fcfcfd; }

        .grid-project { grid-column: 1; min-width: 0; }
        .grid-status { grid-column: 2; align-self: center; }
        .grid-progress { grid-column: 1 / span 2; }
        .grid-tags { grid-column: 1 / span 2; }
        .grid-team { grid-column: 1; align-self: center; }
        .grid-actions { grid-column: 2; align-self: center; }

        .action-button { width: ${rem(85)}; }

        /* PC用 (768px以上) */
        @media (min-width: 768px) {
          .project-row-container {
            /* 以前の DASHBOARD_GRID_COLS に相当する横並び設定 */
            grid-template-columns: 1.2fr 100px 1.2fr 1.8fr 100px 110px;
            gap: ${rem(16)};
          }
          
          /* PCでは全要素を1行に */
          .grid-project, .grid-status, .grid-progress, 
          .grid-tags, .grid-team, .grid-actions {
            grid-column: auto !important;
          }

          .progress-text { margin-bottom: 0; }
        }

        .flex-shrink-0 { flex-shrink: 0; }
      `}</style>
    </>
  );
};
