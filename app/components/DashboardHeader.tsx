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

  const fetchHeaderProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, updated_at")
      .eq("id", user.id)
      .single();
    if (data && !error) {
      setHeaderProfile(data as Profile);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) fetchHeaderProfile();
    });

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((event) => {
      if (isMounted && (event === "USER_UPDATED" || event === "SIGNED_IN")) {
        fetchHeaderProfile();
      }
    });

    const profileChannel = supabase
      .channel(`header_profile_realtime_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        () => {
          if (isMounted) fetchHeaderProfile();
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      authListener.unsubscribe();
      supabase.removeChannel(profileChannel);
    };
  }, [user, fetchHeaderProfile]);

  // --- 表示データの優先順位ロジック ---

  // 1. DBのプロフィールを最優先、なければAuthメタデータ
  const rawAvatar =
    headerProfile?.avatar_url || user?.user_metadata?.avatar_url;

  // 画像キャッシュ対策: updated_at があればクエリパラメータとして付与
  const displayAvatar =
    rawAvatar && headerProfile?.updated_at
      ? `${rawAvatar}?t=${new Date(headerProfile.updated_at).getTime()}`
      : rawAvatar;

  // 名前もプロフィール(DB)を最優先
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
                        // 画像URL（タイムスタンプ込）をkeyにして変更を即時検知
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
