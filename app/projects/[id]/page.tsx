"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Group,
  Box,
  Text,
  Stack,
  Paper,
  Button,
  Badge,
  ThemeIcon,
  Progress,
  Avatar,
  Tooltip,
  Divider,
  Anchor,
  rem,
  Grid,
  Loader,
  Center,
  Title,
} from "@mantine/core";
import {
  IconHash,
  IconCrown,
  IconCalendar,
  IconArrowLeft,
  IconLink,
  IconUsers,
  IconActivity,
  IconSettings,
  IconLock,
  IconUserPlus,
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase";
import { Project } from "@/app/types/project";
import { useAuth } from "@/app/hooks/useAuth";
import { DashboardHeader } from "@/app/components/DashboardHeader";
import { ICON_MAP, STATUS_THEMES } from "@/app/constants/project";
import { MarkdownViewer } from "@/app/components/MarkdownViewer";

// ─── スタイル定数 ──────────────────────────────────────────────────
const card = {
  background: "var(--mantine-color-white)",
  border: "0.5px solid var(--mantine-color-gray-2)",
  borderRadius: rem(10),
  overflow: "hidden" as const,
};

const MODERN_CARD = {
  background: "var(--mantine-color-white)",
  border: "1px solid #d0d7de",
  borderRadius: rem(6), // GitHubはやや角が尖っている
  overflow: "hidden" as const,
};

const SECTION_TITLE = {
  fontSize: rem(14),
  fontWeight: 600 as const,
  color: "#1f2328",
  marginBottom: rem(8),
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [isPendingUpdate, startTransition] = useTransition();
  const initializedRef = useRef(false);

  const fetchProject = useCallback(
    async (isSilent = false) => {
      if (!params.id) return;
      if (!isSilent && !project) setLoading(true); // 初回のみローダー

      try {
        // 1. 基本情報の取得
        const { data: basicData } = await supabase
          .from("project_with_members")
          .select("*")
          .eq("id", params.id)
          .single();

        if (!basicData) {
          router.push("/");
          return;
        }

        // 2. 詳細情報の取得 (RLSガードにより承認者のみ取得可能)
        const { data: detailData } = await supabase
          .from("project_details")
          .select("*")
          .eq("id", params.id)
          .single();

        startTransition(() => {
          setProject({ ...basicData, ...(detailData ?? {}) } as Project);
        });
      } finally {
        if (!isSilent) setLoading(false);
      }
    },
    [params.id, router, project],
  );

  useEffect(() => {
    if (!params.id) return;

    const channel = supabase
      .channel(`project-live-${params.id}`)
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
    fetchProject();
  }, [params.id, fetchProject]);

  const handleJoinRequest = async () => {
    if (!user || !project) return;
    setRequestLoading(true);
    const { error } = await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: user.id,
      role: "member",
      status: "pending",
    });
    if (!error) fetchProject(true);
    setRequestLoading(false);
  };

  const handleCancelRequest = async () => {
    if (!user || !project) return;
    setRequestLoading(true);

    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", project.id)
      .eq("user_id", user.id)
      .eq("status", "pending"); // 安全のため pending のものだけ削除

    if (!error) {
      // 状態を最新にするために再取得
      await fetchProject(true);
    }
    setRequestLoading(false);
  };

  if (authLoading || (loading && !project)) {
    return (
      <Center mih="100vh">
        <Loader color="dark" size="sm" />
      </Center>
    );
  }
  if (!project) return null;

  const isOwner = project.owner_id === user?.id;
  const members = project.member_details ?? [];
  const currentUserMembership = members.find((m) => m.user_id === user?.id);
  const isApprovedMember =
    currentUserMembership?.status === "approved" || isOwner;
  const isApproved = isApprovedMember || project.visibility === "public";
  const isPendingMember = currentUserMembership?.status === "pending";
  const ProjectIcon = ICON_MAP[project.icon] ?? ICON_MAP["IconRocket"];
  const theme = STATUS_THEMES[project.status] ?? STATUS_THEMES["On Hold"];
  const approvedMembers = members.filter((m) => m.status === "approved");
  const pendingRequests = members.filter((m) => m.status === "pending");
  const ownerUsername =
    approvedMembers.find((m) => m.user_id === project.owner_id)?.username ??
    "Unknown";

  // ── 未承認ガード ──────────────────────────────────────────────────
  if (!isApproved) {
    return (
      <Box bg="#f9f9f8" mih="100vh">
        <DashboardHeader user={user} />
        <Container size="xs" pt={100}>
          <Paper p={40} style={card} ta="center">
            <ThemeIcon size={52} radius="xl" color="gray.1" c="gray.5" mb="xl">
              <IconLock size={26} />
            </ThemeIcon>
            <Title order={3} fw={600} mb="xs">
              Private Project
            </Title>
            <Text c="dimmed" size="sm" mb="xl">
              このプロジェクトの詳細を閲覧するには、オーナーの承認が必要です。
            </Text>
            <Divider mb="xl" color="gray.1" />
            <Box ta="left" mb="xl">
              <Group gap={8} mb={4}>
                <ThemeIcon variant="light" color="dark" size={26} radius="md">
                  {ProjectIcon && <ProjectIcon size={13} />}
                </ThemeIcon>
                <Text fw={600} size="sm">
                  {project.title}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" ml={34}>
                Owner: {ownerUsername}
              </Text>

              {/* 公開情報になった progress を表示 */}
              <Box ml={34} mt="md">
                <Group justify="space-between" mb={4}>
                  <Text size="xs" fw={600} c="dimmed">
                    Progress
                  </Text>
                  <Text size="xs" fw={700}>
                    {project.progress ?? 0}%
                  </Text>
                </Group>
                <Progress
                  value={project.progress ?? 0}
                  size="xs"
                  color="gray.3"
                  radius="xl"
                />
              </Box>
            </Box>
            {isPendingMember ? (
              <Button
                fullWidth
                variant="light"
                color="blue"
                radius="md"
                disabled
                size="sm"
              >
                承認待ちです...
              </Button>
            ) : (
              <Button
                fullWidth
                color="dark"
                radius="md"
                size="sm"
                leftSection={<IconUserPlus size={15} />}
                onClick={handleJoinRequest}
                loading={requestLoading}
              >
                参加リクエストを送る
              </Button>
            )}
            <Button
              fullWidth
              variant="subtle"
              color="gray"
              mt="xs"
              size="xs"
              onClick={() => router.push("/")}
            >
              ダッシュボードに戻る
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  // ── 承認済み詳細画面 ──────────────────────────────────────────────
  return (
    <Box
      bg="#F8FAFB"
      mih="100vh"
      style={{
        opacity: isPendingUpdate ? 0.85 : 1,
        transition: "opacity 0.2s",
      }}
    >
      <DashboardHeader user={user} />

      <Container size="lg" pt={rem(24)} pb={80}>
        {/* パンくずリスト：位置と余白を固定 */}
        <Group gap={4} mb="lg" wrap="nowrap" style={{ overflow: "hidden" }}>
          <Anchor
            size="xs"
            c="dimmed"
            underline="never"
            onClick={() => router.push("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              flexShrink: 0,
            }}
          >
            <IconArrowLeft size={14} /> Dashboard
          </Anchor>
          <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
            /
          </Text>
          <Text size="xs" fw={600} truncate style={{ maxWidth: rem(200) }}>
            {project.title}
          </Text>
        </Group>
        <Stack gap={10} mb="xl">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Group gap={14} align="flex-start" style={{ minWidth: 0 }}>
              <ThemeIcon
                size={44}
                radius="md"
                color="dark"
                variant="filled"
                style={{ flexShrink: 0 }}
              >
                {ProjectIcon && <ProjectIcon size={22} />}
              </ThemeIcon>
              <Stack gap={3} style={{ minWidth: 0 }}>
                <Group gap={8} wrap="nowrap">
                  <Text
                    fw={600}
                    style={{
                      fontSize: rem(20),
                      lineHeight: 1.15,
                      letterSpacing: "-0.02em",
                    }}
                    truncate
                  >
                    {project.title}
                  </Text>
                  <Badge
                    variant="light"
                    color={theme.color}
                    size="xs"
                    radius="xl"
                    style={{ textTransform: "none", flexShrink: 0 }}
                  >
                    {theme.label}
                  </Badge>
                </Group>
                <Group gap={4} align="center">
                  <IconCrown size={10} color="var(--mantine-color-orange-4)" />
                  <Text size="xs" c="dimmed">
                    Owned by {ownerUsername}
                  </Text>
                </Group>
              </Stack>
            </Group>

            {isOwner && (
              <Button
                leftSection={<IconSettings size={13} />}
                variant="default"
                radius="md"
                size="xs"
                onClick={() => router.push(`/projects/${project.id}/settings`)}
                styles={{
                  root: {
                    border: "0.5px solid var(--mantine-color-gray-3)",
                    fontWeight: 500,
                    flexShrink: 0,
                  },
                }}
              >
                Settings
              </Button>
            )}
          </Group>
        </Stack>

        <Grid gutter={40}>
          <Grid.Col span={{ base: 12, md: 9 }}>
            <Stack gap={48}>
              <Box>
                <Group gap={10} mb="xl">
                  <Title
                    order={2}
                    style={{ fontSize: rem(22), letterSpacing: "-0.02em" }}
                  >
                    Project Overview
                  </Title>
                </Group>

                <Box px={rem(4)}>
                  {project.description ? (
                    <MarkdownViewer content={project.description} />
                  ) : (
                    <Text size="sm" c="dimmed" style={{ fontStyle: "italic" }}>
                      プロジェクトの詳細はまだ登録されていません。
                    </Text>
                  )}
                </Box>

                {project.tags && project.tags.length > 0 && (
                  <Group gap={8} mt={40}>
                    {project.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="light"
                        color="gray"
                        size="sm"
                        radius="sm"
                        leftSection={<IconHash size={10} />}
                        styles={{
                          root: {
                            textTransform: "none",
                            backgroundColor: "var(--mantine-color-gray-1)",
                            color: "var(--mantine-color-gray-7)",
                            border: "none",
                            fontWeight: 500,
                            paddingInline: rem(10),
                          },
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                )}
                {!isApprovedMember && (
                  <Paper
                    withBorder
                    p={30}
                    mt={40}
                    radius="md"
                    style={{
                      borderStyle: "dashed",
                      textAlign: "center",
                      background: "#fafafa",
                    }}
                  >
                    <Stack align="center" gap="md">
                      <ThemeIcon
                        size={50}
                        radius="xl"
                        color="gray.2"
                        c="gray.6"
                        variant="light"
                      >
                        <IconUserPlus size={25} />
                      </ThemeIcon>
                      <Box>
                        <Text fw={600} size="lg">
                          このプロジェクトに興味がありますか？
                        </Text>
                        <Text size="sm" c="dimmed">
                          メンバーとして参加して、一緒に開発を始めましょう。
                        </Text>
                      </Box>
                      {isPendingMember ? (
                        <Stack align="center" gap={8}>
                          <Tooltip label="申請をキャンセル" withArrow>
                            <Button
                              variant="light"
                              color="blue"
                              radius="md"
                              disabled
                              fullWidth
                              onClick={handleCancelRequest}
                            >
                              現在オーナーの承認待ちです
                            </Button>
                          </Tooltip>
                        </Stack>
                      ) : (
                        <Button
                          color="dark"
                          radius="md"
                          size="md"
                          px={40}
                          onClick={handleJoinRequest}
                          loading={requestLoading}
                        >
                          参加リクエストを送る
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                )}
              </Box>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3 }}>
            <Stack gap={24}>
              <Box>
                <Text style={SECTION_TITLE}>About</Text>
                {project.url && (
                  <Group gap={8} mb="xs">
                    <IconLink size={14} color="#636c76" />
                    <Anchor
                      href={project.url}
                      target="_blank"
                      size="xs"
                      fw={600}
                      truncate
                      style={{ flex: 1 }}
                    >
                      {project.url.replace(/^https?:\/\//, "")}
                    </Anchor>
                  </Group>
                )}
                <Group gap={8} mb="xs">
                  <IconCalendar size={14} color="#636c76" />
                  <Text size="xs" c="dimmed">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </Text>
                </Group>
                <Group gap={5} mt="md">
                  {project.tags?.map((tag) => (
                    <Badge
                      key={tag}
                      variant="light"
                      color="gray"
                      size="xs"
                      radius="sm"
                      style={{
                        textTransform: "none",
                        backgroundColor: "#f1f3f5",
                        color: "#1f2328",
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </Group>
              </Box>

              <Divider color="gray.1" />

              <Box>
                <Text style={SECTION_TITLE}>Stats</Text>
                <Group justify="space-between" mb={6}>
                  <Text size="xs" fw={500} c="dimmed">
                    Development Progress
                  </Text>
                  <Text size="xs" fw={700} c="dark.9">
                    {project.progress ?? 0}%
                  </Text>
                </Group>
                <Progress
                  value={project.progress ?? 0}
                  color="green.6"
                  size="sm"
                  radius="xl"
                  bg="#ebedf0"
                />
              </Box>

              <Divider color="gray.1" />

              <Box>
                <Text style={SECTION_TITLE}>
                  Contributors{" "}
                  <Text component="span" fw={400} c="dimmed" ml={4}>
                    {approvedMembers.length}
                  </Text>
                </Text>
                <Stack gap={12} mt="md">
                  {approvedMembers.map((m) => (
                    <Group key={m.user_id} gap={10} wrap="nowrap">
                      <Avatar src={m.avatar_url} size={24} radius="xl" />
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Group gap={6} align="center" wrap="nowrap">
                          <Text size="xs" fw={600} c="dark.9" truncate>
                            {m.username}
                          </Text>
                          {m.position && (
                            <Badge
                              variant="transparent"
                              p={0}
                              size="xs"
                              c="dimmed"
                              style={{
                                textTransform: "none",
                                fontSize: rem(10),
                              }}
                            >
                              {m.position}
                            </Badge>
                          )}
                        </Group>
                      </Box>
                      {m.user_id === project.owner_id && (
                        <IconCrown size={12} color="#D4A017" />
                      )}
                    </Group>
                  ))}
                </Stack>
              </Box>

              {isOwner && pendingRequests.length > 0 && (
                <Paper
                  p="md"
                  style={{
                    ...MODERN_CARD,
                    background: "#fff8ec",
                    borderColor: "#f7d39a",
                  }}
                >
                  <Group justify="space-between" mb={8}>
                    <Text size="xs" fw={700} c="#9a6700">
                      REQUESTS
                    </Text>
                    <Badge color="orange" size="xs">
                      {pendingRequests.length}
                    </Badge>
                  </Group>
                  <Button
                    variant="filled"
                    color="orange"
                    size="xs"
                    fullWidth
                    radius="md"
                    onClick={() =>
                      router.push(`/projects/${project.id}/settings`)
                    }
                  >
                    Review pending
                  </Button>
                </Paper>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
