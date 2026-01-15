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
      appraisal_responses: {
        Row: {
          analyzes_change_score: number | null
          approachable_score: number | null
          confidence_integrity_score: number | null
          continue_doing: string | null
          created_at: string | null
          cultural_fit_comments: string | null
          effective_direction_score: number | null
          empowers_team_score: number | null
          establishes_rapport_score: number | null
          final_say_score: number | null
          flat_collaborative_score: number | null
          id: string
          manager_name: string
          mentors_coaches_score: number | null
          open_to_ideas_score: number | null
          patient_humble_score: number | null
          relationship: string | null
          response_number: number | null
          results_orientation_comments: string | null
          sense_of_urgency_score: number | null
          sets_clear_goals_score: number | null
          start_doing: string | null
          stop_doing: string | null
          team_leadership_comments: string | null
          timestamp: string | null
        }
        Insert: {
          analyzes_change_score?: number | null
          approachable_score?: number | null
          confidence_integrity_score?: number | null
          continue_doing?: string | null
          created_at?: string | null
          cultural_fit_comments?: string | null
          effective_direction_score?: number | null
          empowers_team_score?: number | null
          establishes_rapport_score?: number | null
          final_say_score?: number | null
          flat_collaborative_score?: number | null
          id?: string
          manager_name: string
          mentors_coaches_score?: number | null
          open_to_ideas_score?: number | null
          patient_humble_score?: number | null
          relationship?: string | null
          response_number?: number | null
          results_orientation_comments?: string | null
          sense_of_urgency_score?: number | null
          sets_clear_goals_score?: number | null
          start_doing?: string | null
          stop_doing?: string | null
          team_leadership_comments?: string | null
          timestamp?: string | null
        }
        Update: {
          analyzes_change_score?: number | null
          approachable_score?: number | null
          confidence_integrity_score?: number | null
          continue_doing?: string | null
          created_at?: string | null
          cultural_fit_comments?: string | null
          effective_direction_score?: number | null
          empowers_team_score?: number | null
          establishes_rapport_score?: number | null
          final_say_score?: number | null
          flat_collaborative_score?: number | null
          id?: string
          manager_name?: string
          mentors_coaches_score?: number | null
          open_to_ideas_score?: number | null
          patient_humble_score?: number | null
          relationship?: string | null
          response_number?: number | null
          results_orientation_comments?: string | null
          sense_of_urgency_score?: number | null
          sets_clear_goals_score?: number | null
          start_doing?: string | null
          stop_doing?: string | null
          team_leadership_comments?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      manager_summaries: {
        Row: {
          avg_cultural_fit: number | null
          avg_results_orientation: number | null
          avg_team_leadership: number | null
          created_at: string | null
          id: string
          manager_name: string
          overall_score: number | null
          total_responses: number | null
          updated_at: string | null
        }
        Insert: {
          avg_cultural_fit?: number | null
          avg_results_orientation?: number | null
          avg_team_leadership?: number | null
          created_at?: string | null
          id?: string
          manager_name: string
          overall_score?: number | null
          total_responses?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_cultural_fit?: number | null
          avg_results_orientation?: number | null
          avg_team_leadership?: number | null
          created_at?: string | null
          id?: string
          manager_name?: string
          overall_score?: number | null
          total_responses?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
