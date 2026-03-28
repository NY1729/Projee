"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  TextInput,
  Textarea,
  Button,
  Stack,
  Text,
  Box,
  Divider,
  Group,
  Select,
  NumberInput,
  MultiSelect,
  rem,
  Anchor,
  ThemeIcon,
  Paper,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconLink,
  IconArrowLeft,
  IconRocket,
  IconCode,
  IconDeviceLaptop,
  IconPalette,
  IconCpu,
  IconDatabase,
  IconBrandRust,
  IconMessage,
  IconLock,
  IconWorld,
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/hooks/useAuth";
import { DashboardHeader } from "@/app/components/DashboardHeader";

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
];

const VISIBILITY_OPTIONS = [
  {
    value: "public",
    label: "Public",
    description: "サークル内の誰でも詳細を閲覧・参加申請できます",
    icon: IconWorld,
  },
  {
    value: "private",
    label: "Private",
    description: "メンバー以外にはプロジェクトの詳細が隠されます",
    icon: IconLock,
  },
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

const fieldStyles = {
  input: {
    backgroundColor: "var(--mantine-color-white)",
    border: "0.5px solid var(--mantine-color-gray-3)",
    borderRadius: rem(6),
    fontSize: rem(13),
  },
  label: {
    fontSize: rem(13),
    fontWeight: 600,
    color: "var(--mantine-color-dark-8)",
    marginBottom: rem(4),
  },
  description: { fontSize: rem(11), marginBottom: rem(6) },
} as const;

export default function NewProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      title: "",
      description: "",
      icon: "IconRocket",
      status: "Planning",
      progress: 0,
      tags: [] as string[],
      url: "",
      visibility: "public", // ★デフォルトはPublic
    },
    validate: {
      title: (v) => (v.trim().length < 2 ? "2文字以上入力してください" : null),
      url: (v) =>
        v && !v.startsWith("http") ? "有効なURLを入力してください" : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. projects テーブルに基本情報と公開設定を保存
      const { data: newProj, error: projError } = await supabase
        .from("projects")
        .insert({
          title: values.title,
          icon: values.icon,
          status: values.status,
          tags: values.tags,
          owner_id: user.id,
          progress: values.progress,
          visibility: values.visibility, // ★追加
        })
        .select()
        .single();

      if (projError || !newProj) {
        console.error(projError);
        return;
      }

      // 2. project_details に詳細情報を保存
      await supabase.from("project_details").insert({
        id: newProj.id,
        description: values.description,
        url: values.url || null,
      });

      // 3. オーナーとして project_members に登録
      await supabase.from("project_members").insert({
        project_id: newProj.id,
        user_id: user.id,
        role: "owner",
        status: "approved",
      });

      router.push(`/projects/${newProj.id}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  const SelectedIcon = ICON_MAP[form.values.icon] ?? IconRocket;

  return (
    <Box bg="#F8FAFB" mih="100vh">
      <DashboardHeader user={user} />
      <Container size="sm" py={rem(48)}>
        <Stack gap="xl">
          <Group gap={6}>
            <Anchor
              size="xs"
              c="dimmed"
              underline="never"
              onClick={() => router.push("/")}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <IconArrowLeft size={12} /> Dashboard
            </Anchor>
            <Text size="xs" c="dimmed">
              /
            </Text>
            <Text size="xs" fw={500}>
              New Project
            </Text>
          </Group>

          <Box>
            <Text
              fw={700}
              style={{ fontSize: rem(24), letterSpacing: "-0.02em" }}
            >
              Create a new project
            </Text>
            <Text c="dimmed" size="sm" mt={4}>
              プロジェクトの基本情報と公開範囲を設定します。概要は後からいつでも変更可能です。
            </Text>
          </Box>

          <Paper radius="md" p={rem(32)} withBorder shadow="none">
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap={24}>
                <Group grow align="flex-start">
                  <TextInput
                    label="Project name"
                    placeholder="my-awesome-app"
                    required
                    styles={fieldStyles}
                    {...form.getInputProps("title")}
                  />
                  <Select
                    label="Icon"
                    data={ICON_OPTIONS}
                    allowDeselect={false}
                    styles={fieldStyles}
                    leftSection={<SelectedIcon size={14} />}
                    {...form.getInputProps("icon")}
                  />
                </Group>

                <Textarea
                  label="Description (Markdown supported)"
                  description="プロジェクトの目的や技術構成を簡単に記述します"
                  placeholder="# Overview..."
                  minRows={4}
                  autosize
                  maxRows={10}
                  styles={fieldStyles}
                  {...form.getInputProps("description")}
                />

                <Divider color="gray.1" />

                <Box>
                  <Text size="sm" fw={600} mb={12}>
                    Visibility
                  </Text>
                  <Stack gap={10}>
                    {VISIBILITY_OPTIONS.map((item) => (
                      <Box
                        key={item.value}
                        onClick={() =>
                          form.setFieldValue("visibility", item.value)
                        }
                        p="md"
                        style={{
                          cursor: "pointer",
                          borderRadius: rem(8),
                          border: `1px solid ${form.values.visibility === item.value ? "var(--mantine-color-blue-4)" : "var(--mantine-color-gray-2)"}`,
                          background:
                            form.values.visibility === item.value
                              ? "var(--mantine-color-blue-0)"
                              : "white",
                          transition: "all 0.1s ease",
                        }}
                      >
                        <Group wrap="nowrap" align="flex-start">
                          <ThemeIcon
                            variant="transparent"
                            color={
                              form.values.visibility === item.value
                                ? "blue"
                                : "gray"
                            }
                            mt={2}
                          >
                            <item.icon size={18} />
                          </ThemeIcon>
                          <Box>
                            <Text
                              size="sm"
                              fw={600}
                              c={
                                form.values.visibility === item.value
                                  ? "blue.9"
                                  : "dark.7"
                              }
                            >
                              {item.label}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {item.description}
                            </Text>
                          </Box>
                        </Group>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Divider color="gray.1" />

                <Group grow>
                  <Select
                    label="Status"
                    data={STATUS_OPTIONS}
                    styles={fieldStyles}
                    {...form.getInputProps("status")}
                  />
                  <NumberInput
                    label="Initial Progress"
                    suffix="%"
                    min={0}
                    max={100}
                    step={5}
                    styles={fieldStyles}
                    {...form.getInputProps("progress")}
                  />
                </Group>

                <TextInput
                  label="Website / Repository"
                  placeholder="https://github.com/..."
                  leftSection={
                    <IconLink size={14} color="var(--mantine-color-gray-5)" />
                  }
                  styles={fieldStyles}
                  {...form.getInputProps("url")}
                />

                <MultiSelect
                  label="Technology Tags"
                  placeholder="Select technologies"
                  data={DEFAULT_TAGS}
                  searchable
                  clearable
                  hidePickedOptions
                  styles={fieldStyles}
                  {...form.getInputProps("tags")}
                />

                <Box pt="md">
                  <Button
                    type="submit"
                    fullWidth
                    radius="md"
                    size="md"
                    loading={loading}
                    style={{ background: "#1f883d", fontWeight: 600 }}
                  >
                    Create Project
                  </Button>
                </Box>
              </Stack>
            </form>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
