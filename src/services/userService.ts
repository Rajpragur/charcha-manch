import { supabase } from '../configs/supabase'

export interface UserProfile {
  id: string
  display_name: string | null
  bio: string | null
  phone_number: string | null
  first_vote_year: number | null
  referral_code: string | null
  referred_by: string | null
  tier_level: number
  engagement_score: number
  created_at: string
  updated_at: string
}

export interface UserAchievements {
  pehlaVote: number | null
  charchaonBhagidari: number
  naiCharchaPehel: number
  nagrikPrerak: number
}

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found, create one
        return await createUserProfile(userId)
      }
      console.error('Error fetching user profile:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    throw error
  }
}

// Create user profile
export const createUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const referralCode = generateReferralCode()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        referral_code: referralCode,
        tier_level: 1,
        engagement_score: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createUserProfile:', error)
    throw error
  }
}

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in updateUserProfile:', error)
    throw error
  }
}

// Get user achievements
export const getUserAchievements = async (userId: string): Promise<UserAchievements> => {
  try {
    // Get first vote year
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_vote_year')
      .eq('id', userId)
      .single()

    // Get engagement counts
    const { data: engagements } = await supabase
      .from('user_engagement')
      .select('engagement_type')
      .eq('user_id', userId)

    // Get post counts
    const { data: posts } = await supabase
      .from('discussion_posts')
      .select('id')
      .eq('user_id', userId)

    // Get referral count
    const { data: referrals } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', userId)
      .eq('status', 'completed')

    const charchaonBhagidari = engagements?.filter(e => e.engagement_type === 'comment').length || 0
    const naiCharchaPehel = posts?.length || 0
    const nagrikPrerak = referrals?.length || 0

    return {
      pehlaVote: profile?.first_vote_year || null,
      charchaonBhagidari,
      naiCharchaPehel,
      nagrikPrerak
    }
  } catch (error) {
    console.error('Error in getUserAchievements:', error)
    throw error
  }
}

// Record user engagement
export const recordUserEngagement = async (
  userId: string, 
  constituencyId: number, 
  engagementType: 'vote' | 'comment' | 'post' | 'share' | 'like',
  content?: string
) => {
  try {
    const { data, error } = await supabase
      .from('user_engagement')
      .insert({
        user_id: userId,
        constituency_id: constituencyId,
        engagement_type: engagementType,
        content
      })
      .select()

    if (error) {
      console.error('Error recording engagement:', error)
      throw error
    }

    // Update user's engagement score
    await updateUserEngagementScore(userId)

    return data
  } catch (error) {
    console.error('Error in recordUserEngagement:', error)
    throw error
  }
}

// Update user engagement score and tier
export const updateUserEngagementScore = async (userId: string) => {
  try {
    // Calculate total engagement score
    const { data: engagements } = await supabase
      .from('user_engagement')
      .select('engagement_type')
      .eq('user_id', userId)

    let score = 0
    engagements?.forEach(engagement => {
      switch (engagement.engagement_type) {
        case 'post':
          score += 10
          break
        case 'comment':
          score += 5
          break
        case 'vote':
          score += 3
          break
        case 'share':
          score += 2
          break
        case 'like':
          score += 1
          break
      }
    })

    // Determine tier based on score
    let tier = 1
    if (score >= 100) tier = 4
    else if (score >= 50) tier = 3
    else if (score >= 20) tier = 2

    // Update profile
    await supabase
      .from('user_profiles')
      .update({
        engagement_score: score,
        tier_level: tier,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

  } catch (error) {
    console.error('Error in updateUserEngagementScore:', error)
    throw error
  }
}

// Submit satisfaction survey
export const submitSatisfactionSurvey = async (
  userId: string,
  constituencyId: number,
  candidateId: number,
  answer: boolean
) => {
  try {
    const { data, error } = await supabase
      .from('satisfaction_surveys')
      .insert({
        user_id: userId,
        constituency_id: constituencyId,
        candidate_id: candidateId,
        question: 'Are you satisfied with your tenure of last 5 years?',
        answer
      })
      .select()

    if (error) {
      console.error('Error submitting survey:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in submitSatisfactionSurvey:', error)
    throw error
  }
}

// Get satisfaction survey results for a constituency
export const getSatisfactionResults = async (constituencyId: number) => {
  try {
    const { data, error } = await supabase
      .from('satisfaction_surveys')
      .select('answer')
      .eq('constituency_id', constituencyId)

    if (error) {
      console.error('Error fetching satisfaction results:', error)
      throw error
    }

    const yesCount = data?.filter(s => s.answer === true).length || 0
    const noCount = data?.filter(s => s.answer === false).length || 0

    return { yesCount, noCount }
  } catch (error) {
    console.error('Error in getSatisfactionResults:', error)
    throw error
  }
}

// Generate referral code
const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Get user tier information
export const getUserTierInfo = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('tier_level, engagement_score')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user tier info:', error)
      throw error
    }

    return {
      tierLevel: data.tier_level,
      engagementScore: data.engagement_score
    }
  } catch (error) {
    console.error('Error in getUserTierInfo:', error)
    throw error
  }
} 