export interface Group {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  role: string;
  joined_at: string;
  profiles: {
    id: string;
    display_name: string | null;
    email: string;
  };
}

