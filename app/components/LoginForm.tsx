"use client";

import { useState } from "react";
import { Box, Button, Text, Stack, rem, Anchor } from "@mantine/core";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const OAUTH_PROVIDERS = [
  {
    id: "google" as const,
    label: "Google でログイン",
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  {
    id: "discord" as const,
    label: "Discord でログイン",
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="#5865F2">
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
      </svg>
    ),
  },
  {
    id: "github" as const,
    label: "GitHub でログイン",
    icon: (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
] as const;

type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]["id"];

const OAuthButton = ({
  label,
  icon,
  onClick,
  loading,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading: boolean;
}) => (
  <Button
    variant="default"
    fullWidth
    radius="md"
    loading={loading}
    onClick={onClick}
    leftSection={icon}
    styles={{
      root: {
        border: "1px solid var(--mantine-color-gray-3)",
        fontWeight: 500,
        fontSize: rem(14),
        height: rem(48),
        justifyContent: "center",
        paddingInline: rem(16),
        backgroundColor: "var(--mantine-color-white)",
      },
      section: { marginRight: rem(12) },
    }}
  >
    {label}
  </Button>
);

export const LoginForm = () => {
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <>
      <Box
        className="login-container"
        style={{
          display: "flex",
          minHeight: rem(520),
          border: "1px solid var(--mantine-color-gray-2)",
          borderRadius: "var(--mantine-radius-lg)",
          overflow: "hidden",
          backgroundColor: "var(--mantine-color-white)",
          boxShadow: "var(--mantine-shadow-md)",
        }}
      >
        {/* ── 左パネル (ダーク) ── */}
        <Box
          className="login-left-panel"
          style={{
            background: "#0f0f0f",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: rem(32),
          }}
        >
          <Box style={{ display: "flex", alignItems: "center", gap: rem(8) }}>
            <Box
              style={{
                width: rem(10),
                height: rem(10),
                borderRadius: "50%",
                background: "#fff",
              }}
            />
            <Text fw={600} style={{ color: "#fff", letterSpacing: rem(1) }}>
              PROJEE
            </Text>
          </Box>

          <Box my={rem(40)}>
            <Text
              className="login-title"
              fw={500}
              style={{
                lineHeight: 1.3,
                color: "#fff",
                marginBottom: rem(16),
              }}
            >
              サークルの
              <br />
              プロジェクトを
              <br />
              一箇所で。
            </Text>
            <Text style={{ color: "#888", lineHeight: 1.7, fontSize: rem(14) }}>
              進捗・メンバー・募集状況を
              <br />
              リアルタイムで把握できます。
            </Text>
          </Box>

          <Text size="xs" style={{ color: "#444" }}>
            © 2026 Projee
          </Text>
        </Box>

        {/* ── 右パネル (ログイン) ── */}
        <Box
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: rem(32),
          }}
        >
          <Box style={{ width: "100%", maxWidth: rem(320) }}>
            <Stack gap={rem(4)} mb={rem(32)} ta="center">
              <Text fw={600} style={{ fontSize: rem(24) }}>
                Welcome back
              </Text>
              <Text c="dimmed" size="sm">
                アカウントを選択してログインしてください
              </Text>
            </Stack>

            <Stack gap={12}>
              {OAUTH_PROVIDERS.map((p) => (
                <OAuthButton
                  key={p.id}
                  label={p.label}
                  icon={p.icon}
                  onClick={() => handleOAuthLogin(p.id)}
                  loading={oauthLoading === p.id}
                />
              ))}
            </Stack>

            <Text
              size="xs"
              c="dimmed"
              ta="center"
              mt={rem(40)}
              style={{ lineHeight: 1.6 }}
            >
              ログインすることで、当サービスの
              <br />
              <Anchor
                component={Link}
                href="/terms"
                size="xs"
                c="dimmed"
                underline="always"
              >
                利用規約
              </Anchor>{" "}
              および{" "}
              <Anchor
                component={Link}
                href="/privacy"
                size="xs"
                c="dimmed"
                underline="always"
              >
                プライバシーポリシー
              </Anchor>
              に同意したことになります。
            </Text>
          </Box>
        </Box>
      </Box>

      {/* ── メディアクエリを CSS で記述 ── */}
      <style>{`
        /* デフォルト (スマホ) */
        .login-container {
          flex-direction: column;
        }
        .login-left-panel {
          width: 100%;
        }
        .login-title {
          font-size: ${rem(22)};
        }

        /* PC用 (768px以上) */
        @media (min-width: 768px) {
          .login-container {
            flex-direction: row;
          }
          .login-left-panel {
            width: ${rem(360)};
            padding: ${rem(40)} !important;
          }
          .login-title {
            font-size: ${rem(28)} !important;
          }
        }
      `}</style>
    </>
  );
};
