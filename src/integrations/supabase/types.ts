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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          tenant_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agencies: {
        Row: {
          address: string | null
          color: string | null
          created_at: string
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
      client_financials: {
        Row: {
          available_cash: number
          client_id: string
          created_at: string
          debt_ratio: number
          id: string
          monthly_debts: number | null
          monthly_income: number
          mortgage_needed: boolean
          mortgage_preapproved: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          available_cash?: number
          client_id: string
          created_at?: string
          debt_ratio?: number
          id?: string
          monthly_debts?: number | null
          monthly_income?: number
          mortgage_needed?: boolean
          mortgage_preapproved?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          available_cash?: number
          client_id?: string
          created_at?: string
          debt_ratio?: number
          id?: string
          monthly_debts?: number | null
          monthly_income?: number
          mortgage_needed?: boolean
          mortgage_preapproved?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_financials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_financials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_preferences: {
        Row: {
          client_id: string
          created_at: string
          id: string
          max_price: number | null
          max_surface: number | null
          min_bathrooms: number | null
          min_bedrooms: number | null
          min_price: number | null
          min_surface: number | null
          neighborhood: string | null
          preferred_locations: string[] | null
          preferred_types: string[] | null
          required_extras: string[] | null
          selected_zones: string[] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          max_price?: number | null
          max_surface?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_price?: number | null
          min_surface?: number | null
          neighborhood?: string | null
          preferred_locations?: string[] | null
          preferred_types?: string[] | null
          required_extras?: string[] | null
          selected_zones?: string[] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          max_price?: number | null
          max_surface?: number | null
          min_bathrooms?: number | null
          min_bedrooms?: number | null
          min_price?: number | null
          min_surface?: number | null
          neighborhood?: string | null
          preferred_locations?: string[] | null
          preferred_types?: string[] | null
          required_extras?: string[] | null
          selected_zones?: string[] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_preferences_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_preferences_tenant_id_fkey"
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
          deleted_at: string | null
          email: string | null
          id: string
          last_contacted_at: string | null
          lead_status: string
          name: string
          notes: string | null
          operation_type: string
          phone: string | null
          property_ids: string[] | null
          registered_at: string
          source: string | null
          tenant_id: string | null
          type: string
        }
        Insert: {
          address?: string | null
          agency_id?: string | null
          category?: string | null
          contact_count?: number | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_status?: string
          name: string
          notes?: string | null
          operation_type?: string
          phone?: string | null
          property_ids?: string[] | null
          registered_at?: string
          source?: string | null
          tenant_id?: string | null
          type?: string
        }
        Update: {
          address?: string | null
          agency_id?: string | null
          category?: string | null
          contact_count?: number | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_status?: string
          name?: string
          notes?: string | null
          operation_type?: string
          phone?: string | null
          property_ids?: string[] | null
          registered_at?: string
          source?: string | null
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
          client_id: string | null
          deleted_at: string | null
          file: string | null
          id: string
          name: string
          property_id: string | null
          tenant_id: string | null
          type: string
          uploaded_at: string
        }
        Insert: {
          client_id?: string | null
          deleted_at?: string | null
          file?: string | null
          id?: string
          name: string
          property_id?: string | null
          tenant_id?: string | null
          type?: string
          uploaded_at?: string
        }
        Update: {
          client_id?: string | null
          deleted_at?: string | null
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
      entity_snapshots: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          snapshot: Json
          tenant_id: string
        }
        Insert: {
          action?: string
          changed_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          snapshot?: Json
          tenant_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          snapshot?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_number: string
          pdf_url: string | null
          period_end: string
          period_start: string
          plan: string
          status: string
          tenant_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          invoice_number: string
          pdf_url?: string | null
          period_end: string
          period_start: string
          plan?: string
          status?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_number?: string
          pdf_url?: string | null
          period_end?: string
          period_start?: string
          plan?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempts: number
          email: string
          id: string
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          email: string
          id?: string
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          email?: string
          id?: string
          locked_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      match_scores: {
        Row: {
          agency_id: string | null
          category: string
          client_id: string
          created_at: string
          financial_score: number
          id: string
          last_calculated_at: string
          property_id: string
          property_score: number
          score_details: Json | null
          tenant_id: string
          total_score: number
          updated_at: string
          viability_status: string
        }
        Insert: {
          agency_id?: string | null
          category?: string
          client_id: string
          created_at?: string
          financial_score?: number
          id?: string
          last_calculated_at?: string
          property_id: string
          property_score?: number
          score_details?: Json | null
          tenant_id: string
          total_score?: number
          updated_at?: string
          viability_status?: string
        }
        Update: {
          agency_id?: string | null
          category?: string
          client_id?: string
          created_at?: string
          financial_score?: number
          id?: string
          last_calculated_at?: string
          property_id?: string
          property_score?: number
          score_details?: Json | null
          tenant_id?: string
          total_score?: number
          updated_at?: string
          viability_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_scores_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scores_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_scores_tenant_id_fkey"
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
      portal_connections: {
        Row: {
          accepted_requirements: boolean
          api_key: string | null
          created_at: string
          feed_url: string | null
          id: string
          is_active: boolean
          max_ads: number
          portal_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          accepted_requirements?: boolean
          api_key?: string | null
          created_at?: string
          feed_url?: string | null
          id?: string
          is_active?: boolean
          max_ads?: number
          portal_name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          accepted_requirements?: boolean
          api_key?: string | null
          created_at?: string
          feed_url?: string | null
          id?: string
          is_active?: boolean
          max_ads?: number
          portal_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_connections_tenant_id_fkey"
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
          onboarding_completed: boolean
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          must_change_password?: boolean
          onboarding_completed?: boolean
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          must_change_password?: boolean
          onboarding_completed?: boolean
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
          accepts_pets: boolean
          address: string | null
          agency_id: string | null
          agent_id: string | null
          bathrooms: number | null
          bedrooms: number | null
          built_surface: number | null
          category: string | null
          community_fees: number | null
          condition: string | null
          contact_name: string | null
          contact_notes: string | null
          contact_phone: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          energy_cert: string | null
          floor: number | null
          has_air_conditioning: boolean | null
          has_elevator: boolean | null
          has_garage: boolean | null
          has_pool: boolean | null
          has_terrace: boolean | null
          ibi_annual: number | null
          id: string
          interested_client_ids: string[] | null
          latitude: number | null
          listing_type: string
          longitude: number | null
          monthly_rent: number | null
          ne_end_date: string | null
          ne_start_date: string | null
          neighborhood: string | null
          operation_type: string
          photos: string[] | null
          plot_surface: number | null
          postal_code: string | null
          price: number | null
          published_at: string | null
          status: string
          surface: number | null
          tenant_id: string | null
          title: string
          type: string
          unavailable_reason: string | null
        }
        Insert: {
          accepts_pets?: boolean
          address?: string | null
          agency_id?: string | null
          agent_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          built_surface?: number | null
          category?: string | null
          community_fees?: number | null
          condition?: string | null
          contact_name?: string | null
          contact_notes?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          energy_cert?: string | null
          floor?: number | null
          has_air_conditioning?: boolean | null
          has_elevator?: boolean | null
          has_garage?: boolean | null
          has_pool?: boolean | null
          has_terrace?: boolean | null
          ibi_annual?: number | null
          id?: string
          interested_client_ids?: string[] | null
          latitude?: number | null
          listing_type?: string
          longitude?: number | null
          monthly_rent?: number | null
          ne_end_date?: string | null
          ne_start_date?: string | null
          neighborhood?: string | null
          operation_type?: string
          photos?: string[] | null
          plot_surface?: number | null
          postal_code?: string | null
          price?: number | null
          published_at?: string | null
          status?: string
          surface?: number | null
          tenant_id?: string | null
          title: string
          type?: string
          unavailable_reason?: string | null
        }
        Update: {
          accepts_pets?: boolean
          address?: string | null
          agency_id?: string | null
          agent_id?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          built_surface?: number | null
          category?: string | null
          community_fees?: number | null
          condition?: string | null
          contact_name?: string | null
          contact_notes?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          energy_cert?: string | null
          floor?: number | null
          has_air_conditioning?: boolean | null
          has_elevator?: boolean | null
          has_garage?: boolean | null
          has_pool?: boolean | null
          has_terrace?: boolean | null
          ibi_annual?: number | null
          id?: string
          interested_client_ids?: string[] | null
          latitude?: number | null
          listing_type?: string
          longitude?: number | null
          monthly_rent?: number | null
          ne_end_date?: string | null
          ne_start_date?: string | null
          neighborhood?: string | null
          operation_type?: string
          photos?: string[] | null
          plot_surface?: number | null
          postal_code?: string | null
          price?: number | null
          published_at?: string | null
          status?: string
          surface?: number | null
          tenant_id?: string | null
          title?: string
          type?: string
          unavailable_reason?: string | null
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
      property_portal_status: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          portal_name: string
          property_id: string
          published_at: string | null
          tenant_id: string
          updated_at: string
          validation_errors: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          portal_name: string
          property_id: string
          published_at?: string | null
          tenant_id: string
          updated_at?: string
          validation_errors?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          portal_name?: string
          property_id?: string
          published_at?: string | null
          tenant_id?: string
          updated_at?: string
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "property_portal_status_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_portal_status_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
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
          deleted_at: string | null
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
          deleted_at?: string | null
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
          deleted_at?: string | null
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
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          permissions: string[] | null
          phone: string | null
          property_ids: string[] | null
          role: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          access_type?: string
          agency_id?: string | null
          avatar?: string | null
          client_ids?: string[] | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          permissions?: string[] | null
          phone?: string | null
          property_ids?: string[] | null
          role?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          agency_id?: string | null
          avatar?: string | null
          client_ids?: string[] | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          permissions?: string[] | null
          phone?: string | null
          property_ids?: string[] | null
          role?: string
          tenant_id?: string | null
          user_id?: string | null
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
      tenant_api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          last_used_at: string | null
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          last_used_at?: string | null
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          last_used_at?: string | null
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_api_keys_tenant_id_fkey"
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
          custom_domain: string | null
          deleted_at: string | null
          domain_verification_token: string | null
          domain_verified: boolean
          id: string
          is_active: boolean
          is_demo: boolean
          name: string
          plan: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          deleted_at?: string | null
          domain_verification_token?: string | null
          domain_verified?: boolean
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name: string
          plan?: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          deleted_at?: string | null
          domain_verification_token?: string | null
          domain_verified?: boolean
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name?: string
          plan?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_tenant_by_domain: {
        Args: { _host: string }
        Returns: {
          custom_domain: string
          domain_verified: boolean
          id: string
          is_active: boolean
          name: string
          slug: string
        }[]
      }
      get_user_agency_id: { Args: never; Returns: string }
      get_user_role_in_tenant: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_tenant_id: { Args: never; Returns: string }
      has_module_access: {
        Args: { _action: string; _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_admin: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      log_activity: {
        Args: {
          _action: string
          _entity_id?: string
          _entity_type: string
          _metadata?: Json
          _tenant_id: string
          _user_id: string
        }
        Returns: undefined
      }
      seed_default_role_permissions: {
        Args: { _tenant_id: string }
        Returns: undefined
      }
      soft_delete_client: {
        Args: { _id: string }
        Returns: {
          address: string | null
          agency_id: string | null
          category: string | null
          contact_count: number | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          last_contacted_at: string | null
          lead_status: string
          name: string
          notes: string | null
          operation_type: string
          phone: string | null
          property_ids: string[] | null
          registered_at: string
          source: string | null
          tenant_id: string | null
          type: string
        }
        SetofOptions: {
          from: "*"
          to: "clients"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      soft_delete_property: {
        Args: { _id: string }
        Returns: {
          accepts_pets: boolean
          address: string | null
          agency_id: string | null
          agent_id: string | null
          bathrooms: number | null
          bedrooms: number | null
          built_surface: number | null
          category: string | null
          community_fees: number | null
          condition: string | null
          contact_name: string | null
          contact_notes: string | null
          contact_phone: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          energy_cert: string | null
          floor: number | null
          has_air_conditioning: boolean | null
          has_elevator: boolean | null
          has_garage: boolean | null
          has_pool: boolean | null
          has_terrace: boolean | null
          ibi_annual: number | null
          id: string
          interested_client_ids: string[] | null
          latitude: number | null
          listing_type: string
          longitude: number | null
          monthly_rent: number | null
          ne_end_date: string | null
          ne_start_date: string | null
          neighborhood: string | null
          operation_type: string
          photos: string[] | null
          plot_surface: number | null
          postal_code: string | null
          price: number | null
          published_at: string | null
          status: string
          surface: number | null
          tenant_id: string | null
          title: string
          type: string
          unavailable_reason: string | null
        }
        SetofOptions: {
          from: "*"
          to: "properties"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "agent"
        | "viewer"
        | "super_admin"
        | "socio"
        | "coordinadora"
        | "asesor"
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
      app_role: [
        "admin",
        "agent",
        "viewer",
        "super_admin",
        "socio",
        "coordinadora",
        "asesor",
      ],
    },
  },
} as const
