"use client";

import { Card, Text, Group, Stack, rem } from "@mantine/core";

interface StatCardProps {
  label: string;
  val: string;
  sub: string;
}

export const StatCard = ({ label, val, sub }: StatCardProps) => {
  return (
    <Card
      withBorder
      padding={rem(24)}
      radius="md"
      shadow="none"
      style={{
        backgroundColor: "var(--mantine-color-white)",
        borderColor: "var(--mantine-color-gray-2)",
        transition: "border-color 0.2s ease, background-color 0.2s ease",
      }}
      className="minimal-stat-card"
    >
      <Stack gap={rem(4)}>
        <Text
          size="xs"
          fw={600}
          c="dimmed"
          tt="uppercase"
          style={{ letterSpacing: "0.08em" }}
        >
          {label}
        </Text>

        <Group align="baseline" gap={rem(8)}>
          <Text
            fw={700}
            style={{
              fontSize: rem(28),
              letterSpacing: rem(-0.8),
              lineHeight: 1,
              color: "var(--mantine-color-dark-9)",
            }}
          >
            {val}
          </Text>
          <Text size="xs" fw={500} c="gray.5">
            {sub}
          </Text>
        </Group>
      </Stack>

      <style>{`
        .minimal-stat-card:hover {
          border-color: var(--mantine-color-gray-4) !important;
          background-color: var(--mantine-color-gray-0) !important;
        }
      `}</style>
    </Card>
  );
};
