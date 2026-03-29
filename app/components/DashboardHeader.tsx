"use client";

import {
  Container,
  Group,
  Box,
  Text,
  Button,
  Paper,
  rem,
  Avatar,
  Menu,
  UnstyledButton,
} from "@mantine/core";
import {
  IconPlus,
  IconLogout,
  IconUser,
  IconChevronDown,
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef, startTransition } from "react";
import { Profile } from "../types/project";
import { useRouter } from "next/navigation";

type DashboardHeaderProps = {
  user: User | null;
};

export const DashboardHeader = ({ user }: DashboardHeaderProps) => {
  const [headerProfile, setHeaderProfile] = useState<Profile | null>(null);
  const router = useRouter();
  const isSyncing = useRef(false);
  const hasInitialized = useRef(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  /**
   * DB (profiles) の最新情報を Auth メタデータに強制上書きする
   */
  const syncProfileToAuth = useCallback(
    async (profile: Profile) => {
      if (isSyncing.current || !user) return;
      isSyncing.current = true;

      const authAvatar =
        user.user_metadata?.avatar_url || user.user_metadata?.picture;
      const authUserName = user.user_metadata?.username;

      // DBとAuthで差異がある場合のみ、Auth側をアップデート
      if (
        profile.avatar_url !== authAvatar ||
        profile.username !== authUserName
      ) {
        await supabase.auth.updateUser({
          data: {
            avatar_url: profile.avatar_url,
            username: profile.username,
          },
        });
      }
      isSyncing.current = false;
    },
    [user],
  );

  /**
   * 初回および更新時に必ず profiles テーブルから取得するメインロジック
   */
  const fetchHeaderProfile = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, updated_at")
      .eq("id", user.id)
      .single();

    if (data && !error) {
      const profile = data as Profile;
      setHeaderProfile(profile);
      // profiles 取得後、Auth 側をこのデータで上書き
      await syncProfileToAuth(profile);
    }
  }, [user, syncProfileToAuth]);

  useEffect(() => {
    if (!user) return;

    // 初回マウント時、必ず profiles から取得を実行
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      startTransition(() => {
        fetchHeaderProfile();
      });
    }

    // Profilesテーブルの更新をリアルタイム購読
    const profileChannel = supabase
      .channel(`header_db_master_sync_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newProfile = payload.new as Profile;
          setHeaderProfile(newProfile);
          // DBが更新されたら即座にAuth側も上書き
          syncProfileToAuth(newProfile);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
    };
  }, [user, fetchHeaderProfile, syncProfileToAuth]);

  // --- 表示データの確定 ---
  // headerProfile (DB) があればそれを使い、読み込み中のみ user (Auth) をフォールバックにする
  const displayAvatar =
    headerProfile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture;

  const avatarSrc =
    displayAvatar && headerProfile?.updated_at
      ? `${displayAvatar}${displayAvatar.includes("?") ? "&" : "?"}t=${new Date(headerProfile.updated_at).getTime()}`
      : displayAvatar;

  const displayName =
    headerProfile?.username || user?.user_metadata?.username || "User";

  return (
    <Paper
      component="header"
      style={{
        borderBottom: "1px solid var(--mantine-color-gray-2)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(8px)",
        height: rem(52),
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container size="lg" style={{ width: "100%" }}>
        <Group justify="space-between" align="center">
          <Link href="/" style={{ textDecoration: "none" }}>
            <Group gap={8} align="center">
              <Box
                style={{
                  width: rem(28),
                  height: rem(28),
                  background: "#0f0f0f",
                  borderRadius: rem(6),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  c="white"
                  fw={700}
                  style={{ fontSize: rem(13), lineHeight: 1 }}
                >
                  P
                </Text>
              </Box>
              <Text
                fw={600}
                style={{
                  fontSize: rem(15),
                  color: "var(--mantine-color-dark-9)",
                }}
                visibleFrom="xs"
              >
                Projee
              </Text>
            </Group>
          </Link>

          {user && (
            <Group gap={10} align="center">
              <Button
                component={Link}
                href="/new"
                leftSection={<IconPlus size={14} />}
                radius="md"
                size="sm"
                style={{ background: "#0f0f0f" }}
              >
                New Project
              </Button>

              <Menu
                shadow="md"
                width={200}
                radius="md"
                position="bottom-end"
                offset={8}
              >
                <Menu.Target>
                  <UnstyledButton>
                    <Group
                      gap={8}
                      align="center"
                      style={{
                        padding: `${rem(4)} ${rem(8)}`,
                        borderRadius: rem(6),
                        border: "1px solid var(--mantine-color-gray-3)",
                      }}
                      className="header-user-btn"
                    >
                      <Avatar
                        src={avatarSrc}
                        radius="xl"
                        size={24}
                        key={avatarSrc}
                        name={displayName}
                        color="initials"
                      />
                      <Text size="sm" fw={500} visibleFrom="sm">
                        {displayName}
                      </Text>
                      <IconChevronDown
                        size={13}
                        color="var(--mantine-color-gray-5)"
                      />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown>
                  <Box
                    px={12}
                    py={10}
                    style={{
                      borderBottom: "1px solid var(--mantine-color-gray-1)",
                    }}
                  >
                    <Text size="xs" fw={600} truncate>
                      {headerProfile?.full_name || displayName}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                      {user.email}
                    </Text>
                  </Box>
                  <Box p={4}>
                    <Menu.Item
                      leftSection={<IconUser size={14} />}
                      onClick={() => router.push("/profile")}
                    >
                      プロフィール
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<IconLogout size={14} />}
                      onClick={handleLogout}
                    >
                      ログアウト
                    </Menu.Item>
                  </Box>
                </Menu.Dropdown>
              </Menu>
            </Group>
          )}
        </Group>
      </Container>
      <style>{`.header-user-btn:hover { background: var(--mantine-color-gray-0) !important; }`}</style>
    </Paper>
  );
};
