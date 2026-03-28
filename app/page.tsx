"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Container,
  SimpleGrid,
  Group,
  Tabs,
  Box,
  Text,
  Stack,
  Paper,
  Skeleton,
  rem,
  Center,
} from "@mantine/core";
import { supabase } from "@/lib/supabase";
import { DashboardHeader } from "./components/DashboardHeader";
import { StatCard } from "./components/StatCard";
import { ProjectRow } from "./components/ProjectRow";
import { Project } from "./types/project";
import { useAuth } from "./hooks/useAuth";
import { LoginForm } from "./components/LoginForm";

export default function ProjeeDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalUserCount, setTotalUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>("all");
  const hasInitialized = useRef(false);

  // データ取得ロジック (変更なし)
  const fetchUserCount = useCallback(async () => {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    if (count !== null) setTotalUserCount(count);
  }, []);

  const fetchProjects = useCallback(async () => {
    const { data } = await supabase
      .from("project_with_members")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      const visible = (data as Project[]).filter((p) => {
        if (p.visibility === "public" || p.owner_id === user?.id) return true;
        return p.member_details?.some(
          (m) => m.user_id === user?.id && m.status === "approved",
        );
      });
      setProjects(visible);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user || hasInitialized.current) return;
    const init = async () => {
      hasInitialized.current = true;
      await Promise.all([fetchProjects(), fetchUserCount()]);
    };
    init();
  }, [user, fetchProjects, fetchUserCount]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => fetchProjects(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_members" },
        () => fetchProjects(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchUserCount(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchProjects, fetchUserCount]);

  if (authLoading) return null;

  // 1. 未ログイン時のレスポンシブ対応
  if (!user)
    return (
      <Center bg="#F8FAFB" mih="100vh" p="md">
        <Box style={{ width: "100%", maxWidth: rem(800) }}>
          <LoginForm />
        </Box>
      </Center>
    );

  const filtered = projects.filter((p) => {
    if (activeTab === "recruiting") return p.status === "Planning";
    if (activeTab === "active") return p.status === "In Progress";
    return true;
  });

  return (
    <Box bg="#FBFCFD" mih="100vh">
      <DashboardHeader user={user} />

      <Container size="lg" pt={{ base: 20, sm: 40 }} pb={80}>
        {/* 2. 統計カード: スマホでは1列、タブレット以上で3列 */}
        <SimpleGrid
          cols={{ base: 1, xs: 2, sm: 3 }}
          mb={{ base: 30, sm: 50 }}
          spacing="md"
        >
          <StatCard
            label="進行中"
            val={String(
              projects.filter((p) => p.status === "In Progress").length,
            )}
            sub="Active"
          />
          <StatCard
            label="全メンバー"
            val={String(totalUserCount)}
            sub="Users"
          />
          <StatCard
            label="募集中"
            val={String(projects.filter((p) => p.status === "Planning").length)}
            sub="Hiring"
          />
        </SimpleGrid>

        {/* 3. フィルターとLIVE UPDATES: スマホでは縦並びを許容 */}
        <Group justify="space-between" mb="md" align="center">
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            variant="pills"
            radius="md"
            color="dark"
          >
            <Tabs.List>
              <Tabs.Tab value="all">すべて</Tabs.Tab>
              <Tabs.Tab value="recruiting">募集中</Tabs.Tab>
              <Tabs.Tab value="active">進行中</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Group>

        <Paper
          radius="md"
          withBorder
          shadow="sm"
          style={{ overflow: "hidden", borderColor: "#eef1f4" }}
        >
          <Stack gap={0}>
            {loading ? (
              <Box p="md">
                <Skeleton height={200} radius="md" />
              </Box>
            ) : filtered.length > 0 ? (
              filtered.map((proj) => (
                <ProjectRow key={proj.id} proj={proj} currentUser={user} />
              ))
            ) : (
              <Center py={60} px="md">
                <Stack align="center" gap="xs">
                  <Text fw={600} c="dimmed">
                    表示できるプロジェクトがありません
                  </Text>
                  <Text size="sm" c="dimmed">
                    新しいプロジェクトを作成してみましょう！
                  </Text>
                </Stack>
              </Center>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
