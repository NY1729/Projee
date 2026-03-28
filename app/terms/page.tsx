"use client";

import {
  Container,
  Title,
  Text,
  Stack,
  Divider,
  Button,
  Paper,
  List,
  rem,
  Box,
  Group,
  ThemeIcon,
} from "@mantine/core";
import { IconArrowLeft, IconFileText } from "@tabler/icons-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <Box bg="#F8FAFB" mih="100vh" py={rem(60)}>
      <Container size="sm">
        <Paper p={rem(40)} radius="md" withBorder shadow="sm">
          <Stack gap="xl">
            <Box>
              <Group gap="xs" mb={8}>
                <ThemeIcon variant="light" color="gray" radius="xl">
                  <IconFileText size={18} />
                </ThemeIcon>
                <Title
                  order={1}
                  style={{ fontSize: rem(28), letterSpacing: "-0.02em" }}
                >
                  利用規約
                </Title>
              </Group>
              <Text size="sm" c="dimmed">
                最終更新日: 2026年3月29日
              </Text>
            </Box>

            <Divider />

            <Stack gap="lg">
              <section>
                <Text fw={700} size="md" mb="xs">
                  第1条（目的）
                </Text>
                <Text size="sm" style={{ lineHeight: 1.8 }}>
                  本規約は、プロジェクト共有プラットフォーム「PROJEE」（以下「本サービス」）の利用条件を定めるものです。ユーザーは本規約に同意した上で本サービスをご利用ください。
                </Text>
              </section>

              <section>
                <Text fw={700} size="md" mb="xs">
                  第2条（アカウントの管理）
                </Text>
                <Text size="sm" style={{ lineHeight: 1.8 }}>
                  1. ユーザーは、GitHub、Google等の外部サービスを用いた認証によりアカウントを作成します。
                  <br />
                  2. ユーザーは、自己の責任においてアカウントを管理するものとし、第三者への譲渡・貸与は禁止します。
                </Text>
              </section>

              <section>
                <Text fw={700} size="md" mb="xs">
                  第3条（コンテンツと削除）
                </Text>
                <Text size="sm" style={{ lineHeight: 1.8 }}>
                  1. ユーザーが投稿したプロジェクト情報は、本サービス上で他のユーザーに公開されます。
                  <br />
                  2. ユーザーがアカウントを削除した場合、そのユーザーが所有するプロジェクト、プロフィール、および画像データは
                  <Text component="span" fw={700} inherit>
                    即座に完全抹消され、復元することはできません。
                  </Text>
                </Text>
              </section>

              <section>
                <Text fw={700} size="md" mb="xs">
                  第4条（禁止事項）
                </Text>
                <List size="sm" spacing="xs">
                  <List.Item>虚偽の情報の登録</List.Item>
                  <List.Item>他者の著作権、プライバシーの侵害</List.Item>
                  <List.Item>スパム行為、およびサーバーに過度な負荷をかける行為</List.Item>
                  <List.Item>本サービスの運営を妨害する行為</List.Item>
                </List>
              </section>

              <section>
                <Text fw={700} size="md" mb="xs">
                  第5条（免責事項）
                </Text>
                <Text size="sm" style={{ lineHeight: 1.8 }}>
                  1. 本サービスは現状有姿で提供されます。運営者は、本サービスの継続性・正確性・完全性について保証しません。
                  <br />
                  2. サービスの障害・停止・データ損失等によってユーザーに生じた損害について、運営者は一切の責任を負いません。
                </Text>
              </section>

              <section>
                <Text fw={700} size="md" mb="xs">
                  第6条（規約の変更）
                </Text>
                <Text size="sm" style={{ lineHeight: 1.8 }}>
                  運営者は、必要に応じて本規約を変更することがあります。重要な変更については、本サービス上での告知またはメールにて事前にお知らせします。変更後も本サービスを継続利用した場合、新しい規約に同意したものとみなします。
                </Text>
              </section>

              <section>
                <Text fw={700} size="md" mb="xs">
                  第7条（お問い合わせ）
                </Text>
                <Text size="sm" style={{ lineHeight: 1.8 }}>
                  本規約に関するお問い合わせは、サービス内のお問い合わせフォーム、またはサポートメールまでご連絡ください。
                </Text>
              </section>
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