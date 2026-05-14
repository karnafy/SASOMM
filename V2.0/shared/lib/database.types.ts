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
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          avatar: string | null
          category: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar?: string | null
          category?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar?: string | null
          category?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          direction: string
          due_date: string | null
          id: string
          image_url: string | null
          is_paid: boolean | null
          last_reminder_date: string | null
          next_reminder_date: string | null
          notes: string | null
          person_name: string
          person_phone: string | null
          project_id: string | null
          project_name: string | null
          reminder_interval: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          direction?: string
          due_date?: string | null
          id?: string
          image_url?: string | null
          is_paid?: boolean | null
          last_reminder_date?: string | null
          next_reminder_date?: string | null
          notes?: string | null
          person_name: string
          person_phone?: string | null
          project_id?: string | null
          project_name?: string | null
          reminder_interval?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          direction?: string
          due_date?: string | null
          id?: string
          image_url?: string | null
          is_paid?: boolean | null
          last_reminder_date?: string | null
          next_reminder_date?: string | null
          notes?: string | null
          person_name?: string
          person_phone?: string | null
          project_id?: string | null
          project_name?: string | null
          reminder_interval?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          color: string | null
          created_at: string | null
          currency: string | null
          date: string
          icon: string | null
          id: string
          includes_vat: boolean | null
          original_amount: number | null
          original_currency: string | null
          payment_method: string | null
          project_id: string
          receipt_images: string[] | null
          recurring_occurrence_index: number | null
          recurring_template_id: string | null
          supplier_id: string | null
          tag: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          color?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          icon?: string | null
          id?: string
          includes_vat?: boolean | null
          original_amount?: number | null
          original_currency?: string | null
          payment_method?: string | null
          project_id: string
          receipt_images?: string[] | null
          recurring_occurrence_index?: number | null
          recurring_template_id?: string | null
          supplier_id?: string | null
          tag?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          color?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          icon?: string | null
          id?: string
          includes_vat?: boolean | null
          original_amount?: number | null
          original_currency?: string | null
          payment_method?: string | null
          project_id?: string
          receipt_images?: string[] | null
          recurring_occurrence_index?: number | null
          recurring_template_id?: string | null
          supplier_id?: string | null
          tag?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recurring_template_id_fkey"
            columns: ["recurring_template_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      incomes: {
        Row: {
          amount: number
          color: string | null
          created_at: string | null
          currency: string | null
          date: string
          icon: string | null
          id: string
          includes_vat: boolean | null
          original_amount: number | null
          original_currency: string | null
          payment_method: string | null
          project_id: string
          receipt_images: string[] | null
          recurring_occurrence_index: number | null
          recurring_template_id: string | null
          supplier_id: string | null
          tag: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          color?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          icon?: string | null
          id?: string
          includes_vat?: boolean | null
          original_amount?: number | null
          original_currency?: string | null
          payment_method?: string | null
          project_id: string
          receipt_images?: string[] | null
          recurring_occurrence_index?: number | null
          recurring_template_id?: string | null
          supplier_id?: string | null
          tag?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          color?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          icon?: string | null
          id?: string
          includes_vat?: boolean | null
          original_amount?: number | null
          original_currency?: string | null
          payment_method?: string | null
          project_id?: string
          receipt_images?: string[] | null
          recurring_occurrence_index?: number | null
          recurring_template_id?: string | null
          supplier_id?: string | null
          tag?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incomes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_recurring_template_id_fkey"
            columns: ["recurring_template_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incomes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_milestones: {
        Row: {
          allocation_id: string
          created_at: string | null
          id: string
          is_paid: boolean | null
          milestone_number: number
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          percentage: number
          stage_name: string | null
        }
        Insert: {
          allocation_id: string
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          milestone_number: number
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          percentage: number
          stage_name?: string | null
        }
        Update: {
          allocation_id?: string
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          milestone_number?: number
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          percentage?: number
          stage_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_milestones_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "project_supplier_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_activities: {
        Row: {
          amount: number | null
          created_at: string | null
          date: string | null
          icon: string | null
          id: string
          new_value: string | null
          old_value: string | null
          project_id: string
          receipt_images: string[] | null
          supplier_id: string | null
          tag: string | null
          title: string
          transaction_id: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          date?: string | null
          icon?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id: string
          receipt_images?: string[] | null
          supplier_id?: string | null
          tag?: string | null
          title: string
          transaction_id?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          date?: string | null
          icon?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          project_id?: string
          receipt_images?: string[] | null
          supplier_id?: string | null
          tag?: string | null
          title?: string
          transaction_id?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_activities_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_supplier_allocations: {
        Row: {
          allocated_budget: number
          created_at: string | null
          currency: string
          id: string
          payment_count: number
          project_id: string
          supplier_id: string
          total_paid: number
          user_id: string
        }
        Insert: {
          allocated_budget?: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_count?: number
          project_id: string
          supplier_id: string
          total_paid?: number
          user_id: string
        }
        Update: {
          allocated_budget?: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_count?: number
          project_id?: string
          supplier_id?: string
          total_paid?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_supplier_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_supplier_allocations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          budget_currency: string | null
          budget_includes_vat: boolean | null
          category: string | null
          created_at: string | null
          icon: string | null
          id: string
          income: number | null
          main_category: string | null
          name: string
          primary_supplier_id: string | null
          spent: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget?: number | null
          budget_currency?: string | null
          budget_includes_vat?: boolean | null
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          income?: number | null
          main_category?: string | null
          name: string
          primary_supplier_id?: string | null
          spent?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget?: number | null
          budget_currency?: string | null
          budget_includes_vat?: boolean | null
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          income?: number | null
          main_category?: string | null
          name?: string
          primary_supplier_id?: string | null
          spent?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_primary_supplier_id_fkey"
            columns: ["primary_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_transactions: {
        Row: {
          amount: number
          color: string | null
          created_at: string
          currency: string
          day_of_month: number
          end_date: string | null
          frequency: string
          icon: string | null
          id: string
          includes_vat: boolean
          is_active: boolean
          last_generated_until_date: string | null
          payment_method: string | null
          project_id: string
          start_date: string
          supplier_id: string | null
          tag: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          color?: string | null
          created_at?: string
          currency?: string
          day_of_month: number
          end_date?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          includes_vat?: boolean
          is_active?: boolean
          last_generated_until_date?: string | null
          payment_method?: string | null
          project_id: string
          start_date: string
          supplier_id?: string | null
          tag?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          color?: string | null
          created_at?: string
          currency?: string
          day_of_month?: number
          end_date?: string | null
          frequency?: string
          icon?: string | null
          id?: string
          includes_vat?: boolean
          is_active?: boolean
          last_generated_until_date?: string | null
          payment_method?: string | null
          project_id?: string
          start_date?: string
          supplier_id?: string | null
          tag?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          amount: number | null
          avatar: string | null
          category: string | null
          created_at: string | null
          id: string
          last_active: string | null
          name: string
          phone: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          avatar?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          last_active?: string | null
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          avatar?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          last_active?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
