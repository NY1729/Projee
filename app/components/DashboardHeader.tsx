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
  Divider,
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
import { useEffect, useState } from "react";
import { Profile } from "../types/project";
import { useRouter } from "next/navigation";
type DashboardHeaderProps = {
  user: User | null;
};

export const DashboardHeader = ({ user }: DashboardHeaderProps) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const [headerProfile, setHeaderProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    const getHeaderProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, updated_at")
        .eq("id", user.id)
        .single();
      if (data) setHeaderProfile(data);
    };
    getHeaderProfile();
  }, [user]);

  const displayAvatar =
    headerProfile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName =
    headerProfile?.full_name?.split(" ")[0] ||
    user?.user_metadata?.full_name ||
    "User";
  const router = useRouter();

  return (
    <Paper
      component="header"
      style={{
        borderBottom: "0.5px solid var(--mantine-color-gray-2)", // 1px → 0.5px
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
          {/* ── ロゴ ── */}
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
                  flexShrink: 0,
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
                  letterSpacing: "-0.01em",
                  color: "var(--mantine-color-dark-9)",
                }}
                visibleFrom="xs"
              >
                Projee
              </Text>
            </Group>
          </Link>

          {/* ── 右側 ── */}
          {user && (
            <Group gap={10} align="center">
              {/* New Project ボタン */}
              <Button
                component={Link}
                href="/new"
                leftSection={<IconPlus size={14} stroke={2.5} />}
                radius="md"
                size="sm"
                style={{
                  background: "#0f0f0f",
                  fontWeight: 500,
                  fontSize: rem(13),
                }}
              >
                New Project
              </Button>

              {/* ユーザーメニュー */}
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
                        transition: "background 0.15s",
                      }}
                      className="header-user-btn"
                    >
                      <Avatar
                        src={displayAvatar}
                        radius="xl"
                        size={24}
                        name={displayName}
                      />
                      <Text
                        size="sm"
                        fw={500}
                        visibleFrom="sm"
                        style={{ letterSpacing: "-0.01em" }}
                      >
                        {displayName}
                      </Text>
                      <IconChevronDown
                        size={13}
                        color="var(--mantine-color-gray-5)"
                        style={{ flexShrink: 0 }}
                      />
                    </Group>
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown
                  style={{ border: "0.5px solid var(--mantine-color-gray-2)" }}
                >
                  <Box
                    px={12}
                    py={10}
                    style={{
                      borderBottom: "0.5px solid var(--mantine-color-gray-1)",
                    }}
                  >
                    <Text size="xs" fw={500} truncate>
                      {displayName}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                      {user.email}
                    </Text>
                  </Box>
                  <Box p={4}>
                    <Menu.Item
                      leftSection={<IconUser size={14} />}
                      style={{ fontSize: rem(13), borderRadius: rem(4) }}
                      onClick={() => router.push("/profile")}
                    >
                      プロフィール
                    </Menu.Item>
                    <Menu.Divider style={{ margin: `${rem(4)} 0` }} />
                    <Menu.Item
                      color="red"
                      leftSection={<IconLogout size={14} />}
                      onClick={handleLogout}
                      style={{ fontSize: rem(13), borderRadius: rem(4) }}
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

      <style>{`
        .header-user-btn:hover {
          background: var(--mantine-color-gray-0) !important;
        }
      `}</style>
    </Paper>
  );
};
