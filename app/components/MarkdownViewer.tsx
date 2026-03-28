"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "github-markdown-css/github-markdown-light.css"; // ライトモード用
import { Box } from "@mantine/core";

export const MarkdownViewer = ({ content }: { content: string }) => {
  return (
    <Box
      className="markdown-body"
      style={{
        backgroundColor: "transparent",
        fontSize: "14px",
        lineHeight: "1.6",
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </Box>
  );
};
