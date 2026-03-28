"use client";

import {
  Container,
  Title,
  Text,
  Stack,
  Divider,
  Button,
  Paper,
  Box,
  rem,
  Group,
  ThemeIcon,
} from "@mantine/core";
import { IconArrowLeft, IconShieldCheck } from "@tabler/icons-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <Box bg="#F8FAFB" mih="100vh" py={rem(60)}>
      <Container size="sm">
        <Paper p={rem(40)} radius="md" withBorder shadow="sm">
          <Stack gap="xl">
            <Box>
              <Group gap="xs" mb={8}>
                <ThemeIcon variant="light" color="blue" radius="xl">
                  <IconShieldCheck size={18} />
                </ThemeIcon>
                <Title
                  order={1}
                  style={{ fontSize: rem(28), letterSpacing: "-0.02em" }}
                >
                  プライバシーポリシー
                </Title>
              </Group>
              <Text size="sm" c="dimmed">
                最終更新日: 2026年3月29日
              </Text>
            </Box>

            <Divider />

            <Stack gap="lg">
              <Box>
                <Text fw={700} mb={8}>
                  1. 収集する情報
                </Text>
                <Text size="sm" style={{ lineHeight: 1.8 }}>
                  当サービスは、外部認証プロバイダ（GitHub / Google / Discord）から提供される以下の情報を収集します。
                  <br />
                  ・氏名またはユーザー名
                  <br />
                  ・メールアドレス
                  <br />
                  ・プロフィール画像URL
                </Text>
              </Box>

              <Box>
                <Text fw={700} mb={8}>
                  2. 情報の利用目的
                </Text>
                <Text size="sm" style={{ lineHeight: 1.8 }}>
                  ・ユーザーの本人確認およびサービス提供のため
                  <br />
                  ・プロジェクトの所有者・参加者としての表示のため
                  <br />
                  ・重大な変更に関する通知をメールで行うため
                </Text>
              </Box>

              <Box>
                <Text fw={700} mb={8}>
                  3. データの保存と安全管理
                </Text>
                <Text size="sm" style={{ lineHeight: 1.8 }}>
                  データは Supabase (PostgreSQL) 上で管理され、適切なセキュリティ対策を講じています。ユーザー自身がアカウント削除を実行した場合、すべての関連データは直ちに物理削除されます。
                </Text>
              </Box>

              <Box>
                <Text fw={700} mb={8}>
                  4. Cookieの使用について
                </Text>
                <Text size="sm" style={{ lineHeight: 1.8 }}>
                  本サービスは、ユーザー認証の維持を目的として Cookie を使用しています。これはサービスの提供に必要なものであり、広告目的では使用しません。ブラウザの設定により Cookie を無効にすることができますが、その場合、一部の機能が正常に動作しなくなる可能性があります。
                </Text>
              </Box>

              <Box>
                <Text fw={700} mb={8}>
                  5. 第三者への提供
                </Text>
                <Text size="sm" style={{ lineHeight: 1.8 }}>
                  収集した個人情報は、法令に基づく場合を除き、ユーザーの同意なく第三者に提供することはありません。
                </Text>
              </Box>

              <Box>
                <Text fw={700} mb={8}>
                  6. お問い合わせ
                </Text>
                <Text size="sm" style={{ lineHeight: 1.8 }}>
                  個人情報の取り扱いに関するお問い合わせは、nkgwyuu@gmail.comまでご連絡ください。
                </Text>
              </Box>
            </Stack>

            <Divider mt="xl" />

            <Group justify="center">
              <Button
                component={Link}
                href="/login"
                variant="subtle"
                color="gray"
                leftSection={<IconArrowLeft size={14} />}
              >
                ログイン画面に戻る
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}