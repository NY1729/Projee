export interface ProjectMember {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  role: string;
  status: "pending" | "approved" | "rejected";
  position: string | null;
}

export interface Project {
  visibility: "public" | "private";
  id: string;
  owner_id: string;
  created_at: string;
  title: string;
  status: string;
  icon: string;
  tags: string[] | null;
  progress: number; // projects テーブル（public）
  member_count: number;
  member_details: ProjectMember[] | null;
  // 以下は project_details から取得（承認済みメンバーのみ）
  description?: string | null;
  url?: string | null;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}
