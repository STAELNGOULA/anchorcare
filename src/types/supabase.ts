export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "parent" | "business_admin" | "coach" | "admin";
          onboarding_status: "pending_link" | "program_setup" | "active";
          full_name: string | null;
          country: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: "parent" | "business_admin" | "coach" | "admin";
          onboarding_status?: "pending_link" | "program_setup" | "active";
          full_name?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "parent" | "business_admin" | "coach" | "admin";
          onboarding_status?: "pending_link" | "program_setup" | "active";
          full_name?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invites: {
        Row: {
          id: string;
          token: string;
          invite_type: "parent" | "coach";
          email: string | null;
          program_name: string;
          child_first_name: string | null;
          metadata: Json;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          token: string;
          invite_type?: "parent" | "coach";
          email?: string | null;
          program_name: string;
          child_first_name?: string | null;
          metadata?: Json;
          expires_at: string;
          used_at?: string | null;
          used_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          token?: string;
          invite_type?: "parent" | "coach";
          email?: string | null;
          program_name?: string;
          child_first_name?: string | null;
          metadata?: Json;
          expires_at?: string;
          used_at?: string | null;
          used_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      background_jobs: {
        Row: {
          id: string;
          type: string;
          status: string;
          payload: Json;
          idempotency_key: string | null;
          attempts: number;
          max_attempts: number;
          next_run_at: string;
          last_error: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          status?: string;
          payload?: Json;
          idempotency_key?: string | null;
          attempts?: number;
          max_attempts?: number;
          next_run_at?: string;
          last_error?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          status?: string;
          payload?: Json;
          idempotency_key?: string | null;
          attempts?: number;
          max_attempts?: number;
          next_run_at?: string;
          last_error?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "parent" | "business_admin" | "coach" | "admin";
      onboarding_status: "pending_link" | "program_setup" | "active";
      invite_type: "parent" | "coach";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type InviteRow = Database["public"]["Tables"]["invites"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
