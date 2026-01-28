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
      cities: {
        Row: {
          country_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
          name_fr: string | null
        }
        Insert: {
          country_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
          name_fr?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          name_fr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name_ar: string
          name_en: string
          name_fr: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_ar: string
          name_en: string
          name_fr?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_ar?: string
          name_en?: string
          name_fr?: string | null
        }
        Relationships: []
      }
      craftsmen: {
        Row: {
          availability: Json | null
          completed_orders: number | null
          created_at: string | null
          description: string | null
          hourly_rate: number
          id: string
          is_verified: boolean | null
          location: string | null
          portfolio_images: string[] | null
          profession: string
          rating: number | null
          services: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          availability?: Json | null
          completed_orders?: number | null
          created_at?: string | null
          description?: string | null
          hourly_rate?: number
          id?: string
          is_verified?: boolean | null
          location?: string | null
          portfolio_images?: string[] | null
          profession: string
          rating?: number | null
          services?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          availability?: Json | null
          completed_orders?: number | null
          created_at?: string | null
          description?: string | null
          hourly_rate?: number
          id?: string
          is_verified?: boolean | null
          location?: string | null
          portfolio_images?: string[] | null
          profession?: string
          rating?: number | null
          services?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "craftsmen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "craftsmen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_dishes: {
        Row: {
          category: string
          cook_id: string
          created_at: string | null
          description: string | null
          dietary_tags: string[] | null
          id: string
          image_url: string | null
          images: string[] | null
          ingredients: string[] | null
          is_available: boolean | null
          name: string
          order_count: number | null
          preparation_time_minutes: number | null
          price: number
          rating: number | null
          servings: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          cook_id: string
          created_at?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          ingredients?: string[] | null
          is_available?: boolean | null
          name: string
          order_count?: number | null
          preparation_time_minutes?: number | null
          price: number
          rating?: number | null
          servings?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          cook_id?: string
          created_at?: string | null
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          ingredients?: string[] | null
          is_available?: boolean | null
          name?: string
          order_count?: number | null
          preparation_time_minutes?: number | null
          price?: number
          rating?: number | null
          servings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_dishes_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "home_cooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_dishes_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "public_home_cooks"
            referencedColumns: ["id"]
          },
        ]
      }
      food_orders: {
        Row: {
          city_id: string | null
          client_confirmed_at: string | null
          client_id: string
          cook_amount: number
          cook_id: string
          country_id: string | null
          created_at: string | null
          delivery_address: string | null
          delivery_notes: string | null
          dish_id: string
          id: string
          payment_status: string
          platform_fee: number
          quantity: number
          scheduled_delivery_at: string | null
          status: string
          total_amount: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          city_id?: string | null
          client_confirmed_at?: string | null
          client_id: string
          cook_amount?: number
          cook_id: string
          country_id?: string | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_notes?: string | null
          dish_id: string
          id?: string
          payment_status?: string
          platform_fee?: number
          quantity?: number
          scheduled_delivery_at?: string | null
          status?: string
          total_amount: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          city_id?: string | null
          client_confirmed_at?: string | null
          client_id?: string
          cook_amount?: number
          cook_id?: string
          country_id?: string | null
          created_at?: string | null
          delivery_address?: string | null
          delivery_notes?: string | null
          dish_id?: string
          id?: string
          payment_status?: string
          platform_fee?: number
          quantity?: number
          scheduled_delivery_at?: string | null
          status?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_orders_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_orders_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "home_cooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_orders_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "public_home_cooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_orders_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_orders_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "food_dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      food_ratings: {
        Row: {
          client_id: string
          comment: string | null
          cook_id: string
          created_at: string | null
          id: string
          order_id: string
          rating: number
        }
        Insert: {
          client_id: string
          comment?: string | null
          cook_id: string
          created_at?: string | null
          id?: string
          order_id: string
          rating: number
        }
        Update: {
          client_id?: string
          comment?: string | null
          cook_id?: string
          created_at?: string | null
          id?: string
          order_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "food_ratings_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "home_cooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_ratings_cook_id_fkey"
            columns: ["cook_id"]
            isOneToOne: false
            referencedRelation: "public_home_cooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "food_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      home_cooks: {
        Row: {
          acceptance_rate: number | null
          availability: Json | null
          city_id: string | null
          completed_orders: number | null
          country_id: string | null
          created_at: string | null
          delivery_available: boolean | null
          description: string | null
          hourly_rate: number | null
          id: string
          is_verified: boolean | null
          last_activity_at: string | null
          location: string | null
          min_order_amount: number | null
          monthly_tasks_count: number | null
          portfolio_images: string[] | null
          rating: number | null
          specialties: string[] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_ends_at: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acceptance_rate?: number | null
          availability?: Json | null
          city_id?: string | null
          completed_orders?: number | null
          country_id?: string | null
          created_at?: string | null
          delivery_available?: boolean | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          is_verified?: boolean | null
          last_activity_at?: string | null
          location?: string | null
          min_order_amount?: number | null
          monthly_tasks_count?: number | null
          portfolio_images?: string[] | null
          rating?: number | null
          specialties?: string[] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acceptance_rate?: number | null
          availability?: Json | null
          city_id?: string | null
          completed_orders?: number | null
          country_id?: string | null
          created_at?: string | null
          delivery_available?: boolean | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          is_verified?: boolean | null
          last_activity_at?: string | null
          location?: string | null
          min_order_amount?: number | null
          monthly_tasks_count?: number | null
          portfolio_images?: string[] | null
          rating?: number | null
          specialties?: string[] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_cooks_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_cooks_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_cooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_cooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      house_worker_ratings: {
        Row: {
          booking_id: string | null
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          service_type: string | null
          worker_id: string
        }
        Insert: {
          booking_id?: string | null
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          service_type?: string | null
          worker_id: string
        }
        Update: {
          booking_id?: string | null
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          service_type?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_worker_ratings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "worker_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_worker_ratings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "house_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_worker_ratings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "public_house_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      house_workers: {
        Row: {
          acceptance_rate: number | null
          age_range: string | null
          availability: Json | null
          available_days: string[] | null
          city_id: string | null
          completed_orders: number | null
          country_id: string | null
          created_at: string | null
          description: string | null
          experience_years: number | null
          hourly_rate: number
          id: string
          is_verified: boolean | null
          languages: string[] | null
          last_activity_at: string | null
          location: string | null
          monthly_tasks_count: number | null
          nationality: string | null
          portfolio_images: string[] | null
          rating: number | null
          service_category: string | null
          services: string[]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_ends_at: string | null
          subscription_started_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string
          work_hours_end: string | null
          work_hours_start: string | null
          work_type: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          age_range?: string | null
          availability?: Json | null
          available_days?: string[] | null
          city_id?: string | null
          completed_orders?: number | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          experience_years?: number | null
          hourly_rate?: number
          id?: string
          is_verified?: boolean | null
          languages?: string[] | null
          last_activity_at?: string | null
          location?: string | null
          monthly_tasks_count?: number | null
          nationality?: string | null
          portfolio_images?: string[] | null
          rating?: number | null
          service_category?: string | null
          services?: string[]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id: string
          work_hours_end?: string | null
          work_hours_start?: string | null
          work_type?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          age_range?: string | null
          availability?: Json | null
          available_days?: string[] | null
          city_id?: string | null
          completed_orders?: number | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          experience_years?: number | null
          hourly_rate?: number
          id?: string
          is_verified?: boolean | null
          languages?: string[] | null
          last_activity_at?: string | null
          location?: string | null
          monthly_tasks_count?: number | null
          nationality?: string | null
          portfolio_images?: string[] | null
          rating?: number | null
          service_category?: string | null
          services?: string[]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string
          work_hours_end?: string | null
          work_hours_start?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "house_workers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_workers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_workers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_workers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          media_duration: number | null
          media_size: number | null
          media_url: string | null
          message_type: string | null
          order_id: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_duration?: number | null
          media_size?: number | null
          media_url?: string | null
          message_type?: string | null
          order_id?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_duration?: number | null
          media_size?: number | null
          media_url?: string | null
          message_type?: string | null
          order_id?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          priority: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          priority?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          client_id: string
          craftsman_id: string | null
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          payment_status: string | null
          scheduled_date: string | null
          service_type: string
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          craftsman_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          payment_status?: string | null
          scheduled_date?: string | null
          service_type: string
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          craftsman_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          payment_status?: string | null
          scheduled_date?: string | null
          service_type?: string
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_craftsman_id_fkey"
            columns: ["craftsman_id"]
            isOneToOne: false
            referencedRelation: "craftsmen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_craftsman_id_fkey"
            columns: ["craftsman_id"]
            isOneToOne: false
            referencedRelation: "public_craftsmen"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cover_url: string | null
          created_at: string | null
          full_name: string
          id: string
          is_suspended: boolean | null
          phone: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          is_suspended?: boolean | null
          phone?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_suspended?: boolean | null
          phone?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          device_name: string | null
          id: string
          is_active: boolean | null
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          client_id: string
          comment: string | null
          craftsman_id: string
          created_at: string | null
          id: string
          order_id: string
          rating: number
        }
        Insert: {
          client_id: string
          comment?: string | null
          craftsman_id: string
          created_at?: string | null
          id?: string
          order_id: string
          rating: number
        }
        Update: {
          client_id?: string
          comment?: string | null
          craftsman_id?: string
          created_at?: string | null
          id?: string
          order_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_craftsman_id_fkey"
            columns: ["craftsman_id"]
            isOneToOne: false
            referencedRelation: "craftsmen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_craftsman_id_fkey"
            columns: ["craftsman_id"]
            isOneToOne: false
            referencedRelation: "public_craftsmen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          created_at: string | null
          id: string
          language_code: string
          translation_key: string
          translation_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          language_code: string
          translation_key: string
          translation_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          language_code?: string
          translation_key?: string
          translation_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          conversation_partner_id: string
          id: string
          is_typing: boolean | null
          last_typed_at: string | null
          user_id: string
        }
        Insert: {
          conversation_partner_id: string
          id?: string
          is_typing?: boolean | null
          last_typed_at?: string | null
          user_id: string
        }
        Update: {
          conversation_partner_id?: string
          id?: string
          is_typing?: boolean | null
          last_typed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      worker_bookings: {
        Row: {
          booking_date: string
          city_id: string | null
          client_comment: string | null
          client_confirmed_at: string | null
          client_id: string
          client_rating: number | null
          country_id: string | null
          created_at: string | null
          end_time: string
          id: string
          notes: string | null
          service_type: string
          start_time: string
          status: string
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          booking_date: string
          city_id?: string | null
          client_comment?: string | null
          client_confirmed_at?: string | null
          client_id: string
          client_rating?: number | null
          country_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          notes?: string | null
          service_type: string
          start_time: string
          status?: string
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          booking_date?: string
          city_id?: string | null
          client_comment?: string | null
          client_confirmed_at?: string | null
          client_id?: string
          client_rating?: number | null
          country_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          service_type?: string
          start_time?: string
          status?: string
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_bookings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_bookings_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_bookings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "house_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_bookings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "public_house_workers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_craftsmen: {
        Row: {
          availability: Json | null
          completed_orders: number | null
          created_at: string | null
          description: string | null
          hourly_rate: number | null
          id: string | null
          is_verified: boolean | null
          location: string | null
          portfolio_images: string[] | null
          profession: string | null
          rating: number | null
          services: string[] | null
          user_id: string | null
        }
        Insert: {
          availability?: Json | null
          completed_orders?: number | null
          created_at?: string | null
          description?: string | null
          hourly_rate?: number | null
          id?: string | null
          is_verified?: boolean | null
          location?: string | null
          portfolio_images?: string[] | null
          profession?: string | null
          rating?: number | null
          services?: string[] | null
          user_id?: string | null
        }
        Update: {
          availability?: Json | null
          completed_orders?: number | null
          created_at?: string | null
          description?: string | null
          hourly_rate?: number | null
          id?: string | null
          is_verified?: boolean | null
          location?: string | null
          portfolio_images?: string[] | null
          profession?: string | null
          rating?: number | null
          services?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "craftsmen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "craftsmen_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_home_cooks: {
        Row: {
          availability: Json | null
          city_id: string | null
          completed_orders: number | null
          country_id: string | null
          created_at: string | null
          delivery_available: boolean | null
          description: string | null
          hourly_rate: number | null
          id: string | null
          is_verified: boolean | null
          location: string | null
          min_order_amount: number | null
          portfolio_images: string[] | null
          rating: number | null
          specialties: string[] | null
          user_id: string | null
        }
        Insert: {
          availability?: Json | null
          city_id?: string | null
          completed_orders?: number | null
          country_id?: string | null
          created_at?: string | null
          delivery_available?: boolean | null
          description?: string | null
          hourly_rate?: number | null
          id?: string | null
          is_verified?: boolean | null
          location?: string | null
          min_order_amount?: number | null
          portfolio_images?: string[] | null
          rating?: number | null
          specialties?: string[] | null
          user_id?: string | null
        }
        Update: {
          availability?: Json | null
          city_id?: string | null
          completed_orders?: number | null
          country_id?: string | null
          created_at?: string | null
          delivery_available?: boolean | null
          description?: string | null
          hourly_rate?: number | null
          id?: string | null
          is_verified?: boolean | null
          location?: string | null
          min_order_amount?: number | null
          portfolio_images?: string[] | null
          rating?: number | null
          specialties?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_cooks_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_cooks_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_cooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "home_cooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_house_workers: {
        Row: {
          availability: Json | null
          available_days: string[] | null
          city_id: string | null
          completed_orders: number | null
          country_id: string | null
          created_at: string | null
          description: string | null
          experience_years: number | null
          hourly_rate: number | null
          id: string | null
          is_verified: boolean | null
          languages: string[] | null
          location: string | null
          nationality: string | null
          portfolio_images: string[] | null
          rating: number | null
          service_category: string | null
          services: string[] | null
          user_id: string | null
          work_type: string | null
        }
        Insert: {
          availability?: Json | null
          available_days?: string[] | null
          city_id?: string | null
          completed_orders?: number | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string | null
          is_verified?: boolean | null
          languages?: string[] | null
          location?: string | null
          nationality?: string | null
          portfolio_images?: string[] | null
          rating?: number | null
          service_category?: string | null
          services?: string[] | null
          user_id?: string | null
          work_type?: string | null
        }
        Update: {
          availability?: Json | null
          available_days?: string[] | null
          city_id?: string | null
          completed_orders?: number | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string | null
          is_verified?: boolean | null
          languages?: string[] | null
          location?: string | null
          nationality?: string | null
          portfolio_images?: string[] | null
          rating?: number | null
          service_category?: string | null
          services?: string[] | null
          user_id?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "house_workers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_workers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_workers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "house_workers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_monthly_tasks_count: { Args: never; Returns: undefined }
      user_has_active_subscription: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client" | "craftsman" | "house_worker" | "home_cook"
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
      app_role: ["admin", "client", "craftsman", "house_worker", "home_cook"],
    },
  },
} as const
