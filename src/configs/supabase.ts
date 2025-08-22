import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          bio: string | null
          phone_number: string | null
          first_vote_year: number | null
          referral_code: string | null
          referred_by: string | null
          tier_level: number
          engagement_score: number
          constituency_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          bio?: string | null
          phone_number?: string | null
          first_vote_year?: number | null
          referral_code?: string | null
          referred_by?: string | null
          tier_level?: number
          engagement_score?: number
          constituency_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          bio?: string | null
          phone_number?: string | null
          first_vote_year?: number | null
          referral_code?: string | null
          referred_by?: string | null
          tier_level?: number
          engagement_score?: number
          constituency_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      constituencies: {
        Row: {
          id: number
          area_name: string
          area_name_hi: string
          district: string | null
          state: string
          total_users: number
          level1_users: number
          level2_users: number
          level3_users: number
          level4_users: number
          last_calculated: string
          created_at: string
        }
        Insert: {
          id?: number
          area_name: string
          area_name_hi: string
          district?: string | null
          state?: string
          total_users?: number
          level1_users?: number
          level2_users?: number
          level3_users?: number
          level4_users?: number
          last_calculated?: string
          created_at?: string
        }
        Update: {
          id?: number
          area_name?: string
          area_name_hi?: string
          district?: string | null
          state?: string
          total_users?: number
          level1_users?: number
          level2_users?: number
          level3_users?: number
          level4_users?: number
          last_calculated?: string
          created_at?: string
        }
      }
      candidates: {
        Row: {
          id: number
          constituency_id: number
          name: string
          name_hi: string
          image_url: string | null
          age: number | null
          party_name: string
          party_name_hi: string
          party_icon_url: string | null
          experience: string | null
          education: string | null
          net_worth: number | null
          criminal_cases: number
          attendance_percentage: number | null
          questions_asked: number
          funds_utilisation: string | null
          manifesto_score: number
          last_election_vote_percentage: number | null
          manifesto_link: string | null
          is_current_representative: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          constituency_id: number
          name: string
          name_hi: string
          image_url?: string | null
          age?: number | null
          party_name: string
          party_name_hi: string
          party_icon_url?: string | null
          experience?: string | null
          education?: string | null
          net_worth?: number | null
          criminal_cases?: number
          attendance_percentage?: number | null
          questions_asked?: number
          funds_utilisation?: string | null
          manifesto_score?: number
          last_election_vote_percentage?: number | null
          manifesto_link?: string | null
          is_current_representative?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          constituency_id?: number
          name?: string
          name_hi?: string
          image_url?: string | null
          age?: number | null
          party_name?: string
          party_name_hi?: string
          party_icon_url?: string | null
          experience?: string | null
          education?: string | null
          net_worth?: number | null
          criminal_cases?: number
          attendance_percentage?: number | null
          questions_asked?: number
          funds_utilisation?: string | null
          manifesto_score?: number
          last_election_vote_percentage?: number | null
          manifesto_link?: string | null
          is_current_representative?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      news: {
        Row: {
          id: number
          constituency_id: number
          title: string
          title_hi: string
          content: string | null
          content_hi: string | null
          image_url: string | null
          source: string | null
          published_date: string | null
          created_at: string
        }
        Insert: {
          id?: number
          constituency_id: number
          title: string
          title_hi: string
          content?: string | null
          content_hi?: string | null
          image_url?: string | null
          source?: string | null
          published_date?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          constituency_id?: number
          title?: string
          title_hi?: string
          content?: string | null
          content_hi?: string | null
          image_url?: string | null
          source?: string | null
          published_date?: string | null
          created_at?: string
        }
      }
      user_engagement: {
        Row: {
          id: number
          user_id: string
          constituency_id: number
          engagement_type: string
          content: string | null
          metadata: any
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          constituency_id: number
          engagement_type: string
          content?: string | null
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          constituency_id?: number
          engagement_type?: string
          content?: string | null
          metadata?: any
          created_at?: string
        }
      }
      satisfaction_surveys: {
        Row: {
          id: number
          user_id: string
          constituency_id: number
          candidate_id: number
          question: string
          answer: boolean
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          constituency_id: number
          candidate_id: number
          question: string
          answer: boolean
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          constituency_id?: number
          candidate_id?: number
          question?: string
          answer?: boolean
          created_at?: string
        }
      }
      discussion_posts: {
        Row: {
          id: number
          user_id: string
          constituency_id: number
          title: string
          content: string
          post_type: string
          status: string
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          constituency_id: number
          title: string
          content: string
          post_type?: string
          status?: string
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          constituency_id?: number
          title?: string
          content?: string
          post_type?: string
          status?: string
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      post_interactions: {
        Row: {
          id: number
          post_id: number
          user_id: string
          interaction_type: string
          content: string | null
          created_at: string
        }
        Insert: {
          id?: number
          post_id: number
          user_id: string
          interaction_type: string
          content?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          user_id?: string
          interaction_type?: string
          content?: string | null
          created_at?: string
        }
      }
      referrals: {
        Row: {
          id: number
          referrer_id: string
          referred_email: string
          referral_code: string
          status: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          referrer_id: string
          referred_email: string
          referral_code: string
          status?: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          referrer_id?: string
          referred_email?: string
          referral_code?: string
          status?: string
          completed_at?: string | null
          created_at?: string
        }
      }
      department_ratings: {
        Row: {
          id: number
          user_id: string
          constituency_id: number
          department: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          constituency_id: number
          department: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          constituency_id?: number
          department?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      global_stats: {
        Row: {
          id: number
          total_users: number
          level1_users: number
          level2_users: number
          level3_users: number
          level4_users: number
          total_constituencies: number
          last_calculated: string
          created_at: string
        }
        Insert: {
          id?: number
          total_users: number
          level1_users: number
          level2_users: number
          level3_users: number
          level4_users: number
          total_constituencies: number
          last_calculated?: string
          created_at?: string
        }
        Update: {
          id?: number
          total_users?: number
          level1_users?: number
          level2_users?: number
          level3_users?: number
          level4_users?: number
          total_constituencies?: number
          last_calculated?: string
          created_at?: string
        }
      }
    }
  }
} 