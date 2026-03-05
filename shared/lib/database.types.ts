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
          payment_method: string | null
          project_id: string
          receipt_images: string[] | null
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
          payment_method?: string | null
          project_id: string
          receipt_images?: string[] | null
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
          payment_method?: string | null
          project_id?: string
          receipt_images?: string[] | null
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
          payment_method: string | null
          project_id: string
          receipt_images: string[] | null
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
          payment_method?: string | null
          project_id: string
          receipt_images?: string[] | null
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
          payment_method?: string | null
          project_id?: string
          receipt_images?: string[] | null
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

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience type aliases
export type Profile = Tables<'profiles'>
export type Supplier = Tables<'suppliers'>
export type Contact = Tables<'contacts'>
export type Project = Tables<'projects'>
export type Expense = Tables<'expenses'>
export type Income = Tables<'incomes'>
export type ProjectActivity = Tables<'project_activities'>
export type AuditLog = Tables<'audit_log'>
