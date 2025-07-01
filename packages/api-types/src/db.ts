export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      card_merchants: {
        Row: {
          card_id: string
          created_at: string
          id: string
          merchant_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          merchant_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          merchant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_merchants_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_merchants_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          issuing_merchant_id: string
          uid: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          issuing_merchant_id: string
          uid?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          issuing_merchant_id?: string
          uid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_issuing_merchant_id_fkey"
            columns: ["issuing_merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_billing: {
        Row: {
          address_extra: string | null
          address_info: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_company: boolean | null
          last_name: string | null
          payment_method: string | null
          payment_successful: boolean | null
          phone: string | null
          street_address: string | null
          subscription_type: string | null
          title: string | null
          zip_code: string | null
        }
        Insert: {
          address_extra?: string | null
          address_info?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_company?: boolean | null
          last_name?: string | null
          payment_method?: string | null
          payment_successful?: boolean | null
          phone?: string | null
          street_address?: string | null
          subscription_type?: string | null
          title?: string | null
          zip_code?: string | null
        }
        Update: {
          address_extra?: string | null
          address_info?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_company?: boolean | null
          last_name?: string | null
          payment_method?: string | null
          payment_successful?: boolean | null
          phone?: string | null
          street_address?: string | null
          subscription_type?: string | null
          title?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      checkpoint_advancements: {
        Row: {
          advanced_at: string
          customer_id: string
          id: string
          merchant_id: string
          offer_id: string
          step_number: number
          total_steps: number
        }
        Insert: {
          advanced_at?: string
          customer_id: string
          id?: string
          merchant_id: string
          offer_id: string
          step_number: number
          total_steps: number
        }
        Update: {
          advanced_at?: string
          customer_id?: string
          id?: string
          merchant_id?: string
          offer_id?: string
          step_number?: number
          total_steps?: number
        }
        Relationships: [
          {
            foreignKeyName: "checkpoint_advancements_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkpoint_advancements_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkpoint_advancements_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "checkpoint_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      checkpoint_offers: {
        Row: {
          created_at: string
          description: string
          id: string
          merchant_id: string
          name: string
          total_steps: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          merchant_id: string
          name: string
          total_steps: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          merchant_id?: string
          name?: string
          total_steps?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkpoint_offers_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      checkpoint_rewards: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          merchant_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id?: string
          merchant_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          merchant_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkpoint_rewards_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      checkpoint_steps: {
        Row: {
          created_at: string
          id: string
          merchant_id: string
          offer_id: string
          reward_id: string | null
          step_number: number
          total_steps: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          merchant_id: string
          offer_id: string
          reward_id?: string | null
          step_number: number
          total_steps: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          merchant_id?: string
          offer_id?: string
          reward_id?: string | null
          step_number?: number
          total_steps?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkpoint_steps_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkpoint_steps_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "checkpoint_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkpoint_steps_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "checkpoint_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_checkpoints: {
        Row: {
          current_step: number
          customer_id: string
          id: string
          last_updated: string
          merchant_id: string
          offer_id: string | null
        }
        Insert: {
          current_step?: number
          customer_id: string
          id?: string
          last_updated?: string
          merchant_id: string
          offer_id?: string | null
        }
        Update: {
          current_step?: number
          customer_id?: string
          id?: string
          last_updated?: string
          merchant_id?: string
          offer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_checkpoints_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_checkpoints_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_checkpoints_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "checkpoint_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
        }
        Relationships: []
      }
      merchants: {
        Row: {
          address: string
          annual_closures: Json | null
          country: string
          cover_image_url: string[] | null
          created_at: string
          gallery_images: Json | null
          google_maps_url: string | null
          hours: Json | null
          id: string
          image_path: string | null
          industry: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          phone: string | null
          profile_id: string | null
        }
        Insert: {
          address: string
          annual_closures?: Json | null
          country: string
          cover_image_url?: string[] | null
          created_at?: string
          gallery_images?: Json | null
          google_maps_url?: string | null
          hours?: Json | null
          id?: string
          image_path?: string | null
          industry: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          profile_id?: string | null
        }
        Update: {
          address?: string
          annual_closures?: Json | null
          country?: string
          cover_image_url?: string[] | null
          created_at?: string
          gallery_images?: Json | null
          google_maps_url?: string | null
          hours?: Json | null
          id?: string
          image_path?: string | null
          industry?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      redeemed_checkpoint_rewards: {
        Row: {
          checkpoint_reward_id: string
          checkpoint_step_id: string
          customer_id: string
          id: string
          merchant_id: string
          redeemed_at: string
          status: string
        }
        Insert: {
          checkpoint_reward_id: string
          checkpoint_step_id: string
          customer_id: string
          id?: string
          merchant_id: string
          redeemed_at?: string
          status?: string
        }
        Update: {
          checkpoint_reward_id?: string
          checkpoint_step_id?: string
          customer_id?: string
          id?: string
          merchant_id?: string
          redeemed_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "redeemed_checkpoint_rewards_checkpoint_reward_id_fkey"
            columns: ["checkpoint_reward_id"]
            isOneToOne: false
            referencedRelation: "checkpoint_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redeemed_checkpoint_rewards_checkpoint_step_id_fkey"
            columns: ["checkpoint_step_id"]
            isOneToOne: false
            referencedRelation: "checkpoint_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redeemed_checkpoint_rewards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redeemed_checkpoint_rewards_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      redeemed_rewards: {
        Row: {
          customer_id: string
          id: string
          merchant_id: string
          points_spent: number
          redeemed_at: string
          reward_id: string
          status: string
        }
        Insert: {
          customer_id: string
          id?: string
          merchant_id: string
          points_spent: number
          redeemed_at?: string
          reward_id: string
          status?: string
        }
        Update: {
          customer_id?: string
          id?: string
          merchant_id?: string
          points_spent?: number
          redeemed_at?: string
          reward_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "redeemed_rewards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redeemed_rewards_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redeemed_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string
          id: string
          image_path: string
          is_active: boolean
          merchant_id: string
          name: string
          price_coins: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_path: string
          is_active?: boolean
          merchant_id: string
          name: string
          price_coins: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_path?: string
          is_active?: boolean
          merchant_id?: string
          name?: string
          price_coins?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_type: string
          created_at: string
          end_date: string | null
          id: string
          plan_type: string
          profile_id: string
          start_date: string
          status: string
          trial_end_date: string | null
          updated_at: string
        }
        Insert: {
          billing_type: string
          created_at?: string
          end_date?: string | null
          id?: string
          plan_type: string
          profile_id: string
          start_date?: string
          status: string
          trial_end_date?: string | null
          updated_at?: string
        }
        Update: {
          billing_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          plan_type?: string
          profile_id?: string
          start_date?: string
          status?: string
          trial_end_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          card_merchant_id: string | null
          created_at: string
          id: string
          points: number
        }
        Insert: {
          card_merchant_id?: string | null
          created_at?: string
          id?: string
          points?: number
        }
        Update: {
          card_merchant_id?: string | null
          created_at?: string
          id?: string
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_card_merchant_id_fkey"
            columns: ["card_merchant_id"]
            isOneToOne: false
            referencedRelation: "card_merchants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_customer_checkpoint: {
        Args:
          | { p_customer_id: string; p_merchant_id: string }
          | { p_customer_id: string; p_merchant_id: string; p_offer_id: string }
        Returns: {
          current_step: number
          total_steps: number
          reward_id: string
          reward_name: string
          reward_description: string
        }[]
      }
      get_card_balance: {
        Args: { card_id: string }
        Returns: {
          merchant_id: string
          merchant_name: string
          balance: number
          is_issuer: boolean
          industry: string
          logo_url: string
          hours: Json
          latitude: number
          longitude: number
          checkpoints_current: number
          checkpoints_total: number
          reward_steps: number[]
        }[]
      }
      get_current_subscription: {
        Args: { profile_id: string }
        Returns: {
          plan_type: string
          billing_type: string
          status: string
          start_date: string
          end_date: string
          days_remaining: number
        }[]
      }
      get_customer_redeemed_rewards: {
        Args: { p_customer_id: string }
        Returns: {
          id: string
          reward_id: string
          reward_name: string
          points_spent: number
          redeemed_at: string
          status: string
        }[]
      }
      get_customer_transactions: {
        Args: { p_customer_id: string }
        Returns: {
          id: string
          points: number
          created_at: string
          merchant_id: string
          reward_name: string
          status: string
        }[]
      }
      get_merchant_customers: {
        Args: { p_merchant_id: string }
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          created_at: string
          total_points: number
          last_transaction: string
        }[]
      }
      get_or_create_customer: {
        Args:
          | { p_merchant_id: string }
          | { p_merchant_id: string; p_card_uid: string }
        Returns: string
      }
      get_subscription_history: {
        Args: { profile_id: string }
        Returns: {
          plan_type: string
          billing_type: string
          status: string
          start_date: string
          end_date: string
          payment_amount: number
          payment_status: string
          payment_date: string
        }[]
      }
      get_subscription_usage: {
        Args: { profile_id: string }
        Returns: {
          total_cards: number
          cards_this_month: number
          plan_limit: number
          usage_percentage: number
        }[]
      }
      has_active_subscription: {
        Args: { profile_id: string }
        Returns: boolean
      }
      redeem_checkpoint_reward: {
        Args: {
          p_customer_id: string
          p_merchant_id: string
          p_checkpoint_reward_id: string
          p_checkpoint_step_id: string
        }
        Returns: undefined
      }
      redeem_reward: {
        Args: { p_merchant_id: string; p_reward_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
