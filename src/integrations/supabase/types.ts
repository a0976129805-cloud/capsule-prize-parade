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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      album_claims: {
        Row: {
          created_at: string
          device_id: string
          page: number
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          page: number
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          page?: number
          user_id?: string
        }
        Relationships: []
      }
      cat_cards: {
        Row: {
          card_no: number
          copies: number
          device_id: string
          first_at: string
        }
        Insert: {
          card_no: number
          copies?: number
          device_id: string
          first_at?: string
        }
        Update: {
          card_no?: number
          copies?: number
          device_id?: string
          first_at?: string
        }
        Relationships: []
      }
      draw_events: {
        Row: {
          created_at: string
          id: string
          is_last_one: boolean
          machine_title: string
          prize_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_last_one?: boolean
          machine_title: string
          prize_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_last_one?: boolean
          machine_title?: string
          prize_name?: string
        }
        Relationships: []
      }
      member_coupons: {
        Row: {
          amount: number
          created_at: string
          expires_at: string
          id: string
          minimum: number
          name: string
          source: string
          used_order_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          expires_at: string
          id?: string
          minimum: number
          name: string
          source: string
          used_order_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string
          id?: string
          minimum?: number
          name?: string
          source?: string
          used_order_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      member_rewards: {
        Row: {
          last_day: string | null
          newcomer_claimed: boolean
          streak: number
          user_id: string
        }
        Insert: {
          last_day?: string | null
          newcomer_claimed?: boolean
          streak?: number
          user_id: string
        }
        Update: {
          last_day?: string | null
          newcomer_claimed?: boolean
          streak?: number
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          coupon_id: string | null
          coupon_name: string
          created_at: string
          device_id: string
          discount: number
          id: string
          item_count: number
          items: Json
          ship_email: string
          ship_name: string
          ship_phone: string
          shipping_fee: number
          status: string
          store_code: string
          store_name: string
          total: number
        }
        Insert: {
          coupon_id?: string | null
          coupon_name?: string
          created_at?: string
          device_id: string
          discount?: number
          id: string
          item_count?: number
          items?: Json
          ship_email?: string
          ship_name: string
          ship_phone: string
          shipping_fee?: number
          status?: string
          store_code: string
          store_name: string
          total?: number
        }
        Update: {
          coupon_id?: string | null
          coupon_name?: string
          created_at?: string
          device_id?: string
          discount?: number
          id?: string
          item_count?: number
          items?: Json
          ship_email?: string
          ship_name?: string
          ship_phone?: string
          shipping_fee?: number
          status?: string
          store_code?: string
          store_name?: string
          total?: number
        }
        Relationships: []
      }
      prizes: {
        Row: {
          id: string
          image: string
          name: string
          product_id: string
          sort: number
          stock: number
        }
        Insert: {
          id: string
          image?: string
          name?: string
          product_id: string
          sort?: number
          stock?: number
        }
        Update: {
          id?: string
          image?: string
          name?: string
          product_id?: string
          sort?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "prizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cover_image: string
          created_at: string
          id: string
          last_one_awarded: boolean
          last_one_image: string
          last_one_name: string
          price: number
          set_price: number
          sort: number
          status: string
          title: string
          total_stock: number
        }
        Insert: {
          cover_image?: string
          created_at?: string
          id: string
          last_one_awarded?: boolean
          last_one_image?: string
          last_one_name?: string
          price?: number
          set_price?: number
          sort?: number
          status?: string
          title: string
          total_stock?: number
        }
        Update: {
          cover_image?: string
          created_at?: string
          id?: string
          last_one_awarded?: boolean
          last_one_image?: string
          last_one_name?: string
          price?: number
          set_price?: number
          sort?: number
          status?: string
          title?: string
          total_stock?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reward_settings: {
        Row: {
          data: Json
          id: number
        }
        Insert: {
          data?: Json
          id?: number
        }
        Update: {
          data?: Json
          id?: number
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          data: Json
          id: number
        }
        Insert: {
          data?: Json
          id?: number
        }
        Update: {
          data?: Json
          id?: number
        }
        Relationships: []
      }
      vault_items: {
        Row: {
          device_id: string
          drawn_at: string
          id: string
          image: string
          is_last_one: boolean
          machine_title: string
          name: string
          order_id: string | null
          price: number
          prize_id: string
          product_id: string
        }
        Insert: {
          device_id: string
          drawn_at?: string
          id?: string
          image?: string
          is_last_one?: boolean
          machine_title?: string
          name?: string
          order_id?: string | null
          price?: number
          prize_id: string
          product_id: string
        }
        Update: {
          device_id?: string
          drawn_at?: string
          id?: string
          image?: string
          is_last_one?: boolean
          machine_title?: string
          name?: string
          order_id?: string | null
          price?: number
          prize_id?: string
          product_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_cat_cards: {
        Args: { _device: string; _nos: number[] }
        Returns: undefined
      }
      award_last_one: {
        Args: { _device: string; _product: string }
        Returns: {
          device_id: string
          drawn_at: string
          id: string
          image: string
          is_last_one: boolean
          machine_title: string
          name: string
          order_id: string | null
          price: number
          prize_id: string
          product_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "vault_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      buy_set: {
        Args: { _device: string; _product: string }
        Returns: {
          device_id: string
          drawn_at: string
          id: string
          image: string
          is_last_one: boolean
          machine_title: string
          name: string
          order_id: string | null
          price: number
          prize_id: string
          product_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "vault_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      checkout_vault: {
        Args: {
          _coupon?: string
          _device: string
          _shipping: Json
          _user?: string
        }
        Returns: Json
      }
      claim_album_page: {
        Args: { _device: string; _page: number; _user: string }
        Returns: Json
      }
      claim_member_reward: {
        Args: { _kind: string; _user: string }
        Returns: Json
      }
      draw_prizes: {
        Args: { _device: string; _n: number; _product: string }
        Returns: {
          device_id: string
          drawn_at: string
          id: string
          image: string
          is_last_one: boolean
          machine_title: string
          name: string
          order_id: string | null
          price: number
          prize_id: string
          product_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "vault_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      release_expired_vault: {
        Args: { _cutoff: string; _device?: string }
        Returns: undefined
      }
      reorder_machines: {
        Args: { _expected: string[]; _ids: string[] }
        Returns: undefined
      }
      take_stock: { Args: { _n: number; _product: string }; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
