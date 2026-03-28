"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

type NavSection = "overview" | "status" | "team" | "requests" | "danger";
import {
  Container,
  Group,
  Box,
  Text,
  Stack,
  Paper,
  Button,
  Tooltip,
  TextInput,
  Textarea,
  Select,
  MultiSelect,
  NumberInput,
  Avatar,
  Anchor,
  Divider,
  rem,
  Loader,
  Center,
  ActionIcon,
  ScrollArea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconArrowLeft,
  IconCrown,
  IconCheck,
  IconX,
  IconTrash,
  IconLink,
  IconRocket,
  IconCode,
  IconDeviceLaptop,
  IconPalette,
  IconCpu,
  IconDatabase,
  IconBrandRust,
  IconMessage,
  IconSettings,
  IconUsers,
  IconActivity,
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase";
import { Project } from "@/app/types/project";
import { useAuth } from "@/app/hooks/useAuth";
import { DashboardHeader } from "@/app/components/DashboardHeader";
import { modals } from "@mantine/modals";

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
const POSITION_OPTIONS = [
  { value: "Frontend", label: "Frontend" },
  { value: "Backend", label: "Backend" },
  { value: "Design", label: "Design" },
  { value: "Infra", label: "Infra" },
  { value: "App", label: "Mobile App" },
  { value: "Collaborator", label: "Collaborator" },
];

const fieldStyles = {
  input: {
    backgroundColor: "var(--mantine-color-white)",
    border: "1px solid var(--mantine-color-gray-3)",
    borderRadius: rem(6),
    fontSize: rem(13),
  },
  label: {
    fontSize: rem(12),
    fontWeight: 600,
    color: "var(--mantine-color-dark-8)",
    marginBottom: rem(4),
  },
} as const;

// ─── Section コンポーネント ──────────────────────────────────────────────
interface SectionProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  danger?: boolean;
}

