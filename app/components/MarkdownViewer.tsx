"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Box, Alert, rem } from "@mantine/core";
import {
  IconInfoCircle,
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
} from "@tabler/icons-react";
import "github-markdown-css/github-markdown-light.css";

const ALERT_MAP = {
  note: { color: "blue", icon: <IconInfoCircle size={18} />, title: "Note" },
  tip: { color: "teal", icon: <IconCheck size={18} />, title: "Tip" },
  important: {
    color: "indigo",
    icon: <IconAlertCircle size={18} />,
    title: "Important",
  },
  warning: {
    color: "orange",
    icon: <IconAlertTriangle size={18} />,
    title: "Warning",
  },
  caution: {
    color: "red",
    icon: <IconAlertCircle size={18} />,
    title: "Caution",
  },
} as const;

type AlertType = keyof typeof ALERT_MAP;

const preprocessAlerts = (content: string): string => {
  return content.replace(
    /^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:^>.*\n?)*)/gm,
    (_, keyword, body) => {
      const type = keyword.toLowerCase();
      const cleanBody = body
        .split("\n")
        .map((line: string) => line.replace(/^>\s?/, ""))
        .join("\n")
        .trim();

      // <gh-alert>を完全に独立した要素として扱うために空行で囲む
      return `\n\n<gh-alert type="${type}">${cleanBody}</gh-alert>\n\n`;
    },
  );
};

export const MarkdownViewer = ({ content }: { content: string }) => {
  const processed = preprocessAlerts(content);

  return (
    <Box
      className="markdown-body"
      style={{
        backgroundColor: "transparent",
        fontSize: rem(14),
        lineHeight: "1.7",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          /**
           * 重要: pタグのレンダリングを完全にコントロールする
           * 子要素を再帰的にチェックし、gh-alert が含まれている場合は div に変換する
           */
          p: ({ children }) => {
            const hasAlert = React.Children.toArray(children).some(
              (child) =>
                React.isValidElement(child) &&
                (typeof child.type === "string"
                  ? child.type === "gh-alert"
                  : (child.type as React.ComponentType)?.displayName === "gh-alert" || (child.type as { name?: string })?.name === "gh-alert"),
            );

            if (hasAlert) {
              // pの代わりにdivを使うことで、Mantine Alert(div)を内包可能にする
              return <div style={{ marginBottom: "1em" }}>{children}</div>;
            }
            return <p>{children}</p>;
          },

          // @ts-expect-error: カスタムタグを Mantine の Alert にマッピング
          "gh-alert": ({
            type,
            children,
          }: {
            type: AlertType;
            children: React.ReactNode;
          }) => {
            const config = ALERT_MAP[type];
            if (!config) return <Box mb="md">{children}</Box>;

            return (
              <Alert
                variant="light"
                color={config.color}
                title={config.title}
                icon={config.icon}
                radius="md"
                mb="md"
                styles={{
                  root: {
                    padding: "12px 16px",
                    border: "none",
                    // github-markdown-css の blockquote スタイルが Alert に当たるのを防ぐ
                    boxSizing: "border-box",
                  },
                  title: {
                    fontWeight: 700,
                    fontSize: rem(13),
                    marginBottom: rem(4),
                  },
                  body: {
                    fontSize: rem(13),
                    color: "var(--mantine-color-text)",
                  },
                }}
              >
                {/* Alert内のchildren(Markdown)が再び <p> で包まれる可能性があるため、
                   CSS側で .markdown-body .mantine-Alert-body p { display: inline; } 
                   などを適用するか、ここでも p タグの挙動を調整する
                */}
                <div style={{ lineHeight: 1.6 }}>{children}</div>
              </Alert>
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </Box>
  );
};
