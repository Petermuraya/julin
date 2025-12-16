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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      buyer_inquiries: {
        Row: {
          buyer_email: string | null
          buyer_name: string
          buyer_phone: string
          created_at: string
          follow_up_date: string | null
          id: string
          lead_status: Database["public"]["Enums"]["lead_status"] | null
          message: string | null
          notes: string | null
          property_id: string
          updated_at: string
        }
        Insert: {
          buyer_email?: string | null
          buyer_name: string
          buyer_phone: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          lead_status?: Database["public"]["Enums"]["lead_status"] | null
          message?: string | null
          notes?: string | null
          property_id: string
          updated_at?: string
        }
        Update: {
          buyer_email?: string | null
          buyer_name?: string
          buyer_phone?: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          lead_status?: Database["public"]["Enums"]["lead_status"] | null
          message?: string | null
          notes?: string | null
          property_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          id: string
          last_message: string | null
          started_at: string | null
          summary: string | null
          user_display_name: string | null
        }
        Insert: {
          id: string
          last_message?: string | null
          started_at?: string | null
          summary?: string | null
          user_display_name?: string | null
        }
        Update: {
          id?: string
          last_message?: string | null
          started_at?: string | null
          summary?: string | null
          user_display_name?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          role: string | null
          session_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string | null
          session_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string
          id: string
          inquiry_type: string | null
          message: string
          name: string
          phone: string
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email: string
          id?: string
          inquiry_type?: string | null
          message: string
          name: string
          phone: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string
          id?: string
          inquiry_type?: string | null
          message?: string
          name?: string
          phone?: string
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          amenities: string[] | null
          approved_at: string | null
          approved_by: string | null
          county: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_admin_property: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          rejection_reason: string | null
          seller_email: string | null
          seller_name: string | null
          seller_phone: string | null
          size: string | null
          status: Database["public"]["Enums"]["property_status"]
          submitted_by_user_id: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          amenities?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_admin_property?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          price: number
          property_type?: Database["public"]["Enums"]["property_type"]
          rejection_reason?: string | null
          seller_email?: string | null
          seller_name?: string | null
          seller_phone?: string | null
          size?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          submitted_by_user_id?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          amenities?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_admin_property?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          rejection_reason?: string | null
          seller_email?: string | null
          seller_name?: string | null
          seller_phone?: string | null
          size?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          submitted_by_user_id?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      property_submissions: {
        Row: {
          admin_notes: string | null
          county: string | null
          created_at: string
          created_property_id: string | null
          description: string | null
          documents: string[] | null
          id: string
          images: string[] | null
          location: string
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          reviewed_at: string | null
          reviewed_by: string | null
          seller_email: string | null
          seller_name: string
          seller_phone: string
          size: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          county?: string | null
          created_at?: string
          created_property_id?: string | null
          description?: string | null
          documents?: string[] | null
          id?: string
          images?: string[] | null
          location: string
          price: number
          property_type?: Database["public"]["Enums"]["property_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_email?: string | null
          seller_name: string
          seller_phone: string
          size?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          county?: string | null
          created_at?: string
          created_property_id?: string | null
          description?: string | null
          documents?: string[] | null
          id?: string
          images?: string[] | null
          location?: string
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_email?: string | null
          seller_name?: string
          seller_phone?: string
          size?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_submissions_created_property_id_fkey"
            columns: ["created_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          preferred_date: string
          preferred_time: string | null
          property_id: string
          status: string | null
          updated_at: string
          visit_type: string | null
          visitor_email: string | null
          visitor_name: string
          visitor_phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          preferred_date: string
          preferred_time?: string | null
          property_id: string
          status?: string | null
          updated_at?: string
          visit_type?: string | null
          visitor_email?: string | null
          visitor_name: string
          visitor_phone: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          preferred_date?: string
          preferred_time?: string | null
          property_id?: string
          status?: string | null
          updated_at?: string
          visit_type?: string | null
          visitor_email?: string | null
          visitor_name?: string
          visitor_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      lead_status: "hot" | "warm" | "cold"
      property_status: "available" | "pending" | "sold"
      property_type: "plot" | "house" | "land" | "apartment" | "commercial"
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
      lead_status: ["hot", "warm", "cold"],
      property_status: ["available", "pending", "sold"],
      property_type: ["plot", "house", "land", "apartment", "commercial"],
    },
  },
} as const