const Section = ({ title, children, footer, danger = false }: SectionProps) => (
  <Paper
    radius="md"
    style={{
      border: danger
        ? "0.5px solid var(--mantine-color-red-3)"
        : "0.5px solid var(--mantine-color-gray-2)",
      background: "var(--mantine-color-white)",
      overflow: "hidden",
    }}
  >
    <Box
      px={20}
      py={12}
      style={{
        background: danger
          ? "var(--mantine-color-red-0)"
          : "var(--mantine-color-gray-0)",
        borderBottom: `0.5px solid ${danger ? "var(--mantine-color-red-2)" : "var(--mantine-color-gray-2)"}`,
      }}
    >
      <Text
        size="xs"
        fw={700}
        tt="uppercase"
        c={danger ? "red.7" : "gray.7"}
        style={{ letterSpacing: "0.06em" }}
      >
        {title}
      </Text>
    </Box>
    <Box p={20}>{children}</Box>
    {footer && (
      <Box
        px={20}
        py={12}
        style={{
          borderTop: "0.5px solid var(--mantine-color-gray-2)",
          background: "var(--mantine-color-gray-0)",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        {footer}
      </Box>
    )}
  </Paper>
);

// ─── モバイル用タブナビ ──────────────────────────────────────────────
const NAV_ITEMS: {
  id: NavSection;
  icon: React.FC<{ size?: number }>;
  label: string;
  danger?: boolean;
}[] = [
  { id: "overview", icon: IconSettings, label: "Overview" },
  { id: "status", icon: IconActivity, label: "Status" },
  { id: "team", icon: IconUsers, label: "Team" },
  { id: "requests", icon: IconCheck, label: "Requests" },
  { id: "danger", icon: IconTrash, label: "Danger", danger: true },
];

// ─── デスクトップ用サイドナビアイテム ──────────────────────────────────────────────
interface NavItemProps {
  id: NavSection;
  icon: React.FC<{ size?: number; stroke?: number }>;
  label: string;
  danger?: boolean;
  activeNav: NavSection;
  onSetActiveNav: (nav: NavSection) => void;
}

const NavItem = ({
  id,
  icon: Icon,
  label,
  danger = false,
  activeNav,
  onSetActiveNav,
}: NavItemProps) => (
  <Box
    px={12}
    py={8}
    style={{
      borderRadius: rem(6),
      cursor: "pointer",
      fontSize: rem(13),
      background:
        activeNav === id
          ? danger
            ? "var(--mantine-color-red-0)"
            : "var(--mantine-color-gray-1)"
          : "transparent",
      color: danger
        ? "var(--mantine-color-red-7)"
        : activeNav === id
          ? "var(--mantine-color-dark-9)"
          : "var(--mantine-color-gray-7)",
      fontWeight: activeNav === id ? 600 : 400,
      transition: "background 0.1s",
    }}
    onClick={() => onSetActiveNav(id)}
  >
    <Group gap={10}>
      <Icon size={15} stroke={activeNav === id ? 2 : 1.5} />
      {label}
    </Group>
  </Box>
);

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [activeNav, setActiveNav] = useState<NavSection>("overview");
  const [tagOptions, setTagOptions] = useState<string[]>(DEFAULT_TAGS);

  const [isPendingUpdate, startTransition] = useTransition();
  const initializedRef = useRef(false);

  const overviewForm = useForm({
    initialValues: { title: "", description: "", icon: "IconRocket", url: "" },
    validate: {
      title: (v) => (v.trim().length < 2 ? "2文字以上入力してください" : null),
      url: (v) =>
        v && !v.startsWith("http") ? "有効なURLを入力してください" : null,
    },
  });

  const statusForm = useForm({
    initialValues: { status: "Planning", progress: 0, tags: [] as string[] },
  });

  const fetchProject = useCallback(
    async (isSilent = false) => {
      if (!params.id) return;
      if (!isSilent && !project) setLoading(true);

      const { data: basicData } = await supabase
        .from("project_with_members")
        .select("*")
        .eq("id", params.id)
        .single();
      if (!basicData) {
        router.push("/");
        return;
      }

      const { data: detailData } = await supabase
        .from("project_details")
        .select("*")
        .eq("id", params.id)
        .single();

      startTransition(() => {
        const combined = { ...basicData, ...(detailData ?? {}) } as Project;
        setProject(combined);
        overviewForm.setValues({
          title: combined.title,
          description: combined.description ?? "",
          icon: combined.icon,
          url: combined.url ?? "",
        });
        statusForm.setValues({
          status: combined.status,
          progress: combined.progress ?? 0,
          tags: combined.tags ?? [],
        });
        setTagOptions((prev) =>
          Array.from(new Set([...prev, ...(combined.tags ?? [])])),
        );
        setLoading(false);
      });
    },
    [params.id, router, project, overviewForm, statusForm],
  );

  useEffect(() => {
    if (!params.id) return;
    const channel = supabase
      .channel(`project-settings-live-${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: `id=eq.${params.id}`,
        },
        () => fetchProject(true),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_members",
          filter: `project_id=eq.${params.id}`,
        },
        () => fetchProject(true),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_details",
          filter: `id=eq.${params.id}`,
        },
        () => fetchProject(true),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProject, params.id]);

  useEffect(() => {
    if (initializedRef.current || !params.id) return;
    initializedRef.current = true;
    (async () => {
      await fetchProject();
    })();
  }, [fetchProject, params.id]);

  const handleSaveOverview = async (values: typeof overviewForm.values) => {
    if (!project) return;
    setSaving(true);
    await Promise.all([
      supabase
        .from("projects")
        .update({ title: values.title, icon: values.icon })
        .eq("id", project.id),
      supabase
        .from("project_details")
        .update({ description: values.description, url: values.url || null })
        .eq("id", project.id),
    ]);
    await fetchProject(true);
    setSaving(false);
  };

  const handleSaveStatus = async (values: typeof statusForm.values) => {
    if (!project) return;
    setSavingStatus(true);
    await supabase
      .from("projects")
      .update({
        status: values.status,
        tags: values.tags,
        progress: values.progress,
      })
      .eq("id", project.id);
    await fetchProject(true);
    setSavingStatus(false);
  };

  const handleVisibilityChange = async () => {
    if (!project) return;
    const newVisibility =
      project.visibility === "public" ? "private" : "public";
    modals.openConfirmModal({
      title: `公開設定を ${newVisibility.toUpperCase()} に変更`,
      children: (
        <Text size="sm">
          {newVisibility === "private"
            ? "非公開にすると、メンバー以外はこのプロジェクトの詳細を閲覧できなくなります。"
            : "公開にすると、サークル内の誰でもこのプロジェクトの詳細を閲覧できるようになります。"}
        </Text>
      ),
      labels: { confirm: "変更する", cancel: "キャンセル" },
      onConfirm: async () => {
        await supabase
          .from("projects")
          .update({ visibility: newVisibility })
          .eq("id", project.id);
        fetchProject(true);
      },
    });
  };

  const handleUpdatePosition = async (membershipId: string, pos: string) => {
    await supabase
      .from("project_members")
      .update({ position: pos })
      .eq("id", membershipId);
    fetchProject(true);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("project_members")
      .update({ status: "approved" })
      .eq("id", id);
    if (!error) fetchProject(true);
  };

  const handleReject = async (id: string) => {
    await supabase.from("project_members").delete().eq("id", id);
    fetchProject(true);
  };

  const handleDelete = async () => {
    if (!project) return;
    modals.openConfirmModal({
      title: "プロジェクトを完全に削除",
      children: (
        <Text size="sm">
          この操作は取り消せません。リポジトリのメタデータ、メンバーシップ、詳細情報がすべて削除されます。
        </Text>
      ),
      labels: { confirm: "削除する", cancel: "キャンセル" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        await supabase
          .from("project_members")
          .delete()
          .eq("project_id", project.id);
        await supabase.from("projects").delete().eq("id", project.id);
        router.push("/");
      },
    });
  };

  if (authLoading || (loading && !project))
    return (
      <Center mih="100vh">
        <Loader color="dark" size="sm" />
      </Center>
    );
  if (!project || project.owner_id !== user?.id) return null;

  const approvedMembers =
    project.member_details?.filter((m) => m.status === "approved") ?? [];
  const pendingMembers =
    project.member_details?.filter((m) => m.status === "pending") ?? [];
  const SelectedIcon = ICON_MAP[overviewForm.values.icon] ?? IconRocket;

  const navItemsWithCount = NAV_ITEMS.map((item) =>
    item.id === "requests" && pendingMembers.length > 0
      ? { ...item, label: `Requests (${pendingMembers.length})` }
      : item,
  );

  return (
    <Box
      bg="#F8FAFB"
      mih="100vh"
      style={{ opacity: isPendingUpdate ? 0.9 : 1, transition: "opacity 0.2s" }}
    >
      <DashboardHeader user={user} />

      <Container size="lg" pt={rem(24)} pb={80} px={{ base: 16, sm: 24 }}>
        {/* パンくず */}
        <Group gap={4} mb={8} wrap="nowrap" style={{ overflow: "hidden" }}>
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
              flexShrink: 0,
            }}
          >
            <IconArrowLeft size={13} />
            <Text size="xs" c="dimmed" visibleFrom="xs">
              Dashboard
            </Text>
          </Anchor>
          <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
            /
          </Text>
          <Text size="xs" c="dimmed" truncate style={{ maxWidth: rem(120) }}>
            {project.title}
          </Text>
          <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
            /
          </Text>
          <Text size="xs" fw={500} style={{ flexShrink: 0 }}>
            Settings
          </Text>
        </Group>

        <Text fw={600} style={{ fontSize: rem(18) }} mb="md">
          Project Settings
        </Text>
        <Divider mb="xl" color="gray.2" />

        {/* ─── モバイル：横スクロールタブ ─── */}
        <Box hiddenFrom="sm" mb="md">
          <ScrollArea scrollbarSize={0}>
            <Group gap={4} wrap="nowrap" pb={4}>
              {navItemsWithCount.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <Box
                    key={item.id}
                    px={12}
                    py={7}
                    onClick={() => setActiveNav(item.id)}
                    style={{
                      borderRadius: rem(20),
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      fontSize: rem(12),
                      fontWeight: isActive ? 600 : 400,
                      background: isActive
                        ? item.danger
                          ? "var(--mantine-color-red-1)"
                          : "var(--mantine-color-dark-9)"
                        : "var(--mantine-color-gray-1)",
                      color: isActive
                        ? item.danger
                          ? "var(--mantine-color-red-7)"
                          : "white"
                        : item.danger
                          ? "var(--mantine-color-red-6)"
                          : "var(--mantine-color-gray-7)",
                      transition: "all 0.15s",
                      border:
                        isActive && !item.danger
                          ? "none"
                          : item.danger
                            ? "1px solid var(--mantine-color-red-3)"
                            : "1px solid transparent",
                    }}
                  >
                    <Group gap={6} wrap="nowrap">
                      <Icon size={13} />
                      {item.label}
                    </Group>
                  </Box>
                );
              })}
            </Group>
          </ScrollArea>
        </Box>

        {/* ─── デスクトップ：サイドナビ + コンテンツ ─── */}
        <Group align="flex-start" gap={32} wrap="nowrap" visibleFrom="sm">
          {/* サイドナビ */}
          <Stack gap={2} style={{ width: rem(200), flexShrink: 0 }}>
            <Text
              size="xs"
              fw={600}
              c="dimmed"
              tt="uppercase"
              px={12}
              py={6}
              style={{ letterSpacing: "0.06em" }}
            >
              General
            </Text>
            <NavItem
              id="overview"
              icon={IconSettings}
              label="Overview"
              activeNav={activeNav}
              onSetActiveNav={setActiveNav}
            />
            <NavItem
              id="status"
              icon={IconActivity}
              label="Status & Tags"
              activeNav={activeNav}
              onSetActiveNav={setActiveNav}
            />
            <Text
              size="xs"
              fw={600}
              c="dimmed"
              tt="uppercase"
              px={12}
              pt={10}
              pb={6}
              style={{ letterSpacing: "0.06em" }}
            >
              Members
            </Text>
            <NavItem
              id="team"
              icon={IconUsers}
              label="Team"
              activeNav={activeNav}
              onSetActiveNav={setActiveNav}
            />
            <NavItem
              id="requests"
              icon={IconCheck}
              label={`Requests${pendingMembers.length > 0 ? ` (${pendingMembers.length})` : ""}`}
              activeNav={activeNav}
              onSetActiveNav={setActiveNav}
            />
            <Text
              size="xs"
              fw={600}
              c="dimmed"
              tt="uppercase"
              px={12}
              pt={10}
              pb={6}
              style={{ letterSpacing: "0.06em" }}
            >
              Danger Zone
            </Text>
            <NavItem
              id="danger"
              icon={IconTrash}
              label="Danger Zone"
              danger
              activeNav={activeNav}
              onSetActiveNav={setActiveNav}
            />
          </Stack>

          {/* デスクトップ コンテンツ */}
          <Box style={{ flex: 1, minWidth: 0 }}>
            <SettingsContent
              activeNav={activeNav}
              project={project}
              overviewForm={overviewForm}
              statusForm={statusForm}
              tagOptions={tagOptions}
              saving={saving}
              savingStatus={savingStatus}
              approvedMembers={approvedMembers}
              pendingMembers={pendingMembers}
              SelectedIcon={SelectedIcon}
              handleSaveOverview={handleSaveOverview}
              handleSaveStatus={handleSaveStatus}
              handleVisibilityChange={handleVisibilityChange}
              handleUpdatePosition={handleUpdatePosition}
              handleApprove={handleApprove}
              handleReject={handleReject}
              handleDelete={handleDelete}
            />
          </Box>
        </Group>

        {/* ─── モバイル：コンテンツ ─── */}
        <Box hiddenFrom="sm">
          <SettingsContent
            activeNav={activeNav}
            project={project}
            overviewForm={overviewForm}
            statusForm={statusForm}
            tagOptions={tagOptions}
            saving={saving}
            savingStatus={savingStatus}
            approvedMembers={approvedMembers}
            pendingMembers={pendingMembers}
            SelectedIcon={SelectedIcon}
            handleSaveOverview={handleSaveOverview}
            handleSaveStatus={handleSaveStatus}
            handleVisibilityChange={handleVisibilityChange}
            handleUpdatePosition={handleUpdatePosition}
            handleApprove={handleApprove}
            handleReject={handleReject}
            handleDelete={handleDelete}
          />
        </Box>
      </Container>
    </Box>
  );
}

// ─── コンテンツ部分を共通コンポーネントに抽出 ──────────────────────────────
interface SettingsContentProps {
  activeNav: NavSection;
  project: Project;
  overviewForm: ReturnType<
    typeof useForm<{
      title: string;
      description: string;
      icon: string;
      url: string;
    }>
  >;
  statusForm: ReturnType<
    typeof useForm<{ status: string; progress: number; tags: string[] }>
  >;
  tagOptions: string[];
  saving: boolean;
  savingStatus: boolean;
  approvedMembers: NonNullable<Project["member_details"]>;
  pendingMembers: NonNullable<Project["member_details"]>;
  SelectedIcon: React.FC<{ size?: number; stroke?: number }>;
  handleSaveOverview: (values: { title: string; description: string; icon: string; url: string }) => void;
  handleSaveStatus: (values: { status: string; progress: number; tags: string[] }) => void;
  handleVisibilityChange: () => void;
  handleUpdatePosition: (id: string, pos: string) => void;
  handleApprove: (id: string) => void;
  handleReject: (id: string) => void;
  handleDelete: () => void;
}

function SettingsContent({
  activeNav,
  project,
  overviewForm,
  statusForm,
  tagOptions,
  saving,
  savingStatus,
  approvedMembers,
  pendingMembers,
  SelectedIcon,
  handleSaveOverview,
  handleSaveStatus,
  handleVisibilityChange,
  handleUpdatePosition,
  handleApprove,
  handleReject,
  handleDelete,
}: SettingsContentProps) {
  return (
    <>
      {activeNav === "overview" && (
        <form
          id="overview-form"
          onSubmit={overviewForm.onSubmit(handleSaveOverview)}
        >
          <Section
            title="General"
            footer={
              <Button
                type="submit"
                form="overview-form"
                size="xs"
                radius="md"
                loading={saving}
                style={{ background: "#1f883d", fontWeight: 500 }}
              >
                Save changes
              </Button>
            }
          >
            <Stack gap={16}>
              {/* モバイルでは縦積み、デスクトップでは横並び */}
              <Box
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: rem(12),
                }}
                className="overview-grid"
              >
                <TextInput
                  label="Project Name"
                  required
                  styles={fieldStyles}
                  {...overviewForm.getInputProps("title")}
                />
                <Select
                  label="Icon"
                  data={ICON_OPTIONS}
                  allowDeselect={false}
                  styles={fieldStyles}
                  leftSection={<SelectedIcon size={14} />}
                  renderOption={({ option }) => {
                    const Icon = ICON_MAP[option.value];
                    return (
                      <Group gap={8}>
                        {Icon && <Icon size={14} />}
                        <Text size="sm">{option.label}</Text>
                      </Group>
                    );
                  }}
                  {...overviewForm.getInputProps("icon")}
                />
              </Box>
              <Textarea
                label="Description"
                placeholder="Project goals..."
                minRows={4}
                autosize
                maxRows={8}
                styles={fieldStyles}
                {...overviewForm.getInputProps("description")}
              />
              <TextInput
                label="Website"
                leftSection={
                  <IconLink size={14} color="var(--mantine-color-gray-5)" />
                }
                styles={fieldStyles}
                {...overviewForm.getInputProps("url")}
              />
            </Stack>
          </Section>
        </form>
      )}

      {activeNav === "status" && (
        <form id="status-form" onSubmit={statusForm.onSubmit(handleSaveStatus)}>
          <Section
            title="Status & Progress"
            footer={
              <Button
                type="submit"
                form="status-form"
                size="xs"
                radius="md"
                loading={savingStatus}
                style={{ background: "#1f883d", fontWeight: 500 }}
              >
                Save changes
              </Button>
            }
          >
            <Stack gap={16}>
              <Box
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: rem(12),
                }}
              >
                <Select
                  label="Status"
                  data={STATUS_OPTIONS}
                  allowDeselect={false}
                  styles={fieldStyles}
                  {...statusForm.getInputProps("status")}
                />
                <NumberInput
                  label="Progress"
                  suffix="%"
                  min={0}
                  max={100}
                  step={5}
                  styles={fieldStyles}
                  {...statusForm.getInputProps("progress")}
                />
              </Box>
              <MultiSelect
                label="Technology Tags"
                data={tagOptions}
                searchable
                clearable
                hidePickedOptions
                styles={fieldStyles}
                {...statusForm.getInputProps("tags")}
              />
            </Stack>
          </Section>
        </form>
      )}

      {activeNav === "team" && (
        <Section title="Team Members">
          <Stack gap={0}>
            {approvedMembers.map((m, i) => (
              <Group
                key={m.user_id}
                justify="space-between"
                py={12}
                wrap="nowrap"
                style={{
                  borderBottom:
                    i < approvedMembers.length - 1
                      ? "1px solid var(--mantine-color-gray-1)"
                      : "none",
                }}
              >
                <Group gap={10} style={{ flex: 1, minWidth: 0 }}>
                  <Avatar
                    src={m.avatar_url}
                    size={32}
                    radius="xl"
                    name={m.username ?? undefined}
                    style={{ flexShrink: 0 }}
                  />
                  <Box style={{ minWidth: 0 }}>
                    <Text size="sm" fw={600} truncate>
                      {m.username}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {m.role === "owner" ? "Owner" : "Member"}
                    </Text>
                  </Box>
                </Group>
                <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                  <Select
                    size="xs"
                    data={POSITION_OPTIONS}
                    value={m.position ?? null}
                    placeholder="Position"
                    onChange={(v) => v && handleUpdatePosition(m.id, v)}
                    radius="xl"
                    styles={{
                      input: {
                        width: rem(110),
                        fontSize: rem(11),
                        fontWeight: 600,
                        backgroundColor: "var(--mantine-color-gray-1)",
                        border: "none",
                        height: rem(26),
                        minHeight: rem(26),
                      },
                    }}
                  />
                  <Box
                    style={{
                      width: rem(28),
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {m.user_id === project.owner_id ? (
                      <Tooltip label="Owner" withArrow>
                        <IconCrown
                          size={16}
                          color="var(--mantine-color-orange-5)"
                        />
                      </Tooltip>
                    ) : (
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => handleReject(m.id)}
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    )}
                  </Box>
                </Group>
              </Group>
            ))}
          </Stack>
        </Section>
      )}

      {activeNav === "requests" && (
        <Section title={`Pending Requests (${pendingMembers.length})`}>
          {pendingMembers.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              No pending requests
            </Text>
          ) : (
            <Stack gap={0}>
              {pendingMembers.map((m, i) => (
                <Group
                  key={m.user_id}
                  justify="space-between"
                  py={12}
                  wrap="nowrap"
                  style={{
                    borderBottom:
                      i < pendingMembers.length - 1
                        ? "1px solid var(--mantine-color-gray-1)"
                        : "none",
                  }}
                >
                  <Group gap={10} style={{ flex: 1, minWidth: 0 }}>
                    <Avatar
                      src={m.avatar_url}
                      size={30}
                      radius="xl"
                      name={m.username ?? undefined}
                      style={{ flexShrink: 0 }}
                    />
                    <Text size="sm" fw={600} truncate>
                      {m.username}
                    </Text>
                  </Group>
                  <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                    <Button
                      variant="light"
                      color="blue"
                      size="xs"
                      radius="md"
                      leftSection={<IconCheck size={13} />}
                      onClick={() => handleApprove(m.id)}
                      styles={{ root: { fontWeight: 500 } }}
                    >
                      Approve
                    </Button>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      radius="md"
                      onClick={() => handleReject(m.id)}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  </Group>
                </Group>
              ))}
            </Stack>
          )}
        </Section>
      )}

      {activeNav === "danger" && (
        <Stack gap="xl">
          <Section title="Change Project Visibility">
            <Stack gap={12}>
              <Box>
                <Text size="sm" fw={600}>
                  This project is currently {project.visibility}.
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  公開範囲を変更すると、リサーチやコラボレーターへの影響が出る場合があります。
                </Text>
              </Box>
              <Box>
                <Button
                  variant="outline"
                  color="dark"
                  size="xs"
                  onClick={handleVisibilityChange}
                  fullWidth={false}
                >
                  Change to{" "}
                  {project.visibility === "public" ? "Private" : "Public"}
                </Button>
              </Box>
            </Stack>
          </Section>

          <Section title="Delete Project" danger>
            <Stack gap={12}>
              <Box>
                <Text size="sm" fw={600} mb={4}>
                  Delete this project
                </Text>
                <Text size="xs" c="dimmed">
                  プロジェクトを削除すると元に戻せません。慎重に実行してください。
                </Text>
              </Box>
              <Box>
                <Button
                  variant="outline"
                  color="red"
                  size="sm"
                  radius="md"
                  leftSection={<IconTrash size={14} />}
                  onClick={handleDelete}
                  styles={{ root: { fontWeight: 500 } }}
                >
                  Delete Project
                </Button>
              </Box>
            </Stack>
          </Section>
        </Stack>
      )}

      <style>{`
        @media (min-width: 640px) {
          .overview-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
