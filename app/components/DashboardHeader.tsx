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
import { useEffect, useState, useCallback } from "react";
import { Profile } from "../types/project";
import { useRouter } from "next/navigation";

type DashboardHeaderProps = {
  user: User | null;
};

export const DashboardHeader = ({ user }: DashboardHeaderProps) => {
  const [headerProfile, setHeaderProfile] = useState<Profile | null>(null);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  /**
   * profilesテーブルから最新情報を取得する関数
   */
  const fetchHeaderProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, updated_at")
      .eq("id", user.id)
      .single();

    if (data && !error) {
      setHeaderProfile(data as Profile);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // 初回ロード
    fetchHeaderProfile();

    /**
     * 1. Supabase Auth の状態変化を監視
     * サーバーアクションの auth.updateUser() によってメタデータが更新されると
     * 'USER_UPDATED' イベントが発火します。
     */
    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "USER_UPDATED" || event === "SIGNED_IN") {
        fetchHeaderProfile();
      }
    });

    /**
     * 2. profiles テーブルの直接的な更新を購読 (Realtime)
     * 他のタブやデバイスでの変更を即座に反映させます。
     */
    const profileChannel = supabase
      .channel(`header_profile_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        () => fetchHeaderProfile(),
      )
      .subscribe();

    return () => {
      authListener.unsubscribe();
      supabase.removeChannel(profileChannel);
    };
  }, [user, fetchHeaderProfile]);

  // 表示用データの計算
  // サーバー側でファイル名が変わるため、URLの変化そのものを key に渡して再描画を促します
  const displayAvatar =
    headerProfile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName =
    headerProfile?.full_name?.split(" ")[0] ||
    headerProfile?.username ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    "User";

  return (
    <Paper
      component="header"
      style={{
        borderBottom: "0.5px solid var(--mantine-color-gray-2)",
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
          {/* ロゴ */}
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
                        border: "0.5px solid var(--mantine-color-gray-3)",
                      }}
                      className="header-user-btn"
                    >
                      <Avatar
                        src={displayAvatar}
                        radius="xl"
                        size={24}
                        // ファイル名が変わった瞬間にコンポーネントをリセットして新画像を強制ロード
                        key={displayAvatar}
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
                      borderBottom: "0.5px solid var(--mantine-color-gray-1)",
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
