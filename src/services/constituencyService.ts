import { supabase } from '../configs/supabase'

export interface ConstituencyWithDetails {
  id: number
  area_name: string
  area_name_hi: string
  district: string | null
  state: string
  candidates: Array<{
    id: number
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
    is_current_representative: boolean
  }>
  news: Array<{
    id: number
    title: string
    title_hi: string
    content: string | null
    published_date: string | null
  }>
}

export interface CandidateData {
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
  is_current_representative: boolean
}

export interface NewsData {
  id: number
  constituency_id: number
  title: string
  title_hi: string
  content: string | null
  content_hi: string | null
  image_url: string | null
  source: string | null
  published_date: string | null
}

// Get all constituencies with their candidates and news
export const getAllConstituencies = async (): Promise<ConstituencyWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('constituencies')
      .select(`
        *,
        candidates (*),
        news (*)
      `)
      .order('area_name')

    if (error) {
      console.error('Error fetching constituencies:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllConstituencies:', error)
    throw error
  }
}

// Get constituency by ID with full details
export const getConstituencyById = async (id: number): Promise<ConstituencyWithDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('constituencies')
      .select(`
        *,
        candidates (*),
        news (*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching constituency:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in getConstituencyById:', error)
    throw error
  }
}

// Search constituencies by name, candidate, or party
export const searchConstituencies = async (query: string): Promise<ConstituencyWithDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('constituencies')
      .select(`
        *,
        candidates (*),
        news (*)
      `)
      .or(`area_name.ilike.%${query}%,candidates.name.ilike.%${query}%,candidates.party_name.ilike.%${query}%`)
      .order('area_name')

    if (error) {
      console.error('Error searching constituencies:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in searchConstituencies:', error)
    throw error
  }
}

// Get candidates by constituency ID
export const getCandidatesByConstituency = async (constituencyId: number): Promise<CandidateData[]> => {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('constituency_id', constituencyId)
      .eq('is_current_representative', true)

    if (error) {
      console.error('Error fetching candidates:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getCandidatesByConstituency:', error)
    throw error
  }
}

// Get news by constituency ID
export const getNewsByConstituency = async (constituencyId: number): Promise<NewsData[]> => {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('constituency_id', constituencyId)
      .order('published_date', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching news:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getNewsByConstituency:', error)
    throw error
  }
}

// Get all candidates with constituency info
export const getAllCandidates = async (): Promise<Array<CandidateData & { constituency: { area_name: string, area_name_hi: string } }>> => {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select(`
        *,
        constituency:constituencies(area_name, area_name_hi)
      `)
      .eq('is_current_representative', true)
      .order('constituency_id')

    if (error) {
      console.error('Error fetching all candidates:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllCandidates:', error)
    throw error
  }
}

// Get constituency statistics
export const getConstituencyStats = async () => {
  try {
    const { data: constituencies, error: constituenciesError } = await supabase
      .from('constituencies')
      .select('id')

    if (constituenciesError) throw constituenciesError

    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('id, constituency_id, manifesto_score, criminal_cases')

    if (candidatesError) throw candidatesError

    const totalConstituencies = constituencies?.length || 0
    const totalCandidates = candidates?.length || 0
    const avgManifestoScore = candidates?.reduce((acc, c) => acc + (c.manifesto_score || 0), 0) / totalCandidates || 0
    const totalCriminalCases = candidates?.reduce((acc, c) => acc + (c.criminal_cases || 0), 0) || 0

    return {
      totalConstituencies,
      totalCandidates,
      avgManifestoScore: Math.round(avgManifestoScore * 100) / 100,
      totalCriminalCases
    }
  } catch (error) {
    console.error('Error in getConstituencyStats:', error)
    throw error
  }
} 