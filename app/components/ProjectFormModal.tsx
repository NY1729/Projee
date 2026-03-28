"use client";

import {
  Modal,
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  Button,
  Stack,
  Group,
  NumberInput,
  Text,
  rem,
  Box,
  ThemeIcon,
  Divider,
  ActionIcon,
  Badge,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";
import {
  IconRocket,
  IconCode,
  IconDeviceLaptop,
  IconPalette,
  IconCpu,
  IconDatabase,
  IconBrandRust,
  IconMessage,
  IconX,
  IconLink,
} from "@tabler/icons-react";
import { Project } from "../types/project";

const ICON_MAP: Record<string, React.FC<{ size?: number; stroke?: number }>> = {
  IconRocket,
  IconCode,
  IconDeviceLaptop,
  IconPalette,
  IconCpu,
  IconDatabase,
  IconBrandRust,
  IconMessage,
};

const ICON_OPTIONS = [
  { value: "IconRocket", label: "Rocket" },
  { value: "IconCode", label: "Code" },
  { value: "IconDeviceLaptop", label: "Laptop" },
  { value: "IconPalette", label: "Design" },
  { value: "IconCpu", label: "Hardware" },
  { value: "IconDatabase", label: "Database" },
  { value: "IconBrandRust", label: "Rust" },
  { value: "IconMessage", label: "SNS" },
];

const STATUS_OPTIONS = [
  { value: "Planning", label: "準備中" },
  { value: "In Progress", label: "進行中" },
  { value: "Completed", label: "完了" },
  { value: "On Hold", label: "保留" },
];

const DEFAULT_TAGS = [
  "Next.js",
  "React",
  "Vue",
  "Python",
  "Go",
  "Rust",
  "Flutter",
  "Swift",
  "Design",
  "Hardware",
  "App",
];

// GitHub風のフィールドスタイル
const fieldStyles = {
  input: {
    backgroundColor: "var(--mantine-color-white)",
    border: "0.5px solid var(--mantine-color-gray-4)",
    borderRadius: rem(6),
    fontSize: rem(14),
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  label: {
    fontSize: rem(14),
    fontWeight: 600,
    color: "var(--mantine-color-dark-7)",
    marginBottom: rem(6),
  },
  description: {
    fontSize: rem(11),
    color: "var(--mantine-color-gray-6)",
    marginTop: rem(4),
  },
} as const;

interface ProjectFormModalProps {
  opened: boolean;
  close: () => void;
  project?: Project | null;
}

export const ProjectFormModal = ({
  opened,
  close,
  project,
}: ProjectFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [tagOptions, setTagOptions] = useState<string[]>(DEFAULT_TAGS);
  const isEdit = !!project;

  const form = useForm({
    initialValues: {
      title: "",
      description: "",
      icon: "IconRocket",
      status: "Planning",
      progress: 0,
      tags: [] as string[],
      url: "",
    },
    validate: {
      title: (v) =>
        v.trim().length < 2 ? "2文字以上で入力してください" : null,
      progress: (v) => (v < 0 || v > 100 ? "0〜100で入力してください" : null),
      url: (v) =>
        v && !v.startsWith("http")
          ? "http または https から始まるURLを入力してください"
          : null,
    },
  });

  // opened が false→true になった瞬間のみフォームを初期化
  const prevOpened = useRef(false);
  useEffect(() => {
    if (opened && !prevOpened.current) {
      if (project) {
        form.setValues({
          title: project.title,
          description: project.description ?? "",
          icon: project.icon,
          status: project.status,
          progress: project.progress,
          tags: project.tags ?? [],
          url: project.url ?? "",
        });
        setTagOptions((prev) =>
          Array.from(new Set([...prev, ...(project.tags ?? [])])),
        );
      } else {
        form.reset();
      }
    }
    prevOpened.current = opened;
  }, [opened]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    form.reset();
    close();
  };

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        title: values.title,
        description: values.description,
        icon: values.icon,
        status: values.status,
        progress: values.progress,
        tags: values.tags,
        url: values.url || null, // 空文字は null に変換
      };

      if (isEdit && project) {
        const { error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", project.id);
        if (!error) handleClose();
      } else {
        const { data: newProj, error } = await supabase
          .from("projects")
          .insert({ ...payload, owner_id: user.id })
          .select()
          .single();

        if (!error && newProj) {
          await supabase.from("project_members").insert({
            project_id: newProj.id,
            user_id: user.id,
            role: "owner",
            status: "approved",
          });
          handleClose();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const SelectedIcon = ICON_MAP[form.values.icon] ?? IconRocket;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      withCloseButton={false}
      centered
      radius="md" // GitHub風: md（6px相当）
      size={rem(1000)}
      padding={0}
      overlayProps={{ backgroundOpacity: 0.5 }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        {/* ── ヘッダー ── */}
        <Box
          px={20}
          py={14}
          style={{
            background: "var(--mantine-color-gray-0)",
            borderBottom: "0.5px solid var(--mantine-color-gray-3)",
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap={10}>
              <ThemeIcon size={40} radius="md" color="dark" variant="filled">
                <SelectedIcon size={20} />
              </ThemeIcon>
              <Group gap={8} align="center">
                <Text fw={600} size="md">
                  {isEdit ? "プロジェクトを編集" : "新規プロジェクト"}
                </Text>
                {isEdit && (
                  <Badge
                    size="xs"
                    variant="outline"
                    radius="xl"
                    styles={{
                      root: {
                        background: "#ddf4ff",
                        color: "#0969da",
                        borderColor: "#54aeff",
                        fontWeight: 500,
                      },
                    }}
                  >
                    編集
                  </Badge>
                )}
              </Group>
            </Group>
            <ActionIcon
              variant="subtle"
              color="gray"
              radius="sm"
              size="sm"
              onClick={handleClose}
            >
              <IconX size={16} />
            </ActionIcon>
          </Group>
        </Box>

        {/* ── フォーム本体 ── */}
        <Stack gap={16} px={24} py={20}>
          {/* タイトル + アイコン */}
          <Group grow align="flex-end">
            <TextInput
              label="プロジェクト名"
              placeholder="名称を入力してください"
              required
              styles={fieldStyles}
              {...form.getInputProps("title")}
            />
            <Select
              label="アイコン"
              data={ICON_OPTIONS}
              allowDeselect={false}
              styles={fieldStyles}
              renderOption={({ option }) => {
                const Icon = ICON_MAP[option.value];
                return (
                  <Group gap={8}>
                    {Icon && <Icon size={14} />}
                    <Text size="sm">{option.label}</Text>
                  </Group>
                );
              }}
              {...form.getInputProps("icon")}
            />
          </Group>

          {/* 概要 */}
          <Textarea
            label="概要"
            placeholder="プロジェクトの目的や概要を入力してください"
            description="Markdownは現在サポートしていません"
            autosize
            minRows={3}
            maxRows={4}
            styles={fieldStyles}
            {...form.getInputProps("description")}
          />

          {/* ステータス + 進捗 */}
          <Group grow align="flex-end">
            <Select
              label="ステータス"
              data={STATUS_OPTIONS}
              allowDeselect={false}
              styles={fieldStyles}
              {...form.getInputProps("status")}
            />
            <NumberInput
              label="進捗率"
              suffix="%"
              min={0}
              max={100}
              step={5}
              styles={fieldStyles}
              {...form.getInputProps("progress")}
            />
          </Group>

          {/* URL */}
          <TextInput
            label="関連URL"
            placeholder="https://github.com/..."
            description="GitHubリポジトリや関連ページのURL"
            leftSection={
              <IconLink size={14} color="var(--mantine-color-gray-5)" />
            }
            styles={fieldStyles}
            {...form.getInputProps("url")}
          />

          {/* タグ（v7では tagsInput は使わず MultiSelect のみ） */}
          <MultiSelect
            label="タグ / 技術スタック"
            placeholder="選択または検索"
            description="使用技術やジャンルを追加してください"
            data={tagOptions}
            searchable
            clearable
            hidePickedOptions
            styles={fieldStyles}
            {...form.getInputProps("tags")}
          />
        </Stack>

        <Divider color="gray.2" />

        {/* ── フッター ── */}
        <Group
          gap={8}
          px={20}
          py={12}
          style={{ background: "var(--mantine-color-gray-0)" }}
        >
          <Button
            variant="default"
            radius="md"
            onClick={handleClose}
            style={{ flex: 1 }}
            styles={{
              root: {
                border: "0.5px solid var(--mantine-color-gray-4)",
                fontWeight: 500,
                fontSize: rem(14),
                height: rem(40),
              },
            }}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            radius="md"
            loading={loading}
            style={{
              flex: 2,
              background: "#1f883d",
              fontWeight: 500,
              fontSize: rem(14),
              height: rem(40),
            }}
          >
            {isEdit ? "変更を保存" : "プロジェクトを作成"}
          </Button>
        </Group>
      </form>
    </Modal>
  );
};
