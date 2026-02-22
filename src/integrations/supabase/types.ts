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
      agencies: {
        Row: {
          address: string | null
          color: string | null
          created_at: string
          email: string | null
          id: string
          logo: string | null
          name: string
          phone: string | null
          tenant_id: string | null
        }
        Insert: {
          address?: string | null
          color?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo?: string | null
          name: string
          phone?: string | null
          tenant_id?: string | null
        }
        Update: {
          address?: string | null
          color?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo?: string | null
          name?: string
          phone?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agencies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_property_interests: {
        Row: {
          client_id: string
          created_at: string
          id: string
          interest_type: string
          property_id: string
          tenant_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          interest_type: string
          property_id: string
          tenant_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          interest_type?: string
          property_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_property_interests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_property_interests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_property_interests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          agency_id: string | null
          category: string | null
          contact_count: number | null
          created_at: string
          email: string | null
          id: string
          last_contacted_at: string | null
          lead_status: string
          name: string
          notes: string | null
          phone: string | null
          property_ids: string[] | null
          registered_at: string
          tenant_id: string | null
          type: string
        }
        Insert: {
          address?: string | null
          agency_id?: string | null
          category?: string | null
          contact_count?: number | null
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_status?: string
          name: string
          notes?: string | null
          phone?: string | null
          property_ids?: string[] | null
          registered_at?: string
          tenant_id?: string | null
          type?: string
        }
        Update: {
          address?: string | null
          agency_id?: string | null
          category?: string | null
          contact_count?: number | null
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_status?: string
          name?: string
          notes?: string | null
          phone?: string | null
          property_ids?: string[] | null
          registered_at?: string
          tenant_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_definitions: {
        Row: {
          created_at: string
          entity_type: string
          field_type: string
          filterable: boolean
          id: string
          key: string
          name: string
          options: Json | null
          position: number
          required: boolean
          tenant_id: string
          used_in_matching: boolean
          weight_in_matching: number
        }
        Insert: {
          created_at?: string
          entity_type: string
          field_type: string
          filterable?: boolean
          id?: string
          key: string
          name: string
          options?: Json | null
          position?: number
          required?: boolean
          tenant_id: string
          used_in_matching?: boolean
          weight_in_matching?: number
        }
        Update: {
          created_at?: string
          entity_type?: string
          field_type?: string
          filterable?: boolean
          id?: string
          key?: string
          name?: string
          options?: Json | null
          position?: number
          required?: boolean
          tenant_id?: string
          used_in_matching?: boolean
          weight_in_matching?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          created_at: string
          definition_id: string
          entity_id: string
          id: string
          tenant_id: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          definition_id: string
          entity_id: string
          id?: string
          tenant_id: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          definition_id?: string
          entity_id?: string
          id?: string
          tenant_id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          file: string | null
          id: string
          name: string
          property_id: string | null
          tenant_id: string | null
          type: string
          uploaded_at: string
        }
        Insert: {
          file?: string | null
          id?: string
          name: string
          property_id?: string | null
          tenant_id?: string | null
          type?: string
          uploaded_at?: string
        }
        Update: {
          file?: string | null
          id?: string
          name?: string
          property_id?: string | null
          tenant_id?: string | null
          type?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          agency_id: string | null
          agent_id: string | null
          client_id: string
          created_at: string
          deal_value: number
          expected_close_date: string | null
          id: string
          notes: string | null
          priority: string
          probability: number
          property_id: string | null
          stage_entered_at: string
          stage_id: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          agent_id?: string | null
          client_id: string
          created_at?: string
          deal_value?: number
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          probability?: number
          property_id?: string | null
          stage_entered_at?: string
          stage_id: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          agent_id?: string | null
          client_id?: string
          created_at?: string
          deal_value?: number
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          probability?: number
          property_id?: string | null
          stage_entered_at?: string
          stage_id?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          agency_id: string | null
          color: string
          created_at: string
          default_probability: number
          id: string
          is_active: boolean
          name: string
          position: number
          stage_type: string
          stale_days: number
          tenant_id: string
        }
        Insert: {
          agency_id?: string | null
          color?: string
          created_at?: string
          default_probability?: number
          id?: string
          is_active?: boolean
          name: string
          position?: number
          stage_type?: string
          stale_days?: number
          tenant_id: string
        }
        Update: {
          agency_id?: string | null
          color?: string
          created_at?: string
          default_probability?: number
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          stage_type?: string
          stale_days?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          must_change_password: boolean
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          must_change_password?: boolean
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          must_change_password?: boolean
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          agency_id: string | null
          agent_id: string | null
          bathrooms: number | null
          bedrooms: number | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          interested_client_ids: string[] | null
          photos: string[] | null
          price: number | null
          published_at: string | null
          status: string
          surface: number | null
          tenant_id: string | null
          title: string
          type: string
        }
        Insert: {
          address?: string | null
          agency_id?: string | null
          agent_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          interested_client_ids?: string[] | null
          photos?: string[] | null
          price?: number | null
          published_at?: string | null
          status?: string
          surface?: number | null
          tenant_id?: string | null
          title: string
          type?: string
        }
        Update: {
          address?: string | null
          agency_id?: string | null
          agent_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          interested_client_ids?: string[] | null
          photos?: string[] | null
          price?: number | null
          published_at?: string | null
          status?: string
          surface?: number | null
          tenant_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_history: {
        Row: {
          changed_by: string
          created_at: string
          days_in_previous_stage: number | null
          from_stage_id: string | null
          id: string
          opportunity_id: string
          tenant_id: string
          to_stage_id: string
        }
        Insert: {
          changed_by?: string
          created_at?: string
          days_in_previous_stage?: number | null
          from_stage_id?: string | null
          id?: string
          opportunity_id: string
          tenant_id: string
          to_stage_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          days_in_previous_stage?: number | null
          from_stage_id?: string | null
          id?: string
          opportunity_id?: string
          tenant_id?: string
          to_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          agency_id: string | null
          agent_id: string | null
          category: string | null
          client_id: string | null
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          priority: string
          property_id: string | null
          status: string
          tenant_id: string | null
          title: string
          type: string
        }
        Insert: {
          agency_id?: string | null
          agent_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          property_id?: string | null
          status?: string
          tenant_id?: string | null
          title: string
          type?: string
        }
        Update: {
          agency_id?: string | null
          agent_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          property_id?: string | null
          status?: string
          tenant_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          access_type: string
          agency_id: string | null
          avatar: string | null
          client_ids: string[] | null
          created_at: string
          email: string | null
          id: string
          name: string
          password: string | null
          permissions: string[] | null
          phone: string | null
          property_ids: string[] | null
          role: string
          tenant_id: string | null
        }
        Insert: {
          access_type?: string
          agency_id?: string | null
          avatar?: string | null
          client_ids?: string[] | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          password?: string | null
          permissions?: string[] | null
          phone?: string | null
          property_ids?: string[] | null
          role?: string
          tenant_id?: string | null
        }
        Update: {
          access_type?: string
          agency_id?: string | null
          avatar?: string | null
          client_ids?: string[] | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          password?: string | null
          permissions?: string[] | null
          phone?: string | null
          property_ids?: string[] | null
          role?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_demo: boolean
          name: string
          plan: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name: string
          plan?: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name?: string
          plan?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tenant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "viewer"
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
      app_role: ["admin", "agent", "viewer"],
    },
  },
} as const
