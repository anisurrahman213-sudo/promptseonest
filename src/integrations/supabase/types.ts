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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      custom_events: {
        Row: {
          created_at: string
          date: number
          description: string | null
          event_type: string
          id: string
          month: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: number
          description?: string | null
          event_type?: string
          id?: string
          month: number
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: number
          description?: string | null
          event_type?: string
          id?: string
          month?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_cards: {
        Row: {
          created_at: string
          description: string
          display_order: number
          icon_name: string
          id: string
          image_url: string | null
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          icon_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          icon_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          created_at: string
          description: string
          id: string
          image_name: string
          image_url: string
          prompt: string
          tags: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_name: string
          image_url: string
          prompt: string
          tags: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_name?: string
          image_url?: string
          prompt?: string
          tags?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_count: number
          created_at: string
          email: string
          id: string
          ip_address: string | null
          last_attempt_at: string
          locked_until: string | null
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          last_attempt_at?: string
          locked_until?: string | null
        }
        Update: {
          attempt_count?: number
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          last_attempt_at?: string
          locked_until?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string
          email_sent: boolean | null
          id: string
          notification_type: string
          push_sent: boolean | null
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sent?: boolean | null
          id?: string
          notification_type: string
          push_sent?: boolean | null
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_sent?: boolean | null
          id?: string
          notification_type?: string
          push_sent?: boolean | null
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payment_method: string
          plan_name: string
          screenshot_url: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_method?: string
          plan_name: string
          screenshot_url?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          plan_name?: string
          screenshot_url?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          created_at: string
          credits: string
          credits_amount: number
          description: string
          features: string[]
          id: string
          is_active: boolean
          is_free: boolean
          is_popular: boolean
          is_unlimited: boolean
          name: string
          period: string | null
          price_bdt: number
          price_usd: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits: string
          credits_amount?: number
          description: string
          features?: string[]
          id?: string
          is_active?: boolean
          is_free?: boolean
          is_popular?: boolean
          is_unlimited?: boolean
          name: string
          period?: string | null
          price_bdt?: number
          price_usd?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: string
          credits_amount?: number
          description?: string
          features?: string[]
          id?: string
          is_active?: boolean
          is_free?: boolean
          is_popular?: boolean
          is_unlimited?: boolean
          name?: string
          period?: string | null
          price_bdt?: number
          price_usd?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          credits: number
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_user_view: {
        Row: {
          created_at: string | null
          credits: number | null
          email: string | null
          full_name: string | null
          id: string | null
          phone_number: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits?: number | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          phone_number?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          phone_number?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credits: {
        Args: { p_credits: number; p_user_id: string }
        Returns: boolean
      }
      deduct_credit: { Args: { p_user_id: string }; Returns: boolean }
      get_lock_remaining_seconds: { Args: { p_email: string }; Returns: number }
      get_user_email: { Args: { user_uuid: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_account_locked: { Args: { p_email: string }; Returns: boolean }
      sync_user_emails: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
