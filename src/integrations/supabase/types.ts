export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      availability_slots: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          service_type: Database["public"]["Enums"]["service_type"]
          start_time: string
          talent_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          service_type: Database["public"]["Enums"]["service_type"]
          start_time: string
          talent_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          start_time?: string
          talent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_status: Database["public"]["Enums"]["booking_status"] | null
          companion_id: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          date: string
          date_plan: string | null
          duration: number
          id: string
          location: string | null
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          service_name: string
          service_type: Database["public"]["Enums"]["service_type"] | null
          time: string
          total_price: number
          transport_fee: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          companion_id?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone: string
          date: string
          date_plan?: string | null
          duration: number
          id?: string
          location?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          service_name: string
          service_type?: Database["public"]["Enums"]["service_type"] | null
          time: string
          total_price: number
          transport_fee?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_status?: Database["public"]["Enums"]["booking_status"] | null
          companion_id?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          date?: string
          date_plan?: string | null
          duration?: number
          id?: string
          location?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          service_name?: string
          service_type?: Database["public"]["Enums"]["service_type"] | null
          time?: string
          total_price?: number
          transport_fee?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rates: {
        Row: {
          commission_percentage: number
          created_at: string | null
          id: string
          talent_level: Database["public"]["Enums"]["talent_level"]
        }
        Insert: {
          commission_percentage: number
          created_at?: string | null
          id?: string
          talent_level: Database["public"]["Enums"]["talent_level"]
        }
        Update: {
          commission_percentage?: number
          created_at?: string | null
          id?: string
          talent_level?: Database["public"]["Enums"]["talent_level"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          bio: string | null
          city: string | null
          created_at: string | null
          email: string
          full_name: string | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          location: string | null
          love_language: string | null
          name: string
          party_buddy_eligible: boolean | null
          phone: string | null
          profile_data: Json | null
          profile_image: string | null
          rating: number | null
          status: Database["public"]["Enums"]["user_status"]
          talent_level: Database["public"]["Enums"]["talent_level"] | null
          total_bookings: number | null
          total_earnings: number | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
          verification_status: Database["public"]["Enums"]["verification_status"]
          zodiac: string | null
        }
        Insert: {
          age?: number | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          hourly_rate?: number | null
          id: string
          is_available?: boolean | null
          location?: string | null
          love_language?: string | null
          name: string
          party_buddy_eligible?: boolean | null
          phone?: string | null
          profile_data?: Json | null
          profile_image?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          talent_level?: Database["public"]["Enums"]["talent_level"] | null
          total_bookings?: number | null
          total_earnings?: number | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
          verification_status?: Database["public"]["Enums"]["verification_status"]
          zodiac?: string | null
        }
        Update: {
          age?: number | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          location?: string | null
          love_language?: string | null
          name?: string
          party_buddy_eligible?: boolean | null
          phone?: string | null
          profile_data?: Json | null
          profile_image?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["user_status"]
          talent_level?: Database["public"]["Enums"]["talent_level"] | null
          total_bookings?: number | null
          total_earnings?: number | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
          verification_status?: Database["public"]["Enums"]["verification_status"]
          zodiac?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          admin_notes: string | null
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          rating: number
          reviewee_id: string | null
          reviewer_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          rating: number
          reviewee_id?: string | null
          reviewer_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          rating?: number
          reviewee_id?: string | null
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_rates: {
        Row: {
          additional_rate: number | null
          base_rate: number
          created_at: string | null
          id: string
          service_type: Database["public"]["Enums"]["service_type"]
          unit: string
          updated_at: string | null
        }
        Insert: {
          additional_rate?: number | null
          base_rate: number
          created_at?: string | null
          id?: string
          service_type: Database["public"]["Enums"]["service_type"]
          unit: string
          updated_at?: string | null
        }
        Update: {
          additional_rate?: number | null
          base_rate?: number
          created_at?: string | null
          id?: string
          service_type?: Database["public"]["Enums"]["service_type"]
          unit?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          category: string
          created_at: string | null
          id: string
          message: string
          resolved: boolean | null
          severity: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          message: string
          resolved?: boolean | null
          severity: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          message?: string
          resolved?: boolean | null
          severity?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_config: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      talent_interests: {
        Row: {
          created_at: string | null
          id: string
          interest: string
          talent_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest: string
          talent_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interest?: string
          talent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_interests_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_services: {
        Row: {
          created_at: string | null
          custom_rate: number | null
          description: string | null
          id: string
          is_available: boolean | null
          max_duration: number | null
          service_type: Database["public"]["Enums"]["service_type"]
          talent_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_rate?: number | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          max_duration?: number | null
          service_type: Database["public"]["Enums"]["service_type"]
          talent_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_rate?: number | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          max_duration?: number | null
          service_type?: Database["public"]["Enums"]["service_type"]
          talent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_services_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          companion_earnings: number
          companion_id: string | null
          commission_rate: number
          created_at: string | null
          duration: number
          id: string
          midtrans_fraud_status: string | null
          midtrans_gross_amount: number | null
          midtrans_order_id: string | null
          midtrans_payment_type: string | null
          midtrans_raw_response: Json | null
          midtrans_settlement_time: string | null
          midtrans_transaction_id: string | null
          midtrans_transaction_status: string | null
          paid_at: string | null
          payment_method: string
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          platform_fee: number
          service_name: string
          service_type: Database["public"]["Enums"]["service_type"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          companion_earnings?: number
          companion_id?: string | null
          commission_rate?: number
          created_at?: string | null
          duration?: number
          id?: string
          midtrans_fraud_status?: string | null
          midtrans_gross_amount?: number | null
          midtrans_order_id?: string | null
          midtrans_payment_type?: string | null
          midtrans_raw_response?: Json | null
          midtrans_settlement_time?: string | null
          midtrans_transaction_id?: string | null
          midtrans_transaction_status?: string | null
          paid_at?: string | null
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          platform_fee?: number
          service_name: string
          service_type?: Database["public"]["Enums"]["service_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          companion_earnings?: number
          companion_id?: string | null
          commission_rate?: number
          created_at?: string | null
          duration?: number
          id?: string
          midtrans_fraud_status?: string | null
          midtrans_gross_amount?: number | null
          midtrans_order_id?: string | null
          midtrans_payment_type?: string | null
          midtrans_raw_response?: Json | null
          midtrans_settlement_time?: string | null
          midtrans_transaction_id?: string | null
          midtrans_transaction_status?: string | null
          paid_at?: string | null
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          platform_fee?: number
          service_name?: string
          service_type?: Database["public"]["Enums"]["service_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          admin_notes: string | null
          available_earnings: number
          bank_name: string | null
          companion_id: string
          created_at: string | null
          id: string
          payout_method: string
          processed_at: string | null
          processed_by: string | null
          requested_amount: number
          status: string
          updated_at: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          admin_notes?: string | null
          available_earnings: number
          bank_name?: string | null
          companion_id: string
          created_at?: string | null
          id?: string
          payout_method?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_amount: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          admin_notes?: string | null
          available_earnings?: number
          bank_name?: string | null
          companion_id?: string
          created_at?: string | null
          id?: string
          payout_method?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_amount?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_transactions: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          amount: number
          bank_name: string | null
          companion_id: string
          completed_at: string | null
          created_at: string | null
          failure_reason: string | null
          id: string
          payout_method: string
          payout_request_id: string
          status: string
          transaction_reference: string | null
          updated_at: string | null
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          amount: number
          bank_name?: string | null
          companion_id: string
          completed_at?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          payout_method: string
          payout_request_id: string
          status?: string
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          companion_id?: string
          completed_at?: string | null
          created_at?: string | null
          failure_reason?: string | null
          id?: string
          payout_method?: string
          payout_request_id?: string
          status?: string
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_transactions_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_transactions_payout_request_id_fkey"
            columns: ["payout_request_id"]
            isOneToOne: false
            referencedRelation: "payout_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          booking_id: string | null
          companion_earnings: number | null
          companion_id: string | null
          created_at: string | null
          duration: number
          id: string
          payment_method: string
          payment_reference: string | null
          platform_fee: number | null
          service: string
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          companion_earnings?: number | null
          companion_id?: string | null
          created_at?: string | null
          duration: number
          id?: string
          payment_method: string
          payment_reference?: string | null
          platform_fee?: number | null
          service: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          companion_earnings?: number | null
          companion_id?: string | null
          created_at?: string | null
          duration?: number
          id?: string
          payment_method?: string
          payment_reference?: string | null
          platform_fee?: number | null
          service?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_documents: {
        Row: {
          admin_notes: string | null
          content_type: string | null
          created_at: string | null
          document_type: string
          document_url: string | null
          file_name: string | null
          file_size: number | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          content_type?: string | null
          created_at?: string | null
          document_type: string
          document_url?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          content_type?: string | null
          created_at?: string | null
          document_type?: string
          document_url?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verified_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_type: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "waiting_companion_contact"
        | "in_progress"
      payment_status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "pending_verification"
      service_type:
        | "chat"
        | "call"
        | "video_call"
        | "offline_date"
        | "party_buddy"
        | "rent_lover"
      talent_level: "fresh" | "elite" | "vip"
      user_status: "active" | "suspended" | "pending" | "banned"
      user_type: "user" | "companion" | "admin"
      verification_status: "verified" | "pending" | "rejected"
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
      booking_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "waiting_companion_contact",
        "in_progress",
      ],
      payment_status: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "pending_verification",
      ],
      service_type: [
        "chat",
        "call",
        "video_call",
        "offline_date",
        "party_buddy",
        "rent_lover",
      ],
      talent_level: ["fresh", "elite", "vip"],
      user_status: ["active", "suspended", "pending", "banned"],
      user_type: ["user", "companion", "admin"],
      verification_status: ["verified", "pending", "rejected"],
    },
  },
} as const
