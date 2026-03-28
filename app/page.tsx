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
} from "@mantine/core";
import {
  IconActivity,
  IconRocket,
  IconUsers,
  IconHeartHandshake,
} from "@tabler/icons-react";
import { supabase } from "@/lib/supabase";
import { DashboardHeader } from "./components/DashboardHeader";
import { StatCard } from "./components/StatCard";
import { ProjectRow } from "./components/ProjectRow";
import { Project } from "./types/project";
import { useAuth } from "./hooks/useAuth";
import { LoginForm } from "./components/LoginForm";
import { DASHBOARD_GRID_COLS } from "./constants/project";

const COL_LABELS = ["PROJECT", "STATUS", "PROGRESS", "TAGS", "TEAM", ""];

export default function ProjeeDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalUserCount, setTotalUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>("all");
  const hasInitialized = useRef(false);

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

  // 1. 初回のデータ取得
  useEffect(() => {
    if (!user || hasInitialized.current) return;

    // 非同期実行を明示的に即時実行関数 (IIFE) で包む
    const init = async () => {
      hasInitialized.current = true;
      await Promise.all([fetchProjects(), fetchUserCount()]);
    };

    init();
  }, [user, fetchProjects, fetchUserCount]);

  // 2. リアルタイム購読
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          fetchProjects();
        }, // 直接呼ぶのではなく関数でラップ
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_members" },
        () => {
          fetchProjects();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          fetchUserCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchProjects, fetchUserCount]);

  if (authLoading) return null;
  if (!user)
    return (
      <Box
        bg="#F8FAFB"
        mih="100vh"
        display="flex"
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <LoginForm />
      </Box>
    );

  const filtered = projects.filter((p) => {
    if (activeTab === "recruiting") return p.status === "Planning";
    if (activeTab === "active") return p.status === "In Progress";
    return true;
  });

  return (
    <Box bg="#FBFCFD" mih="100vh">
      <DashboardHeader user={user} />
      <Container size="lg" pt={40} pb={80}>
        <SimpleGrid cols={{ base: 1, sm: 3 }} mb={50} spacing="xl">
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

        <Group justify="space-between" mb="md" align="flex-end">
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            variant="pills"
            radius="md"
            color="dark"
          >
            <Tabs.List>
              <Tabs.Tab value="all" px="lg">
                すべて
              </Tabs.Tab>
              <Tabs.Tab value="recruiting" px="lg">
                募集中
              </Tabs.Tab>
              <Tabs.Tab value="active" px="lg">
                進行中
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
          <Group gap={8} style={{ paddingBottom: 8 }}>
            <Box
              style={{
                width: 8,
                height: 8,
                background: "#40c057",
                borderRadius: "50%",
              }}
            />
            <Text size="xs" fw={700} c="dimmed">
              LIVE UPDATES
            </Text>
          </Group>
        </Group>

        <Paper
          radius="md"
          withBorder
          shadow="sm"
          style={{ overflow: "hidden", borderColor: "#eef1f4" }}
        >
          <Box
            px="md"
            py={12}
            bg="#fcfcfd"
            visibleFrom="md"
            style={{
              display: "grid",
              gridTemplateColumns: DASHBOARD_GRID_COLS,
              gap: "16px",
              borderBottom: "1px solid #f1f3f5",
            }}
          >
            {COL_LABELS.map((l, i) => (
              <Text key={i} size="xs" fw={700} c="gray.5">
                {l}
              </Text>
            ))}
          </Box>
          <Stack gap={0}>
            {loading ? (
              <Skeleton height={200} radius="md" />
            ) : (
              filtered.map((proj) => (
                <ProjectRow key={proj.id} proj={proj} currentUser={user} />
              ))
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
