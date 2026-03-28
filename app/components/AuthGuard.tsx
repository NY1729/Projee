"use client";

import { useSyncExternalStore, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { Loader, Center } from "@mantine/core";

const PUBLIC_PATHS = ["/", "/terms", "/privacy"];

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // クライアント側の値
    () => false, // サーバー側の値
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // useEffect を使わずにマウント状態を判定（ESLint警告が出ない）
  const mounted = useIsMounted();

  const isPublicPage = useMemo(() => {
    if (!pathname) return false;
    const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    return PUBLIC_PATHS.includes(normalizedPath);
  }, [pathname]);

  useEffect(() => {
    if (!mounted || loading) return;
    if (!user && !isPublicPage) {
      router.replace("/");
    }
  }, [user, loading, isPublicPage, router, mounted]);

  // 2. マウント後のローディング表示
  if (loading) {
    return (
      <Center mih="100vh">
        <Loader color="dark" size="sm" />
      </Center>
    );
  }

  return user || isPublicPage ? <>{children}</> : null;
}
