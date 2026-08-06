export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      auth_audit_log: {
        Row: {
          created_at: string
          email: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          attempt_count: number
          bucket_key: string
          locked_until: string | null
          updated_at: string
          window_started_at: string
        }
        Insert: {
          attempt_count?: number
          bucket_key: string
          locked_until?: string | null
          updated_at?: string
          window_started_at?: string
        }
        Update: {
          attempt_count?: number
          bucket_key?: string
          locked_until?: string | null
          updated_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
      authorized_pickups: {
        Row: {
          child_id: string
          created_at: string
          id: string
          name: string
          parent_id: string
          phone: string
          photo_url: string | null
          relation: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          name: string
          parent_id: string
          phone: string
          photo_url?: string | null
          relation: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string
          phone?: string
          photo_url?: string | null
          relation?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "authorized_pickups_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      background_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          id: string
          idempotency_key: string | null
          last_error: string | null
          max_attempts: number
          next_run_at: string
          payload: Json
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          max_attempts?: number
          next_run_at?: string
          payload?: Json
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          max_attempts?: number
          next_run_at?: string
          payload?: Json
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      child_emergency_contacts: {
        Row: {
          child_id: string
          created_at: string
          id: string
          name: string
          parent_id: string
          phone: string
          relation: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          name: string
          parent_id: string
          phone: string
          relation: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          name?: string
          parent_id?: string
          phone?: string
          relation?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_emergency_contacts_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_guardian_invites: {
        Row: {
          accepted_at: string | null
          child_id: string
          created_at: string
          expires_at: string
          guardian_user_id: string | null
          id: string
          invite_email: string
          permission: Database["public"]["Enums"]["guardian_permission"]
          primary_parent_id: string
          status: Database["public"]["Enums"]["guardian_invite_status"]
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          child_id: string
          created_at?: string
          expires_at: string
          guardian_user_id?: string | null
          id?: string
          invite_email: string
          permission?: Database["public"]["Enums"]["guardian_permission"]
          primary_parent_id: string
          status?: Database["public"]["Enums"]["guardian_invite_status"]
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          child_id?: string
          created_at?: string
          expires_at?: string
          guardian_user_id?: string | null
          id?: string
          invite_email?: string
          permission?: Database["public"]["Enums"]["guardian_permission"]
          primary_parent_id?: string
          status?: Database["public"]["Enums"]["guardian_invite_status"]
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_guardian_invites_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_guardians: {
        Row: {
          child_id: string
          created_at: string
          guardian_user_id: string
          id: string
          invited_by: string
          permission: Database["public"]["Enums"]["guardian_permission"]
        }
        Insert: {
          child_id: string
          created_at?: string
          guardian_user_id: string
          id?: string
          invited_by: string
          permission?: Database["public"]["Enums"]["guardian_permission"]
        }
        Update: {
          child_id?: string
          created_at?: string
          guardian_user_id?: string
          id?: string
          invited_by?: string
          permission?: Database["public"]["Enums"]["guardian_permission"]
        }
        Relationships: [
          {
            foreignKeyName: "child_guardians_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_medications: {
        Row: {
          child_id: string
          created_at: string
          dose: string
          id: string
          name: string
          parent_id: string
          schedule: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          dose?: string
          id?: string
          name: string
          parent_id: string
          schedule?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          dose?: string
          id?: string
          name?: string
          parent_id?: string
          schedule?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_medications_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          allergies: string | null
          allergy_items: Json
          created_at: string
          date_of_birth: string | null
          first_name: string
          id: string
          insurance_info: string | null
          last_name: string
          medical_conditions: string | null
          medications: Json
          parent_id: string
          photo_url: string | null
          physician_name: string | null
          physician_phone: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          allergy_items?: Json
          created_at?: string
          date_of_birth?: string | null
          first_name: string
          id?: string
          insurance_info?: string | null
          last_name?: string
          medical_conditions?: string | null
          medications?: Json
          parent_id: string
          photo_url?: string | null
          physician_name?: string | null
          physician_phone?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          allergy_items?: Json
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id?: string
          insurance_info?: string | null
          last_name?: string
          medical_conditions?: string | null
          medications?: Json
          parent_id?: string
          photo_url?: string | null
          physician_name?: string | null
          physician_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      clearance_shares: {
        Row: {
          child_id: string
          conditions: string | null
          created_at: string
          expires_at: string | null
          id: string
          incident_id: string | null
          org_id: string
          parent_id: string
          program_id: string
          registration_id: string
          revoked_at: string | null
          share_status: string
          shared_at: string
          summary: string
        }
        Insert: {
          child_id: string
          conditions?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          incident_id?: string | null
          org_id: string
          parent_id: string
          program_id: string
          registration_id: string
          revoked_at?: string | null
          share_status: string
          shared_at?: string
          summary: string
        }
        Update: {
          child_id?: string
          conditions?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          incident_id?: string | null
          org_id?: string
          parent_id?: string
          program_id?: string
          registration_id?: string
          revoked_at?: string | null
          share_status?: string
          shared_at?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "clearance_shares_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clearance_shares_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clearance_shares_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clearance_shares_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clearance_shares_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clearance_shares_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "program_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clearance_shares_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "roster_entries"
            referencedColumns: ["registration_id"]
          },
        ]
      }
      coach_digest_preferences: {
        Row: {
          coach_id: string
          enabled: boolean
          updated_at: string
        }
        Insert: {
          coach_id: string
          enabled?: boolean
          updated_at?: string
        }
        Update: {
          coach_id?: string
          enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      compliance_exports: {
        Row: {
          created_at: string
          end_date: string
          expires_at: string | null
          format: string
          id: string
          last_error: string | null
          org_id: string
          requested_by: string
          start_date: string
          status: string
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          expires_at?: string | null
          format: string
          id?: string
          last_error?: string | null
          org_id: string
          requested_by: string
          start_date: string
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          expires_at?: string | null
          format?: string
          id?: string
          last_error?: string | null
          org_id?: string
          requested_by?: string
          start_date?: string
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_exports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_exports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          audio_duration_ms: number | null
          audio_mime_type: string | null
          audio_path: string | null
          created_at: string
          id: string
          org_id: string
          program_id: string
          publish_idempotency_key: string | null
          published_at: string | null
          published_by: string | null
          recorded_by: string
          report_date: string
          scope: string
          status: string
          transcript: string | null
          updated_at: string
          upload_error: string | null
          upload_status: string
        }
        Insert: {
          audio_duration_ms?: number | null
          audio_mime_type?: string | null
          audio_path?: string | null
          created_at?: string
          id?: string
          org_id: string
          program_id: string
          publish_idempotency_key?: string | null
          published_at?: string | null
          published_by?: string | null
          recorded_by: string
          report_date?: string
          scope?: string
          status?: string
          transcript?: string | null
          updated_at?: string
          upload_error?: string | null
          upload_status?: string
        }
        Update: {
          audio_duration_ms?: number | null
          audio_mime_type?: string | null
          audio_path?: string | null
          created_at?: string
          id?: string
          org_id?: string
          program_id?: string
          publish_idempotency_key?: string | null
          published_at?: string | null
          published_by?: string | null
          recorded_by?: string
          report_date?: string
          scope?: string
          status?: string
          transcript?: string | null
          updated_at?: string
          upload_error?: string | null
          upload_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      digest_send_log: {
        Row: {
          digest_type: string
          id: string
          period_key: string
          recipient_id: string
          sent_at: string
        }
        Insert: {
          digest_type: string
          id?: string
          period_key: string
          recipient_id: string
          sent_at?: string
        }
        Update: {
          digest_type?: string
          id?: string
          period_key?: string
          recipient_id?: string
          sent_at?: string
        }
        Relationships: []
      }
      doctor_audit_log: {
        Row: {
          action: string
          admin_id: string
          after_state: Json
          before_state: Json | null
          created_at: string
          doctor_id: string | null
          id: string
        }
        Insert: {
          action: string
          admin_id: string
          after_state?: Json
          before_state?: Json | null
          created_at?: string
          doctor_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string
          after_state?: Json
          before_state?: Json | null
          created_at?: string
          doctor_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_audit_log_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          bio: string | null
          booking_url: string
          country: string
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          is_active: boolean
          is_featured: boolean
          languages: string[]
          photo_url: string | null
          region: string | null
          sort_order: number
          specialty: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bio?: string | null
          booking_url: string
          country: string
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          languages?: string[]
          photo_url?: string | null
          region?: string | null
          sort_order?: number
          specialty: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bio?: string | null
          booking_url?: string
          country?: string
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          languages?: string[]
          photo_url?: string | null
          region?: string | null
          sort_order?: number
          specialty?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      emergency_program_consents: {
        Row: {
          child_id: string
          org_id: string
          parent_id: string
          program_id: string
          registration_id: string
          share_allergies: boolean
          share_contacts: boolean
          share_meds: boolean
          share_photos: boolean
          updated_at: string
        }
        Insert: {
          child_id: string
          org_id: string
          parent_id: string
          program_id: string
          registration_id: string
          share_allergies?: boolean
          share_contacts?: boolean
          share_meds?: boolean
          share_photos?: boolean
          updated_at?: string
        }
        Update: {
          child_id?: string
          org_id?: string
          parent_id?: string
          program_id?: string
          registration_id?: string
          share_allergies?: boolean
          share_contacts?: boolean
          share_meds?: boolean
          share_photos?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_program_consents_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_program_consents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_program_consents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_program_consents_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_program_consents_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "program_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_program_consents_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "roster_entries"
            referencedColumns: ["registration_id"]
          },
        ]
      }
      handoff_notes: {
        Row: {
          author_id: string
          created_at: string
          id: string
          note: string
          org_id: string
          program_id: string
          shift_date: string
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          note: string
          org_id: string
          program_id: string
          shift_date: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          note?: string
          org_id?: string
          program_id?: string
          shift_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "handoff_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_notes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          incident_id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          incident_id: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          incident_id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "incident_audit_log_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_consult_messages: {
        Row: {
          body: string
          consult_id: string
          created_at: string
          id: string
          sender_id: string | null
          sender_role: string
        }
        Insert: {
          body: string
          consult_id: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role: string
        }
        Update: {
          body?: string
          consult_id?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_consult_messages_consult_id_fkey"
            columns: ["consult_id"]
            isOneToOne: false
            referencedRelation: "incident_consults"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_consults: {
        Row: {
          assigned_admin_id: string | null
          assigned_at: string | null
          care_plan_summary: string | null
          child_id: string
          clearance_conditions: string | null
          clearance_expires_at: string | null
          clearance_status: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          id: string
          incident_id: string | null
          initial_message: string
          org_id: string | null
          parent_id: string
          priority: Database["public"]["Enums"]["consult_priority"]
          program_id: string | null
          status: Database["public"]["Enums"]["consult_status"]
          updated_at: string
        }
        Insert: {
          assigned_admin_id?: string | null
          assigned_at?: string | null
          care_plan_summary?: string | null
          child_id: string
          clearance_conditions?: string | null
          clearance_expires_at?: string | null
          clearance_status?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          incident_id?: string | null
          initial_message: string
          org_id?: string | null
          parent_id: string
          priority?: Database["public"]["Enums"]["consult_priority"]
          program_id?: string | null
          status?: Database["public"]["Enums"]["consult_status"]
          updated_at?: string
        }
        Update: {
          assigned_admin_id?: string | null
          assigned_at?: string | null
          care_plan_summary?: string | null
          child_id?: string
          clearance_conditions?: string | null
          clearance_expires_at?: string | null
          clearance_status?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          incident_id?: string | null
          initial_message?: string
          org_id?: string | null
          parent_id?: string
          priority?: Database["public"]["Enums"]["consult_priority"]
          program_id?: string | null
          status?: Database["public"]["Enums"]["consult_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_consults_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_consults_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_consults_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_consults_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_consults_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_pdf_exports: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          incident_id: string
          last_error: string | null
          org_id: string
          requested_by: string
          status: string
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          incident_id: string
          last_error?: string | null
          org_id: string
          requested_by: string
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          incident_id?: string
          last_error?: string | null
          org_id?: string
          requested_by?: string
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_pdf_exports_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_pdf_exports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_pdf_exports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_photos: {
        Row: {
          created_at: string
          id: string
          incident_id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          incident_id: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          incident_id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_photos_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          action_taken: string | null
          body_area: string | null
          child_id: string
          created_at: string
          id: string
          incident_type: string
          is_red_flag: boolean
          location: string | null
          mechanism: string | null
          metadata: Json
          notification_priority: string
          notification_staged_at: string | null
          occurred_at: string
          org_id: string
          pain_level: number | null
          parent_notified_at: string | null
          program_id: string
          reported_by: string
          severity: string
          status: string
          symptoms: string | null
          updated_at: string
          witnesses: Json
        }
        Insert: {
          action_taken?: string | null
          body_area?: string | null
          child_id: string
          created_at?: string
          id?: string
          incident_type: string
          is_red_flag?: boolean
          location?: string | null
          mechanism?: string | null
          metadata?: Json
          notification_priority?: string
          notification_staged_at?: string | null
          occurred_at: string
          org_id: string
          pain_level?: number | null
          parent_notified_at?: string | null
          program_id: string
          reported_by: string
          severity: string
          status?: string
          symptoms?: string | null
          updated_at?: string
          witnesses?: Json
        }
        Update: {
          action_taken?: string | null
          body_area?: string | null
          child_id?: string
          created_at?: string
          id?: string
          incident_type?: string
          is_red_flag?: boolean
          location?: string | null
          mechanism?: string | null
          metadata?: Json
          notification_priority?: string
          notification_staged_at?: string | null
          occurred_at?: string
          org_id?: string
          pain_level?: number | null
          parent_notified_at?: string | null
          program_id?: string
          reported_by?: string
          severity?: string
          status?: string
          symptoms?: string | null
          updated_at?: string
          witnesses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "incidents_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          child_first_name: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invite_type: Database["public"]["Enums"]["invite_type"]
          metadata: Json
          org_id: string | null
          program_id: string | null
          program_name: string
          token: string
          token_hash: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          child_first_name?: string | null
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          invite_type?: Database["public"]["Enums"]["invite_type"]
          metadata?: Json
          org_id?: string | null
          program_id?: string | null
          program_name: string
          token: string
          token_hash?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          child_first_name?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invite_type?: Database["public"]["Enums"]["invite_type"]
          metadata?: Json
          org_id?: string | null
          program_id?: string | null
          program_name?: string
          token?: string
          token_hash?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_cents: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_cents: number
          product_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_cents?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_orders: {
        Row: {
          created_at: string
          currency: string
          id: string
          org_id: string
          paid_at: string | null
          parent_id: string
          platform_fee_cents: number
          status: string
          stripe_checkout_session_id: string | null
          total_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          org_id: string
          paid_at?: string | null
          parent_id: string
          platform_fee_cents?: number
          status?: string
          stripe_checkout_session_id?: string | null
          total_cents: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          org_id?: string
          paid_at?: string | null
          parent_id?: string
          platform_fee_cents?: number
          status?: string
          stripe_checkout_session_id?: string | null
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_products: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string | null
          id: string
          image_path: string | null
          name: string
          org_id: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_path?: string | null
          name: string
          org_id: string
          price_cents: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_path?: string | null
          name?: string
          org_id?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          caption: string | null
          created_at: string
          daily_report_id: string
          exif_stripped: boolean
          file_size: number
          id: string
          mime_type: string
          org_id: string
          program_id: string
          published_at: string | null
          status: string
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          daily_report_id: string
          exif_stripped?: boolean
          file_size: number
          id?: string
          mime_type: string
          org_id: string
          program_id: string
          published_at?: string | null
          status?: string
          storage_path: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          daily_report_id?: string
          exif_stripped?: boolean
          file_size?: number
          id?: string
          mime_type?: string
          org_id?: string
          program_id?: string
          published_at?: string | null
          status?: string
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      media_child_tags: {
        Row: {
          child_id: string
          created_at: string
          id: string
          media_asset_id: string
          report_child_id: string | null
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          media_asset_id: string
          report_child_id?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          media_asset_id?: string
          report_child_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_child_tags_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_child_tags_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_child_tags_report_child_id_fkey"
            columns: ["report_child_id"]
            isOneToOne: false
            referencedRelation: "report_children"
            referencedColumns: ["id"]
          },
        ]
      }
      message_broadcasts: {
        Row: {
          body: string
          created_at: string
          id: string
          org_id: string
          program_id: string
          recipient_count: number
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          org_id: string
          program_id: string
          recipient_count?: number
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          org_id?: string
          program_id?: string
          recipient_count?: number
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_broadcasts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_broadcasts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_broadcasts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          child_id: string
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          org_id: string
          parent_id: string
          parent_last_read_at: string | null
          program_id: string
          registration_id: string | null
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          org_id: string
          parent_id: string
          parent_last_read_at?: string | null
          program_id: string
          registration_id?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          org_id?: string
          parent_id?: string
          parent_last_read_at?: string | null
          program_id?: string
          registration_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "program_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "roster_entries"
            referencedColumns: ["registration_id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          broadcast_id: string | null
          created_at: string
          id: string
          message_type: string
          sender_id: string | null
          sender_role: string
          thread_id: string
        }
        Insert: {
          body: string
          broadcast_id?: string | null
          created_at?: string
          id?: string
          message_type?: string
          sender_id?: string | null
          sender_role: string
          thread_id: string
        }
        Update: {
          body?: string
          broadcast_id?: string | null
          created_at?: string
          id?: string
          message_type?: string
          sender_id?: string | null
          sender_role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "message_broadcasts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      morning_health_checks: {
        Row: {
          check_date: string
          child_id: string
          created_at: string
          health_status: string
          id: string
          note: string | null
          org_id: string
          parent_id: string
          program_id: string | null
        }
        Insert: {
          check_date?: string
          child_id: string
          created_at?: string
          health_status: string
          id?: string
          note?: string | null
          org_id: string
          parent_id: string
          program_id?: string | null
        }
        Update: {
          check_date?: string
          child_id?: string
          created_at?: string
          health_status?: string
          id?: string
          note?: string | null
          org_id?: string
          parent_id?: string
          program_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "morning_health_checks_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "morning_health_checks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "morning_health_checks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "morning_health_checks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_digest_settings: {
        Row: {
          business_delivery_day: number
          business_enabled: boolean
          business_recipient_emails: Json
          coach_digest_enabled: boolean
          org_id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          business_delivery_day?: number
          business_enabled?: boolean
          business_recipient_emails?: Json
          coach_digest_enabled?: boolean
          org_id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          business_delivery_day?: number
          business_enabled?: boolean
          business_recipient_emails?: Json
          coach_digest_enabled?: boolean
          org_id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_digest_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_digest_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          deactivated_at: string | null
          id: string
          org_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          deactivated_at?: string | null
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          deactivated_at?: string | null
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          accreditations: Json
          address_line1: string
          brand_accent_color: string
          city: string
          country: string
          cover_image_url: string | null
          created_at: string
          director_title: string | null
          gallery_images: Json
          hours_json: Json
          id: string
          internal_notes: string | null
          jurisdiction_country: string
          jurisdiction_region: string
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          onboarding_completed_at: string | null
          org_type: Database["public"]["Enums"]["org_type"]
          postal_code: string
          public_description: string | null
          public_email: string | null
          public_headline: string | null
          public_page_enabled: boolean
          public_phone: string | null
          public_slug: string
          public_tagline: string | null
          referral_code: string | null
          region: string
          seo_description: string | null
          seo_title: string | null
          social_links: Json
          stripe_connect_account_id: string | null
          stripe_connect_onboarded_at: string | null
          suggested_headline: string | null
          trial_started_at: string | null
          updated_at: string
          verified_badge: boolean
          website: string | null
        }
        Insert: {
          accreditations?: Json
          address_line1: string
          brand_accent_color?: string
          city: string
          country: string
          cover_image_url?: string | null
          created_at?: string
          director_title?: string | null
          gallery_images?: Json
          hours_json?: Json
          id?: string
          internal_notes?: string | null
          jurisdiction_country: string
          jurisdiction_region: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          onboarding_completed_at?: string | null
          org_type: Database["public"]["Enums"]["org_type"]
          postal_code: string
          public_description?: string | null
          public_email?: string | null
          public_headline?: string | null
          public_page_enabled?: boolean
          public_phone?: string | null
          public_slug: string
          public_tagline?: string | null
          referral_code?: string | null
          region: string
          seo_description?: string | null
          seo_title?: string | null
          social_links?: Json
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded_at?: string | null
          suggested_headline?: string | null
          trial_started_at?: string | null
          updated_at?: string
          verified_badge?: boolean
          website?: string | null
        }
        Update: {
          accreditations?: Json
          address_line1?: string
          brand_accent_color?: string
          city?: string
          country?: string
          cover_image_url?: string | null
          created_at?: string
          director_title?: string | null
          gallery_images?: Json
          hours_json?: Json
          id?: string
          internal_notes?: string | null
          jurisdiction_country?: string
          jurisdiction_region?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          onboarding_completed_at?: string | null
          org_type?: Database["public"]["Enums"]["org_type"]
          postal_code?: string
          public_description?: string | null
          public_email?: string | null
          public_headline?: string | null
          public_page_enabled?: boolean
          public_phone?: string | null
          public_slug?: string
          public_tagline?: string | null
          referral_code?: string | null
          region?: string
          seo_description?: string | null
          seo_title?: string | null
          social_links?: Json
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded_at?: string | null
          suggested_headline?: string | null
          trial_started_at?: string | null
          updated_at?: string
          verified_badge?: boolean
          website?: string | null
        }
        Relationships: []
      }
      parent_engagement_events: {
        Row: {
          child_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          parent_id: string
          timeline_event_id: string | null
        }
        Insert: {
          child_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          parent_id: string
          timeline_event_id?: string | null
        }
        Update: {
          child_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          parent_id?: string
          timeline_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_engagement_events_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_engagement_events_timeline_event_id_fkey"
            columns: ["timeline_event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_forms: {
        Row: {
          child_id: string | null
          created_at: string
          expires_at: string | null
          file_mime: string | null
          file_path: string
          form_type: string
          id: string
          parent_id: string
          program_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          child_id?: string | null
          created_at?: string
          expires_at?: string | null
          file_mime?: string | null
          file_path: string
          form_type: string
          id?: string
          parent_id: string
          program_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          child_id?: string | null
          created_at?: string
          expires_at?: string | null
          file_mime?: string | null
          file_path?: string
          form_type?: string
          id?: string
          parent_id?: string
          program_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_forms_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_forms_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_notification_preferences: {
        Row: {
          email_digest_enabled: boolean
          parent_id: string
          push_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string
          quiet_hours_start: string
          sms_enabled: boolean
          timezone: string
          updated_at: string
        }
        Insert: {
          email_digest_enabled?: boolean
          parent_id: string
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          sms_enabled?: boolean
          timezone?: string
          updated_at?: string
        }
        Update: {
          email_digest_enabled?: boolean
          parent_id?: string
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          sms_enabled?: boolean
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      pickup_eta_events: {
        Row: {
          canceled_at: string | null
          child_id: string
          created_at: string
          expected_at: string
          id: string
          minutes_late: number
          note: string | null
          org_id: string | null
          parent_id: string
          program_id: string | null
          updated_at: string
          valid_date: string
        }
        Insert: {
          canceled_at?: string | null
          child_id: string
          created_at?: string
          expected_at: string
          id?: string
          minutes_late: number
          note?: string | null
          org_id?: string | null
          parent_id: string
          program_id?: string | null
          updated_at?: string
          valid_date?: string
        }
        Update: {
          canceled_at?: string | null
          child_id?: string
          created_at?: string
          expected_at?: string
          id?: string
          minutes_late?: number
          note?: string | null
          org_id?: string | null
          parent_id?: string
          program_id?: string | null
          updated_at?: string
          valid_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_eta_events_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_eta_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_eta_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_eta_events_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_overrides: {
        Row: {
          authorized_pickup_id: string | null
          child_id: string
          created_at: string
          expires_at: string
          id: string
          note: string | null
          parent_id: string
          person_name: string
          timezone: string
          until_time: string | null
          updated_at: string
          valid_date: string
        }
        Insert: {
          authorized_pickup_id?: string | null
          child_id: string
          created_at?: string
          expires_at: string
          id?: string
          note?: string | null
          parent_id: string
          person_name: string
          timezone?: string
          until_time?: string | null
          updated_at?: string
          valid_date: string
        }
        Update: {
          authorized_pickup_id?: string | null
          child_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          note?: string | null
          parent_id?: string
          person_name?: string
          timezone?: string
          until_time?: string | null
          updated_at?: string
          valid_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_overrides_authorized_pickup_id_fkey"
            columns: ["authorized_pickup_id"]
            isOneToOne: false
            referencedRelation: "authorized_pickups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_overrides_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          country: string | null
          created_at: string
          email_verified_at: string | null
          full_name: string | null
          id: string
          last_login_at: string | null
          last_today_visit_at: string | null
          onboarding_status: Database["public"]["Enums"]["onboarding_status"]
          org_id: string | null
          phone: string | null
          referral_code: string | null
          region: string | null
          role: Database["public"]["Enums"]["user_role"]
          signup_source: Database["public"]["Enums"]["signup_source"]
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          country?: string | null
          created_at?: string
          email_verified_at?: string | null
          full_name?: string | null
          id: string
          last_login_at?: string | null
          last_today_visit_at?: string | null
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          org_id?: string | null
          phone?: string | null
          referral_code?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signup_source?: Database["public"]["Enums"]["signup_source"]
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          country?: string | null
          created_at?: string
          email_verified_at?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          last_today_visit_at?: string | null
          onboarding_status?: Database["public"]["Enums"]["onboarding_status"]
          org_id?: string | null
          phone?: string | null
          referral_code?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          signup_source?: Database["public"]["Enums"]["signup_source"]
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      program_coaches: {
        Row: {
          created_at: string
          id: string
          org_id: string
          program_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          program_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          program_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_coaches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_coaches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_coaches_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_registrations: {
        Row: {
          amount_paid_cents: number | null
          approved_at: string | null
          approved_by: string | null
          child_id: string
          copy_health_profile: boolean
          created_at: string
          discount_cents: number
          health_snapshot: Json | null
          id: string
          installment_count: number | null
          installments_paid: number
          invite_id: string | null
          org_id: string
          paid_at: string | null
          parent_id: string
          payment_plan: string
          payment_status: string
          platform_fee_cents: number
          program_id: string
          promo_code_id: string | null
          refund_cents: number
          registration_source: string
          rejected_at: string | null
          rejection_reason: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          total_due_cents: number | null
          updated_at: string
          waiver_accepted_at: string | null
          waiver_guardian_name: string | null
        }
        Insert: {
          amount_paid_cents?: number | null
          approved_at?: string | null
          approved_by?: string | null
          child_id: string
          copy_health_profile?: boolean
          created_at?: string
          discount_cents?: number
          health_snapshot?: Json | null
          id?: string
          installment_count?: number | null
          installments_paid?: number
          invite_id?: string | null
          org_id: string
          paid_at?: string | null
          parent_id: string
          payment_plan?: string
          payment_status?: string
          platform_fee_cents?: number
          program_id: string
          promo_code_id?: string | null
          refund_cents?: number
          registration_source?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          total_due_cents?: number | null
          updated_at?: string
          waiver_accepted_at?: string | null
          waiver_guardian_name?: string | null
        }
        Update: {
          amount_paid_cents?: number | null
          approved_at?: string | null
          approved_by?: string | null
          child_id?: string
          copy_health_profile?: boolean
          created_at?: string
          discount_cents?: number
          health_snapshot?: Json | null
          id?: string
          installment_count?: number | null
          installments_paid?: number
          invite_id?: string | null
          org_id?: string
          paid_at?: string | null
          parent_id?: string
          payment_plan?: string
          payment_status?: string
          platform_fee_cents?: number
          program_id?: string
          promo_code_id?: string | null
          refund_cents?: number
          registration_source?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          total_due_cents?: number | null
          updated_at?: string
          waiver_accepted_at?: string | null
          waiver_guardian_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_registrations_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_registrations_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_registrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_registrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_registrations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_season_rollovers: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invites_sent: number
          new_program_id: string
          org_id: string
          source_program_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invites_sent?: number
          new_program_id: string
          org_id: string
          source_program_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invites_sent?: number
          new_program_id?: string
          org_id?: string
          source_program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_season_rollovers_new_program_id_fkey"
            columns: ["new_program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_season_rollovers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_season_rollovers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_season_rollovers_source_program_id_fkey"
            columns: ["source_program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          age_max: number | null
          age_min: number | null
          age_range_label: string | null
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          capacity: number | null
          created_at: string
          cta_label: string
          currency: string
          deposit_amount_cents: number | null
          end_date: string | null
          featured_on_page: boolean
          hero_image_url: string | null
          id: string
          installment_count: number | null
          internal_description: string | null
          name: string
          org_id: string
          price_amount_cents: number
          price_display: string | null
          price_note: string | null
          program_slug: string
          program_type: Database["public"]["Enums"]["program_kind"]
          public_description: string | null
          public_headline: string | null
          public_listing_enabled: boolean
          registration_closes_at: string | null
          registration_opens_at: string | null
          require_payment_before_approval: boolean
          schedule_summary: string | null
          sibling_discount_percent: number | null
          start_date: string | null
          status: string
          stripe_price_id: string | null
          updated_at: string
          waitlist_enabled: boolean
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          age_range_label?: string | null
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          capacity?: number | null
          created_at?: string
          cta_label?: string
          currency?: string
          deposit_amount_cents?: number | null
          end_date?: string | null
          featured_on_page?: boolean
          hero_image_url?: string | null
          id?: string
          installment_count?: number | null
          internal_description?: string | null
          name: string
          org_id: string
          price_amount_cents?: number
          price_display?: string | null
          price_note?: string | null
          program_slug: string
          program_type?: Database["public"]["Enums"]["program_kind"]
          public_description?: string | null
          public_headline?: string | null
          public_listing_enabled?: boolean
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          require_payment_before_approval?: boolean
          schedule_summary?: string | null
          sibling_discount_percent?: number | null
          start_date?: string | null
          status?: string
          stripe_price_id?: string | null
          updated_at?: string
          waitlist_enabled?: boolean
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          age_range_label?: string | null
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          capacity?: number | null
          created_at?: string
          cta_label?: string
          currency?: string
          deposit_amount_cents?: number | null
          end_date?: string | null
          featured_on_page?: boolean
          hero_image_url?: string | null
          id?: string
          installment_count?: number | null
          internal_description?: string | null
          name?: string
          org_id?: string
          price_amount_cents?: number
          price_display?: string | null
          price_note?: string | null
          program_slug?: string
          program_type?: Database["public"]["Enums"]["program_kind"]
          public_description?: string | null
          public_headline?: string | null
          public_listing_enabled?: boolean
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          require_payment_before_approval?: boolean
          schedule_summary?: string | null
          sibling_discount_percent?: number | null
          start_date?: string | null
          status?: string
          stripe_price_id?: string | null
          updated_at?: string
          waitlist_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "programs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_page_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          org_id: string
          program_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          org_id: string
          program_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          org_id?: string
          program_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_page_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_page_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_page_events_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_attributions: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          referrer_type: string
          reward_status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_id: string
          referrer_type: string
          reward_status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
          referrer_type?: string
          reward_status?: string
        }
        Relationships: []
      }
      registration_audit: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          registration_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          registration_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_audit_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "program_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_audit_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "roster_entries"
            referencedColumns: ["registration_id"]
          },
        ]
      }
      registration_payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          installment_number: number
          paid_at: string | null
          platform_fee_cents: number
          refund_cents: number
          refunded_at: string | null
          registration_id: string
          status: string
          stripe_checkout_session_id: string
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          installment_number?: number
          paid_at?: string | null
          platform_fee_cents?: number
          refund_cents?: number
          refunded_at?: string | null
          registration_id: string
          status: string
          stripe_checkout_session_id: string
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          installment_number?: number
          paid_at?: string | null
          platform_fee_cents?: number
          refund_cents?: number
          refunded_at?: string | null
          registration_id?: string
          status?: string
          stripe_checkout_session_id?: string
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "program_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "roster_entries"
            referencedColumns: ["registration_id"]
          },
        ]
      }
      registration_promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          org_id: string
          program_id: string | null
          sibling_only: boolean
          updated_at: string
          uses_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          org_id: string
          program_id?: string | null
          sibling_only?: boolean
          updated_at?: string
          uses_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          org_id?: string
          program_id?: string | null
          sibling_only?: boolean
          updated_at?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "registration_promo_codes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_promo_codes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_promo_codes_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_promo_redemptions: {
        Row: {
          created_at: string
          discount_cents: number
          id: string
          parent_id: string
          promo_code_id: string
          registration_id: string
        }
        Insert: {
          created_at?: string
          discount_cents: number
          id?: string
          parent_id: string
          promo_code_id: string
          registration_id: string
        }
        Update: {
          created_at?: string
          discount_cents?: number
          id?: string
          parent_id?: string
          promo_code_id?: string
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "registration_promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_promo_redemptions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "program_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_promo_redemptions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "roster_entries"
            referencedColumns: ["registration_id"]
          },
        ]
      }
      registration_waivers: {
        Row: {
          created_at: string
          guardian_name: string
          id: string
          parent_id: string
          pdf_storage_path: string | null
          registration_id: string
          signature_data: string
          signed_at: string
        }
        Insert: {
          created_at?: string
          guardian_name: string
          id?: string
          parent_id: string
          pdf_storage_path?: string | null
          registration_id: string
          signature_data: string
          signed_at?: string
        }
        Update: {
          created_at?: string
          guardian_name?: string
          id?: string
          parent_id?: string
          pdf_storage_path?: string | null
          registration_id?: string
          signature_data?: string
          signed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_waivers_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "program_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_waivers_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "roster_entries"
            referencedColumns: ["registration_id"]
          },
        ]
      }
      report_access_tokens: {
        Row: {
          child_id: string
          created_at: string
          daily_report_id: string
          expires_at: string
          id: string
          last_view_ip: string | null
          last_viewed_at: string | null
          max_views: number
          parent_id: string | null
          report_child_id: string
          revoked_at: string | null
          token_hash: string
          updated_at: string
          used_count: number
        }
        Insert: {
          child_id: string
          created_at?: string
          daily_report_id: string
          expires_at: string
          id?: string
          last_view_ip?: string | null
          last_viewed_at?: string | null
          max_views?: number
          parent_id?: string | null
          report_child_id: string
          revoked_at?: string | null
          token_hash: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          child_id?: string
          created_at?: string
          daily_report_id?: string
          expires_at?: string
          id?: string
          last_view_ip?: string | null
          last_viewed_at?: string | null
          max_views?: number
          parent_id?: string | null
          report_child_id?: string
          revoked_at?: string | null
          token_hash?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_access_tokens_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_access_tokens_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_access_tokens_report_child_id_fkey"
            columns: ["report_child_id"]
            isOneToOne: false
            referencedRelation: "report_children"
            referencedColumns: ["id"]
          },
        ]
      }
      report_children: {
        Row: {
          ai_draft_text: string | null
          child_id: string | null
          created_at: string
          daily_report_id: string
          draft_text: string | null
          id: string
          mentioned_name: string | null
          misassigned_flag: boolean
          photo_count: number
          published_text: string | null
          registration_id: string | null
          skipped_reason: string | null
          sort_order: number
          status: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          ai_draft_text?: string | null
          child_id?: string | null
          created_at?: string
          daily_report_id: string
          draft_text?: string | null
          id?: string
          mentioned_name?: string | null
          misassigned_flag?: boolean
          photo_count?: number
          published_text?: string | null
          registration_id?: string | null
          skipped_reason?: string | null
          sort_order?: number
          status?: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          ai_draft_text?: string | null
          child_id?: string | null
          created_at?: string
          daily_report_id?: string
          draft_text?: string | null
          id?: string
          mentioned_name?: string | null
          misassigned_flag?: boolean
          photo_count?: number
          published_text?: string | null
          registration_id?: string | null
          skipped_reason?: string | null
          sort_order?: number
          status?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_children_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_children_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_children_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "program_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_children_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "roster_entries"
            referencedColumns: ["registration_id"]
          },
        ]
      }
      roster_staff_notes: {
        Row: {
          clearance_override: string | null
          group_name: string | null
          org_id: string
          registration_id: string
          staff_notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          clearance_override?: string | null
          group_name?: string | null
          org_id: string
          registration_id: string
          staff_notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          clearance_override?: string | null
          group_name?: string | null
          org_id?: string
          registration_id?: string
          staff_notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roster_staff_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_staff_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_staff_notes_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "program_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_staff_notes_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: true
            referencedRelation: "roster_entries"
            referencedColumns: ["registration_id"]
          },
        ]
      }
      slug_disputes: {
        Row: {
          created_at: string
          created_by: string | null
          disputed_slug: string
          granted_slug: string | null
          holder_org_id: string | null
          id: string
          org_id: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["slug_dispute_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          disputed_slug: string
          granted_slug?: string | null
          holder_org_id?: string | null
          id?: string
          org_id: string
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["slug_dispute_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          disputed_slug?: string
          granted_slug?: string | null
          holder_org_id?: string | null
          id?: string
          org_id?: string
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["slug_dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slug_disputes_holder_org_id_fkey"
            columns: ["holder_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slug_disputes_holder_org_id_fkey"
            columns: ["holder_org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slug_disputes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slug_disputes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_inbound_log: {
        Row: {
          body: string
          created_at: string
          from_phone: string
          id: string
          parent_id: string | null
          status: string
          thread_id: string | null
          twilio_message_sid: string | null
        }
        Insert: {
          body: string
          created_at?: string
          from_phone: string
          id?: string
          parent_id?: string | null
          status?: string
          thread_id?: string | null
          twilio_message_sid?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          from_phone?: string
          id?: string
          parent_id?: string | null
          status?: string
          thread_id?: string | null
          twilio_message_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_inbound_log_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhook_events: {
        Row: {
          event_type: string
          id: string
          payload: Json | null
          processed_at: string
          stripe_event_id: string
        }
        Insert: {
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string
          stripe_event_id: string
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          org_id: string | null
          owner_type: string
          parent_id: string | null
          sku: Database["public"]["Enums"]["subscription_sku"]
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          org_id?: string | null
          owner_type: string
          parent_id?: string | null
          sku: Database["public"]["Enums"]["subscription_sku"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          org_id?: string | null
          owner_type?: string
          parent_id?: string | null
          sku?: Database["public"]["Enums"]["subscription_sku"]
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          child_id: string
          created_at: string
          created_by: string | null
          daily_report_id: string | null
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          org_id: string
          program_id: string | null
          report_child_id: string | null
          summary: string | null
          title: string
        }
        Insert: {
          child_id: string
          created_at?: string
          created_by?: string | null
          daily_report_id?: string | null
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          org_id: string
          program_id?: string | null
          report_child_id?: string | null
          summary?: string | null
          title: string
        }
        Update: {
          child_id?: string
          created_at?: string
          created_by?: string | null
          daily_report_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          org_id?: string
          program_id?: string | null
          report_child_id?: string | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_report_child_id_fkey"
            columns: ["report_child_id"]
            isOneToOne: false
            referencedRelation: "report_children"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_reports: {
        Row: {
          appointment_date: string
          child_id: string
          created_at: string
          doctor_id: string | null
          doctor_name: string
          id: string
          parent_id: string
          pdf_storage_path: string | null
          summary: string
          timeline_event_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          appointment_date: string
          child_id: string
          created_at?: string
          doctor_id?: string | null
          doctor_name: string
          id?: string
          parent_id: string
          pdf_storage_path?: string | null
          summary: string
          timeline_event_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          appointment_date?: string
          child_id?: string
          created_at?: string
          doctor_id?: string | null
          doctor_name?: string
          id?: string
          parent_id?: string
          pdf_storage_path?: string | null
          summary?: string
          timeline_event_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_reports_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_reports_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_reports_timeline_event_fk"
            columns: ["timeline_event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_org_profiles: {
        Row: {
          accreditations: Json | null
          address_line1: string | null
          brand_accent_color: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          gallery_images: Json | null
          hours_json: Json | null
          id: string | null
          logo_url: string | null
          name: string | null
          org_type: Database["public"]["Enums"]["org_type"] | null
          postal_code: string | null
          public_description: string | null
          public_email: string | null
          public_headline: string | null
          public_phone: string | null
          public_slug: string | null
          public_tagline: string | null
          region: string | null
          seo_description: string | null
          seo_title: string | null
          social_links: Json | null
          verified_badge: boolean | null
        }
        Insert: {
          accreditations?: Json | null
          address_line1?: string | null
          brand_accent_color?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          gallery_images?: Json | null
          hours_json?: Json | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          org_type?: Database["public"]["Enums"]["org_type"] | null
          postal_code?: string | null
          public_description?: string | null
          public_email?: string | null
          public_headline?: string | null
          public_phone?: string | null
          public_slug?: string | null
          public_tagline?: string | null
          region?: string | null
          seo_description?: string | null
          seo_title?: string | null
          social_links?: Json | null
          verified_badge?: boolean | null
        }
        Update: {
          accreditations?: Json | null
          address_line1?: string | null
          brand_accent_color?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          gallery_images?: Json | null
          hours_json?: Json | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          org_type?: Database["public"]["Enums"]["org_type"] | null
          postal_code?: string | null
          public_description?: string | null
          public_email?: string | null
          public_headline?: string | null
          public_phone?: string | null
          public_slug?: string | null
          public_tagline?: string | null
          region?: string | null
          seo_description?: string | null
          seo_title?: string | null
          social_links?: Json | null
          verified_badge?: boolean | null
        }
        Relationships: []
      }
      roster_entries: {
        Row: {
          allergies: string | null
          allergy_items: Json | null
          child_id: string | null
          clearance_override: string | null
          clearance_status: string | null
          date_of_birth: string | null
          enrolled_at: string | null
          first_name: string | null
          group_name: string | null
          insurance_info: string | null
          last_name: string | null
          medical_conditions: string | null
          medications: Json | null
          morning_health_note: string | null
          morning_health_status: string | null
          org_id: string | null
          parent_id: string | null
          photo_url: string | null
          physician_name: string | null
          physician_phone: string | null
          pickup_eta_active: boolean | null
          pickup_eta_expected_at: string | null
          pickup_eta_minutes: number | null
          pickup_eta_note: string | null
          pickup_override_expires_at: string | null
          pickup_override_name: string | null
          pickup_override_note: string | null
          pickup_override_today: boolean | null
          pickup_override_until: string | null
          program_id: string | null
          program_name: string | null
          program_slug: string | null
          registration_id: string | null
          registration_status: string | null
          staff_notes: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_registrations_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_registrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_registrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "public_org_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_registrations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_coach_invite: {
        Args: { p_token: string; p_user_id: string }
        Returns: string
      }
      accept_parent_invite: {
        Args: {
          p_child_id?: string
          p_copy_health_profile?: boolean
          p_new_child_dob?: string
          p_new_child_first_name?: string
          p_new_child_last_name?: string
          p_token: string
          p_user_id: string
        }
        Returns: string
      }
      approve_registration: {
        Args: { p_registration_id: string; p_user_id: string }
        Returns: string
      }
      bump_emergency_consents_for_child: {
        Args: { p_child_id: string }
        Returns: undefined
      }
      complete_business_onboarding: {
        Args: {
          p_address_line1: string
          p_city: string
          p_country: string
          p_director_name: string
          p_director_title: string
          p_jurisdiction_country: string
          p_jurisdiction_region: string
          p_org_name: string
          p_org_type: Database["public"]["Enums"]["org_type"]
          p_postal_code: string
          p_program_name?: string
          p_program_start_date?: string
          p_public_slug: string
          p_region: string
          p_suggested_headline: string
          p_user_id: string
        }
        Returns: string
      }
      complete_checkout_registration:
        | {
            Args: { p_amount_paid_cents: number; p_checkout_session_id: string }
            Returns: string
          }
        | {
            Args: {
              p_amount_paid_cents: number
              p_checkout_session_id: string
              p_discount_cents?: number
              p_installment_number?: number
              p_payment_plan?: string
              p_platform_fee_cents?: number
              p_promo_code_id?: string
              p_stripe_payment_intent_id?: string
              p_total_due_cents?: number
            }
            Returns: string
          }
      complete_marketplace_order: {
        Args: {
          p_amount_paid_cents: number
          p_checkout_session_id: string
          p_platform_fee_cents?: number
        }
        Returns: string
      }
      create_public_registration: {
        Args: {
          p_child_id?: string
          p_new_child_dob?: string
          p_new_child_first_name?: string
          p_new_child_last_name?: string
          p_program_id: string
          p_user_id: string
          p_waiver_guardian_name?: string
        }
        Returns: string
      }
      log_registration_audit: {
        Args: {
          p_action: string
          p_actor_id: string
          p_metadata?: Json
          p_registration_id: string
        }
        Returns: undefined
      }
      org_dashboard_stats: { Args: { p_org_id: string }; Returns: Json }
      org_revenue_stats: {
        Args: { p_days?: number; p_org_id: string }
        Returns: Json
      }
      record_registration_refund: {
        Args: {
          p_actor_id: string
          p_reason?: string
          p_refund_cents: number
          p_registration_id: string
          p_stripe_refund_id?: string
        }
        Returns: string
      }
      reject_registration: {
        Args: {
          p_reason?: string
          p_registration_id: string
          p_user_id: string
        }
        Returns: string
      }
      sign_registration_waiver: {
        Args: {
          p_guardian_name: string
          p_health_snapshot?: Json
          p_registration_id: string
          p_signature_data: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      account_status: "active" | "suspended"
      billing_interval: "one_time" | "monthly" | "season" | "weekly"
      consult_priority: "normal" | "high"
      consult_status: "pending" | "assigned" | "open" | "closed"
      guardian_invite_status: "pending" | "accepted" | "revoked" | "expired"
      guardian_permission: "view" | "full"
      invite_type: "parent" | "coach"
      onboarding_status: "pending_link" | "program_setup" | "active"
      org_member_role: "director" | "coach" | "staff"
      org_type:
        | "daycare"
        | "sports"
        | "camp"
        | "other"
        | "preschool"
        | "after_school"
        | "enrichment"
        | "arts"
        | "martial_arts"
        | "swim"
        | "community"
        | "faith"
        | "homeschool"
        | "therapy"
        | "nanny"
      program_kind:
        | "camp"
        | "class"
        | "team"
        | "daycare_room"
        | "after_school"
        | "other"
      signup_source: "organic" | "public_page" | "invite"
      slug_dispute_status: "open" | "resolved" | "rejected"
      subscription_sku: "parent_family" | "business_pro"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "unpaid"
      user_role: "parent" | "business_admin" | "coach" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "suspended"],
      billing_interval: ["one_time", "monthly", "season", "weekly"],
      consult_priority: ["normal", "high"],
      consult_status: ["pending", "assigned", "open", "closed"],
      guardian_invite_status: ["pending", "accepted", "revoked", "expired"],
      guardian_permission: ["view", "full"],
      invite_type: ["parent", "coach"],
      onboarding_status: ["pending_link", "program_setup", "active"],
      org_member_role: ["director", "coach", "staff"],
      org_type: [
        "daycare",
        "sports",
        "camp",
        "other",
        "preschool",
        "after_school",
        "enrichment",
        "arts",
        "martial_arts",
        "swim",
        "community",
        "faith",
        "homeschool",
        "therapy",
        "nanny",
      ],
      program_kind: [
        "camp",
        "class",
        "team",
        "daycare_room",
        "after_school",
        "other",
      ],
      signup_source: ["organic", "public_page", "invite"],
      slug_dispute_status: ["open", "resolved", "rejected"],
      subscription_sku: ["parent_family", "business_pro"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "unpaid",
      ],
      user_role: ["parent", "business_admin", "coach", "admin"],
    },
  },
} as const
