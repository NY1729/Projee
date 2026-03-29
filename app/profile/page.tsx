"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Group,
  Box,
  Text,
  Stack,
  Paper,
  Avatar,
  Title,
  Tabs,
  rem,
  Button,
  Skeleton,
  Modal,
  TextInput,
  FileButton,
  UnstyledButton,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconRocket,
  IconCircleCheck,
  IconSettings,
  IconCamera,
  IconCheck,
  IconTrash,
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase";
import { DashboardHeader } from "../components/DashboardHeader";
import { ProjectRow } from "../components/ProjectRow";
import { Project, Profile } from "../types/project";
import { useAuth } from "../hooks/useAuth";
import { updateProfile, deleteAccount } from "../actions/profile";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { DASHBOARD_GRID_COLS } from "../constants/project";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>("owning");

  const [opened, { open, close }] = useDisclosure(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id);
    if (data && data.length > 0) {
      const p = data[0];
      if (p.avatar_url) p.avatar_url = `${p.avatar_url}?t=${Date.now()}`;
      setProfile(p);
    }
  }, [user]);

  const fetchMyProjects = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("project_with_members")
      .select("*")
      .order("created_at", { ascending: false });
    if (data)
      setProjects(
        (data as Project[]).filter((p) =>
          p.member_details?.some((m) => m.user_id === user.id),
        ),
      );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchMyProjects();
  }, [user, fetchProfile, fetchMyProjects]);

  if (authLoading || !user) return null;

  const username = profile?.username || user.email?.split("@")[0];
  const displayAvatar = profile?.avatar_url || null;

  // ─── handleSubmit の中身を修正 ──────────────────────────────────────────────
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveLoading(true);

    try {
      const formData = new FormData(event.currentTarget);

      if (avatarFile) {
        // スマホの大容量画像をリサイズ・圧縮（最大1024px, 品質0.7）
        const compressedFile = await resizeImage(avatarFile, 1024);
        formData.append("avatar", compressedFile);
      }

      const result = await updateProfile(formData);

      // 成功時の処理
      setAvatarFile(null);
      setPreviewUrl(null);
      notifications.show({
        title: "更新完了",
        message: "プロフィールを更新しました",
        color: "teal",
        icon: <IconCheck size={16} />,
      });

      // セッションとプロフィールを最新に
      await supabase.auth.refreshSession();
      await fetchProfile();
      close();
    } catch (e) {
      console.error(e);
      notifications.show({
        title: "エラー",
        message: "画像のサイズが大きすぎるか、通信環境が不安定です",
        color: "red",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  // ─── 画像リサイズ用ヘルパー関数 ──────────────────────────────────────────────
  const resizeImage = (file: File, maxSize: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const resizedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
              } else {
                reject(new Error("Canvas is empty"));
              }
            },
            "image/jpeg",
            0.7, // 圧縮率（70%に落とすことで大幅に軽量化）
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const openDeleteModal = () => {
    modals.openConfirmModal({
      title: "アカウントの削除",
      centered: true,
      children: (
        <Text size="sm">
          アカウントを削除すると、これまでのプロジェクト、プロフィール、参加履歴がすべて失われます。この操作は取り消せません。本当に続けますか？
        </Text>
      ),
      labels: { confirm: "削除する", cancel: "キャンセル" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteAccount();
          notifications.show({
            title: "削除完了",
            message: "ご利用ありがとうございました",
            color: "blue",
          });
          window.location.href = "/";
        } catch (e) {
          notifications.show({
            title: "エラー",
            message: "削除に失敗しました。管理者に連絡してください。",
            color: "red",
          });
        }
      },
    });
  };

  const owningProjects = projects.filter((p) => p.owner_id === user.id);
  const joinedProjects = projects.filter((p) => p.owner_id !== user.id);

  const filteredProjects =
    activeTab === "owning" ? owningProjects : joinedProjects;

  return (
    <Box bg="#FBFCFD" mih="100vh">
      <DashboardHeader user={user} />

      <Container
        size="lg"
        pt={{ base: 24, sm: 50 }}
        pb={80}
        px={{ base: 16, sm: 24 }}
      >
        {/* ─── モバイル：横並びプロフィールヘッダー ─── */}
        <Box hiddenFrom="sm" mb="xl">
          <Group gap={16} align="center" mb="md">
            <Skeleton visible={loading} circle>
              <Avatar
                src={displayAvatar}
                size={72}
                radius={36}
                style={{
                  border: "1px solid var(--mantine-color-gray-2)",
                  flexShrink: 0,
                }}
              />
            </Skeleton>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Skeleton visible={loading} height={28} width="60%" mb={4}>
                <Title
                  order={2}
                  style={{
                    fontSize: rem(20),
                    letterSpacing: "-0.02em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {username}
                </Title>
              </Skeleton>
              <Text size="xs" c="dimmed">
                @{username}
              </Text>
            </Box>
          </Group>

          <Group gap={8}>
            <Button
              variant="default"
              size="xs"
              leftSection={<IconSettings size={13} />}
              onClick={open}
              radius="md"
              style={{ flex: 1 }}
            >
              編集する
            </Button>
            <Button
              variant="subtle"
              color="red"
              size="xs"
              leftSection={<IconTrash size={13} />}
              onClick={openDeleteModal}
              radius="md"
            >
              削除
            </Button>
          </Group>
        </Box>

        {/* ─── デスクトップ：元のサイドバー + タブ ─── */}
        <Group align="flex-start" gap={40} wrap="nowrap" visibleFrom="sm">
          {/* サイドバー */}
          <Stack style={{ width: rem(280), flexShrink: 0 }}>
            <Skeleton visible={loading} circle mb="md">
              <Avatar
                src={displayAvatar}
                size={280}
                radius={rem(140)}
                style={{ border: "1px solid var(--mantine-color-gray-2)" }}
              />
            </Skeleton>
            <Skeleton visible={loading} height={40} width="90%">
              <Title
                order={1}
                style={{ fontSize: rem(28), letterSpacing: "-0.03em" }}
              >
                {username}
              </Title>
            </Skeleton>
            <Skeleton visible={loading} height={40} mt="md">
              <Button
                variant="default"
                fullWidth
                leftSection={<IconSettings size={16} />}
                onClick={open}
              >
                編集する
              </Button>

              <Divider
                my="md"
                label="Danger Zone"
                labelPosition="center"
                color="red.2"
              />

              <Button
                variant="subtle"
                color="red"
                fullWidth
                leftSection={<IconTrash size={16} />}
                onClick={openDeleteModal}
              >
                アカウントを削除
              </Button>
            </Skeleton>
          </Stack>

          {/* プロジェクト一覧 */}
          <Stack style={{ flex: 1, minWidth: 0 }}>
            <ProjectTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              loading={loading}
              filteredProjects={filteredProjects}
              user={user}
              showHeader
            />
          </Stack>
        </Group>

        {/* ─── モバイル：タブのみ ─── */}
        <Box hiddenFrom="sm">
          <ProjectTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            loading={loading}
            filteredProjects={filteredProjects}
            user={user}
            showHeader={false}
          />
        </Box>
      </Container>

      <Modal
        opened={opened}
        onClose={close}
        title="プロフィール編集"
        centered
        radius="md"
      >
        <form onSubmit={handleSubmit}>
          <Stack gap="xl">
            <Group justify="center" pos="relative">
              <Avatar
                src={previewUrl || displayAvatar}
                size={120}
                radius={60}
              />
              <FileButton
                onChange={(f) => {
                  setAvatarFile(f);
                  if (f) {
                    const r = new FileReader();
                    r.onloadend = () => setPreviewUrl(r.result as string);
                    r.readAsDataURL(f);
                  }
                }}
                accept="image/*"
              >
                {(props) => (
                  <UnstyledButton
                    {...props}
                    pos="absolute"
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      background: "rgba(0,0,0,0.4)",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconCamera />
                  </UnstyledButton>
                )}
              </FileButton>
            </Group>
            <TextInput
              label="ユーザー名"
              name="username"
              defaultValue={username}
              leftSection="@"
              required
              radius="md"
            />
            <Button
              type="submit"
              color="dark"
              loading={saveLoading}
              fullWidth
              radius="md"
              leftSection={<IconCheck size={16} />}
            >
              保存
            </Button>
          </Stack>
        </form>
      </Modal>
    </Box>
  );
}

// ─── プロジェクト一覧タブ（共通コンポーネント） ──────────────────────────────
interface ProjectTabsProps {
  activeTab: string | null;
  setActiveTab: (tab: string | null) => void;
  loading: boolean;
  filteredProjects: Project[];
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  showHeader: boolean;
}

function ProjectTabs({
  activeTab,
  setActiveTab,
  loading,
  filteredProjects,
  user,
  showHeader,
}: ProjectTabsProps) {
  return (
    <Tabs value={activeTab} onChange={setActiveTab} variant="outline">
      <Tabs.List>
        <Tabs.Tab value="owning" leftSection={<IconRocket size={14} />}>
          所有
        </Tabs.Tab>
        <Tabs.Tab value="joined" leftSection={<IconCircleCheck size={14} />}>
          参加中
        </Tabs.Tab>
      </Tabs.List>

      <Box mt="md">
        <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
          {/* テーブルヘッダー（デスクトップのみ） */}
          {showHeader && (
            <Box
              px="md"
              py={10}
              bg="#fcfcfd"
              style={{
                display: "grid",
                gridTemplateColumns: DASHBOARD_GRID_COLS,
                gap: "16px",
                borderBottom: "1px solid #f1f3f5",
              }}
            >
              {["PROJECT", "STATUS", "PROGRESS", "TAGS", "TEAM", ""].map(
                (l, i) => (
                  <Text key={i} size="xs" fw={700} c="gray.5">
                    {l}
                  </Text>
                ),
              )}
            </Box>
          )}

          {loading ? (
            <Skeleton height={160} radius={0} />
          ) : filteredProjects.length > 0 ? (
            filteredProjects.map((p) => (
              <ProjectRow key={p.id} proj={p} currentUser={user} />
            ))
          ) : (
            <Box py={48} ta="center">
              <Text c="dimmed" size="sm">
                なし
              </Text>
            </Box>
          )}
        </Paper>
      </Box>
    </Tabs>
  );
}
