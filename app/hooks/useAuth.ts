import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange は初回セッションも発火するので getSession は不要
    // INITIAL_SESSION イベントで loading を落とす
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false); // ← 元コードはここが抜けていた（ブランク画面の原因）
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};
