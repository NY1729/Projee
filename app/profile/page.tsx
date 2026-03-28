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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveLoading(true);
    const formData = new FormData(event.currentTarget);
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      await updateProfile(formData);
      setAvatarFile(null);
      setPreviewUrl(null);
      await supabase.auth.refreshSession();
      close();
      await fetchProfile();
    } catch (e) {
      notifications.show({
        title: "エラー",
        message: "更新に失敗しました",
        color: "red",
      });
    } finally {
      setSaveLoading(false);
    }
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

  return (
    <Box bg="#FBFCFD" mih="100vh">
      <DashboardHeader user={user} />
      <Container size="lg" pt={50} pb={80}>
        <Group align="flex-start" gap={40} wrap="nowrap" visibleFrom="sm">
          <Stack style={{ width: rem(280) }}>
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

          <Stack style={{ flex: 1 }}>
            <Tabs value={activeTab} onChange={setActiveTab} variant="outline">
              <Tabs.List>
                <Tabs.Tab value="owning" leftSection={<IconRocket size={14} />}>
                  所有プロジェクト
                </Tabs.Tab>
                <Tabs.Tab
                  value="joined"
                  leftSection={<IconCircleCheck size={14} />}
                >
                  参加中
                </Tabs.Tab>
              </Tabs.List>
              <Box mt="xl">
                <Paper withBorder radius="md">
                  {loading ? (
                    <Skeleton height={200} />
                  ) : projects.length > 0 ? (
                    projects
                      .filter((p) =>
                        activeTab === "owning"
                          ? p.owner_id === user.id
                          : p.owner_id !== user.id,
                      )
                      .map((p) => (
                        <ProjectRow key={p.id} proj={p} currentUser={user} />
                      ))
                  ) : (
                    <Box p="xl" ta="center">
                      <Text c="dimmed">なし</Text>
                    </Box>
                  )}
                </Paper>
              </Box>
            </Tabs>
          </Stack>
        </Group>
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
