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
      profiles: {
        Row: {
          id: string
          role: 'student' | 'instructor' | 'admin'
          full_name: string
          email: string
          created_at: string
          updated_at: string
          instructor_id: string | null
        }
        Insert: {
          id: string
          role?: 'student' | 'instructor' | 'admin'
          full_name: string
          email: string
          created_at?: string
          updated_at?: string
          instructor_id?: string | null
        }
        Update: {
          id?: string
          role?: 'student' | 'instructor' | 'admin'
          full_name?: string
          email?: string
          created_at?: string
          updated_at?: string
          instructor_id?: string | null
        }
      }
      skills: {
        Row: {
          id: string
          name: string
          description: string
          category_id: string
          required_submissions: number
          verification_type: 'peer' | 'instructor'
          form_schema: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category_id: string
          required_submissions?: number
          verification_type?: 'peer' | 'instructor'
          form_schema?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category_id?: string
          required_submissions?: number
          verification_type?: 'peer' | 'instructor'
          form_schema?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}