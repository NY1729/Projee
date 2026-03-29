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
import { useEffect, useState, useCallback, useRef } from "react";
import { Profile } from "../types/project";
import { useRouter } from "next/navigation";

type DashboardHeaderProps = {
  user: User | null;
};

export const DashboardHeader = ({ user }: DashboardHeaderProps) => {
  const [headerProfile, setHeaderProfile] = useState<Profile | null>(null);
  const router = useRouter();
  const isSyncing = useRef(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  /**
   * Authのメタデータを profiles テーブルに強制同期（上書き）させる関数
   */
  const syncAuthToProfile = useCallback(async (currUser: User) => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    const metadata = currUser.user_metadata;
    // Googleは 'picture'、GitHubは 'avatar_url' を使うため両方チェック
    const authAvatar = metadata?.avatar_url || metadata?.picture;
    const authFullName = metadata?.full_name;

    if (!authAvatar && !authFullName) {
      isSyncing.current = false;
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        avatar_url: authAvatar,
        full_name: authFullName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currUser.id)
      .select()
      .single();

    if (data && !error) {
      setHeaderProfile(data as Profile);
    }
    isSyncing.current = false;
  }, []);

  /**
   * DBから情報を取得し、Auth側と差異があれば同期を実行する
   */
  const fetchHeaderProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, updated_at")
      .eq("id", user.id)
      .single();

    const authAvatar =
      user.user_metadata?.avatar_url || user.user_metadata?.picture;

    if (data && !error) {
      // DBの値が空、もしくはAuth側の画像URLと一致しない場合はAuthで上書き
      if (authAvatar && data.avatar_url !== authAvatar) {
        await syncAuthToProfile(user);
      } else {
        setHeaderProfile(data as Profile);
      }
    } else if (error && authAvatar) {
      // Profilesにレコード自体がない場合も同期（作成）を試みる
      await syncAuthToProfile(user);
    }
  }, [user, syncAuthToProfile]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted) fetchHeaderProfile();
    }, 0);

    // Auth状態の変化（ログイン時やメタデータ更新時）を監視
    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted && (event === "USER_UPDATED" || event === "SIGNED_IN")) {
        if (session?.user) syncAuthToProfile(session.user);
      }
    });

    // Realtime: 他のデバイスでの更新を検知
    const profileChannel = supabase
      .channel(`header_sync_realtime_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (isMounted) setHeaderProfile(payload.new as Profile);
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      authListener.unsubscribe();
      supabase.removeChannel(profileChannel);
    };
  }, [user, fetchHeaderProfile, syncAuthToProfile]);

  // --- 表示用URLと名前の計算 ---
  const displayAvatar =
    headerProfile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture;

  // ブラウザキャッシュ対策: updated_at をクエリに付与
  const avatarSrc =
    displayAvatar && headerProfile?.updated_at
      ? `${displayAvatar}${displayAvatar.includes("?") ? "&" : "?"}t=${new Date(headerProfile.updated_at).getTime()}`
      : displayAvatar;

  const displayName =
    headerProfile?.full_name?.split(" ")[0] ||
    headerProfile?.username ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    "User";

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
