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
  IconPlus,
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
import {
  ICON_MAP,
  STATUS_THEMES,
  DASHBOARD_GRID_COLS,
} from "@/app/constants/project";

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

  // 認証情報の判定
  const isApproved = members.some(
    (m) => m.user_id === currentUser?.id && m.status === "approved",
  );
  const isPending = members.some(
    (m) => m.user_id === currentUser?.id && m.status === "pending",
  );
  const isOwner = proj.owner_id === currentUser?.id;

  // 定数からのテーマ取得
  const ProjectIcon =
    ICON_MAP[proj.icon as keyof typeof ICON_MAP] || ICON_MAP.IconRocket;
  const theme =
    STATUS_THEMES[proj.status as keyof typeof STATUS_THEMES] ||
    STATUS_THEMES.Planning;

  // 参加・退出アクションのハンドラ
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
    <Box
      onClick={() => router.push(`/projects/${proj.id}`)}
      px="md"
      py="md"
      style={{
        display: "grid",
        gridTemplateColumns: DASHBOARD_GRID_COLS,
        gap: "16px",
        alignItems: "center",
        borderBottom: "1px solid #f1f3f5",
        cursor: "pointer",
        transition: "background 0.2s ease",
      }}
      className="project-row-item"
    >
      {/* 1. PROJECT: アイコンとタイトル */}
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
        <ThemeIcon
          variant="light"
          color={proj.visibility === "private" ? "gray" : "blue"}
          size={38}
          radius="md"
        >
          <ProjectIcon size={20} />
        </ThemeIcon>
        <Stack gap={0} style={{ minWidth: 0 }}>
          <Group gap={4} wrap="nowrap">
            {proj.visibility === "private" && (
              <IconLock size={12} color="gray" />
            )}
            <Text fw={600} size="sm" truncate>
              {proj.title}
            </Text>
          </Group>
        </Stack>
      </Group>

      {/* 2. STATUS: バッジ */}
      <Badge variant="dot" color={theme.color} size="sm">
        {theme.label}
      </Badge>

      {/* 3. PROGRESS: 進捗バー */}
      <Stack gap={4}>
        <Text size="xs" fw={700} ta="right">
          {proj.progress}%
        </Text>
        <Progress value={proj.progress} size="xs" color={theme.color} />
      </Stack>

      {/* 4. TAGS: 技術スタック */}
      <Group gap={4} wrap="wrap" style={{ minWidth: 0 }}>
        {proj.tags?.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            color="gray"
            size="xs"
            leftSection={<IconHash size={10} />}
            style={{ textTransform: "none" }} // 大文字強制を解除（Next.jsなどの表記を維持）
          >
            {tag}
          </Badge>
        ))}
      </Group>
      {/* 5. TEAM: メンバーアバター（リアルタイム反映対応） */}
      <Avatar.Group spacing="xs">
        {members
          .filter((m) => m.status === "approved")
          .slice(0, 3)
          .map((m) => (
            <Tooltip key={m.user_id} label={m.username} withArrow>
              <Avatar
                src={m.avatar_url}
                // URL（ファイル名）が変更された際にコンポーネントを強制再描画させる
                key={m.avatar_url}
                size={26}
                radius="xl"
                name={m.username ?? undefined}
              />
            </Tooltip>
          ))}
      </Avatar.Group>

      {/* 6. ACTIONS */}
      <Group justify="flex-end">
        {currentUser && !isOwner && (
          <Box onClick={(e) => e.stopPropagation()}>
            {isApproved ? (
              <Button
                variant="light"
                color="red"
                size="xs"
                radius="md"
                leftSection={<IconUserMinus size={14} />}
                onClick={(e) => handleAction(e, "leave")}
                styles={{ root: { width: rem(85) } }}
              >
                退出
              </Button>
            ) : isPending ? (
              <Button
                variant="light"
                color="gray"
                size="xs"
                radius="md"
                leftSection={<IconUserCheck size={14} />}
                onClick={(e) => handleAction(e, "cancel")}
                styles={{ root: { width: rem(85) } }}
              >
                申請中
              </Button>
            ) : (
              <Button
                variant="light"
                color="blue"
                size="xs"
                radius="md"
                leftSection={<IconUserPlus size={14} />}
                onClick={(e) => handleAction(e, "join")}
                styles={{ root: { width: rem(85) } }}
              >
                参加
              </Button>
            )}
          </Box>
        )}
        {isOwner && onEdit && (
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(proj);
            }}
          >
            <IconPencil size={16} />
          </ActionIcon>
        )}
      </Group>

      <style>{`
        .project-row-item:hover { background-color: #fcfcfd; }
      `}</style>
    </Box>
  );
};
