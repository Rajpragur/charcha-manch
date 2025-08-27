import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../configs/firebase';
import { storage } from '../configs/firebase';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

// Types for Firebase data
export interface FirebaseUserProfile {
  id: string;
  display_name?: string;
  bio?: string;
  phone_number?: string;
  first_vote_year?: number;
  referral_code?: string;
  referred_by?: string;
  tier_level: number;
  engagement_score: number;
  constituency_id?: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface FirebaseSatisfactionSurvey {
  id?: string;
  user_id: string;
  constituency_id: number;
  candidate_id?: number;
  question: string;
  answer: boolean;
  created_at: Timestamp;
}

export interface FirebaseConstituencyInteraction {
  id?: string;
  user_id: string;
  constituency_id: number;
  interaction_type: 'view' | 'share' | 'comment' | 'survey';
  created_at: Timestamp;
}

export interface FirebaseGlobalStats {
  id?: string;
  total_users: number;
  level1_users: number;
  level2_users: number;
  level3_users: number;
  level4_users: number;
  total_constituencies: number;
  last_calculated: Timestamp;
  created_at: Timestamp;
}

export interface FirebaseConstituencyScores {
  id?: string;
  constituency_id: number;
  satisfaction_yes: number;
  satisfaction_no: number;
  satisfaction_total: number;
  interaction_count: number;
  manifesto_average?: number;
  last_updated: Timestamp;
  created_at: Timestamp;
}

export interface FirebaseDepartmentRating {
  id?: string;
  user_id: string;
  constituency_id: number;
  department: string; // accept any department label from data
  rating: number; // 1..5
  created_at: Timestamp;
}

export interface FirebaseQuestionnaireSubmission {
  id?: string;
  user_id: string;
  constituency_id: number;
  satisfaction_vote: boolean; // true=yes, false=no
  department_ratings: Record<string, number>; // dept name -> rating 1..5
  manifesto_score: number; // 1..5
  created_at: Timestamp;
}

export interface FirebaseManifestoAverageScore {
  id?: string;
  constituency_id: number;
  average_score: number; // 1..5
  rating_count: number;
  last_updated: Timestamp;
  created_at: Timestamp;
}

export interface FirebaseDiscussionPost {
  id: string;
  title: string;
  titlefirst: string;
  titlesecond: string;
  content: string;
  constituency: number;
  constituencyName: string;
  userId: string;
  userName?: string;
  createdAt: any;
  updatedAt?: any;
  status: 'published' | 'under_review' | 'removed';
  likesCount?: number;
  commentsCount?: number;
  tags: string[];
  media: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }[];
}

export interface FirebaseConstituency {
  id: number;
  name: string;
  postCount: number;
}

// Firebase Service Class
export class FirebaseService {

  // Calculate user tier based on engagement score
  static calculateUserTier(engagementScore: number): number {
    if (engagementScore >= 100) return 4;
    if (engagementScore >= 50) return 3;
    if (engagementScore >= 20) return 2;
    if (engagementScore >= 1) return 1;
    return 0; // Start at tier 0
  }

  // Update user tier based on current engagement score
  static async updateUserTier(userId: string, engagementScore: number): Promise<void> {
    try {
      const newTier = this.calculateUserTier(engagementScore);
      await this.updateUserProfile(userId, {
        tier_level: newTier,
        engagement_score: engagementScore
      });
    } catch (error) {
      console.error('Error updating user tier:', error);
      throw error;
    }
  }

  // User Profile Operations
  static async getUserProfile(userId: string): Promise<FirebaseUserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'user_profiles', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as FirebaseUserProfile;
      }
      return null;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied accessing user profile, returning null');
        return null;
      }
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  static async createUserProfile(userId: string, profileData: Partial<FirebaseUserProfile>): Promise<string> {
    try {
      const { setDoc } = await import('firebase/firestore');
      const userRef = doc(db, 'user_profiles', userId);
      await setDoc(userRef, {
        ...profileData,
        id: userId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      }, { merge: true });
      return userId;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  static async updateUserProfile(userId: string, updateData: Partial<FirebaseUserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'user_profiles', userId);
      await setDoc(userRef, {
        ...updateData,
        updated_at: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Satisfaction Survey Operations
  static async checkExistingSurvey(userId: string, constituencyId: number): Promise<boolean> {
    try {
      const surveysRef = collection(db, 'satisfaction_surveys');
      const q = query(
        surveysRef,
        where('user_id', '==', userId),
        where('constituency_id', '==', constituencyId)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied checking existing survey, assuming no existing survey');
        return false;
      }
      console.error('Error checking existing survey:', error);
      return false;
    }
  }

  static async submitSatisfactionSurvey(surveyData: Omit<FirebaseSatisfactionSurvey, 'id' | 'created_at'>): Promise<string> {
    try {
      const surveysRef = collection(db, 'satisfaction_surveys');
      const newSurvey = await addDoc(surveysRef, {
        ...surveyData,
        created_at: serverTimestamp()
      });
      return newSurvey.id;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.error('Permission denied submitting satisfaction survey');
        throw new Error('Permission denied: Cannot submit survey');
      }
      console.error('Error submitting satisfaction survey:', error);
      throw error;
    }
  }

  // Constituency Interaction Operations
  static async checkExistingInteraction(userId: string, constituencyId: number, interactionType: string): Promise<boolean> {
    try {
      const interactionsRef = collection(db, 'constituency_interactions');
      const q = query(
        interactionsRef,
        where('user_id', '==', userId),
        where('constituency_id', '==', constituencyId),
        where('interaction_type', '==', interactionType)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied checking existing interaction, assuming no existing interaction');
        return false;
      }
      console.error('Error checking existing interaction:', error);
      return false;
    }
  }

  static async trackInteraction(interactionData: Omit<FirebaseConstituencyInteraction, 'id' | 'created_at'>): Promise<string> {
    try {
      const interactionsRef = collection(db, 'constituency_interactions');
      const newInteraction = await addDoc(interactionsRef, {
        ...interactionData,
        created_at: serverTimestamp()
      });
      return newInteraction.id;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.error('Permission denied tracking interaction');
        throw new Error('Permission denied: Cannot track interaction');
      }
      console.error('Error tracking interaction:', error);
      throw error;
    }
  }

  // User Interactions and Surveys Loading
  static async loadUserInteractions(userId: string): Promise<{ surveys: FirebaseSatisfactionSurvey[], interactions: FirebaseConstituencyInteraction[] }> {
    try {
      const surveysRef = collection(db, 'satisfaction_surveys');
      const interactionsRef = collection(db, 'constituency_interactions');

      const surveysQuery = query(surveysRef, where('user_id', '==', userId));
      const interactionsQuery = query(interactionsRef, where('user_id', '==', userId));

      const [surveysSnapshot, interactionsSnapshot] = await Promise.all([
        getDocs(surveysQuery),
        getDocs(interactionsQuery)
      ]);

      const surveys = surveysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirebaseSatisfactionSurvey);
      const interactions = interactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FirebaseConstituencyInteraction);

      return { surveys, interactions };
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied accessing user interactions, returning empty arrays');
        return { surveys: [], interactions: [] };
      }
      console.error('Error loading user interactions:', error);
      return { surveys: [], interactions: [] };
    }
  }

  // Global Stats Operations
  static async getGlobalStats(): Promise<FirebaseGlobalStats | null> {
    try {
      // Prefer a single known doc to avoid watch-channel issues
      const knownDoc = await getDoc(doc(db, 'global_stats', 'latest'));
      if (knownDoc.exists()) {
        return { id: knownDoc.id, ...knownDoc.data() } as FirebaseGlobalStats;
      }

      // Fallback to query the newest one
      const statsRef = collection(db, 'global_stats');
      const q = query(statsRef, orderBy('last_calculated', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as FirebaseGlobalStats;
      }

      // Return default stats if no data available
      return {
        id: 'default',
        total_users: 0,
        level1_users: 0,
        level2_users: 0,
        level3_users: 0,
        level4_users: 0,
        total_constituencies: 243,
        last_calculated: Timestamp.now(),
        created_at: Timestamp.now()
      };
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied accessing global stats, returning defaults');
        // Return default stats on permission error
        return {
          id: 'default',
          total_users: 0,
          level1_users: 0,
          level2_users: 0,
          level3_users: 0,
          level4_users: 0,
          total_constituencies: 243,
          last_calculated: Timestamp.now(),
          created_at: Timestamp.now()
        };
      }
      console.error('Error getting global stats:', error);
      return null;
    }
  }

  // Discussion Posts Operations
  static async getUserPosts(userId: string): Promise<any[]> {
    try {
      const postsRef = collection(db, 'discussion_posts');
      
      // First, let's try to get all posts to see what's in the collection
      console.log(`🔍 Attempting to get posts for userId: ${userId}`);
      
      try {
        // Try to get all posts first to debug
        const allPostsQuery = query(postsRef);
        const allPostsSnapshot = await getDocs(allPostsQuery);
        console.log(`📊 Total posts in collection: ${allPostsSnapshot.size}`);
        
        if (allPostsSnapshot.size > 0) {
          console.log('📝 Sample post structure:', allPostsSnapshot.docs[0].data());
        }
      } catch (debugError) {
        console.log('⚠️ Could not get all posts (might be permission issue):', debugError);
      }
      
      // Now try to get user-specific posts
      const postsQuery = query(postsRef, where('userId', '==', userId));
      const postsSnapshot = await getDocs(postsQuery);

      console.log(`🔍 Searching for posts with userId: ${userId}`);
      console.log(`📊 Found ${postsSnapshot.size} posts for this user`);
      
      const posts = postsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`📝 Post data:`, { id: doc.id, ...data });
        return { id: doc.id, ...data };
      });

      return posts;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied accessing user posts, returning empty array');
        return [];
      }
      console.error('Error getting user posts:', error);
      return [];
    }
  }

  // Referrals Operations
  static async getUserReferrals(userId: string): Promise<any[]> {
    try {
      const referralsRef = collection(db, 'referrals');
      const referralsQuery = query(referralsRef, where('referred_by', '==', userId));
      const referralsSnapshot = await getDocs(referralsQuery);

      return referralsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied accessing user referrals, returning empty array');
        return [];
      }
      console.error('Error getting user referrals:', error);
      return [];
    }
  }

  // Generate a unique 6-character referral code
  static async generateReferralCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let isUnique = false;
    
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Check if code already exists
      const referralsRef = collection(db, 'referrals');
      const codeQuery = query(referralsRef, where('referral_code', '==', code));
      const snapshot = await getDocs(codeQuery);
      isUnique = snapshot.empty;
    } while (!isUnique);
    
    return code;
  }

  // Create referral relationship
  static async createReferral(referralData: {
    referred_user_id: string;
    referred_user_email: string;
    referred_user_name?: string;
    referral_code: string;
    referred_by: string;
  }): Promise<string> {
    try {
      const referralsRef = collection(db, 'referrals');
      const newReferral = await addDoc(referralsRef, {
        ...referralData,
        status: 'pending',
        created_at: serverTimestamp()
      });
      return newReferral.id;
    } catch (error) {
      console.error('Error creating referral:', error);
      throw error;
    }
  }

  // Update referral status
  static async updateReferralStatus(referralId: string, status: 'pending' | 'completed' | 'active'): Promise<void> {
    try {
      const referralRef = doc(db, 'referrals', referralId);
      await updateDoc(referralRef, {
        status,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating referral status:', error);
      throw error;
    }
  }

  // Get referrals by referral code
  static async getReferralsByCode(referralCode: string): Promise<any[]> {
    try {
      const referralsRef = collection(db, 'referrals');
      const referralsQuery = query(referralsRef, where('referral_code', '==', referralCode));
      const referralsSnapshot = await getDocs(referralsQuery);

      return referralsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting referrals by code:', error);
      return [];
    }
  }

  // Department Ratings Operations
  static async getDepartmentRatings(constituencyId: number): Promise<FirebaseDepartmentRating[]> {
    try {
      const ratingsRef = collection(db, 'department_ratings');
      const q = query(ratingsRef, where('constituency_id', '==', constituencyId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as FirebaseDepartmentRating[];
    } catch (error) {
      console.error('Error getting department ratings:', error);
      return [];
    }
  }

  static async getUserDepartmentRatings(userId: string, constituencyId: number): Promise<Record<string, number>> {
    try {
      const ratingsRef = collection(db, 'department_ratings');
      const q = query(ratingsRef, where('user_id', '==', userId), where('constituency_id', '==', constituencyId));
      const snapshot = await getDocs(q);
      const result: Record<string, number> = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as any;
        result[data.department] = data.rating;
      });
      return result;
    } catch (error) {
      console.error('Error getting user department ratings:', error);
      return {};
    }
  }

  static async submitDepartmentRating(ratingData: Omit<FirebaseDepartmentRating, 'id' | 'created_at'>): Promise<string> {
    try {
      const ratingsRef = collection(db, 'department_ratings');
      const newRating = await addDoc(ratingsRef, {
        ...ratingData,
        created_at: serverTimestamp()
      });
      return newRating.id;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.error('Permission denied submitting department rating');
        throw new Error('Permission denied: Cannot submit rating');
      }
      console.error('Error submitting department rating:', error);
      throw error;
    }
  }

  // One-time Questionnaire Submission Operations
  static async hasSubmittedQuestionnaire(userId: string, constituencyId: number): Promise<boolean> {
    try {
      const submissionsRef = collection(db, 'questionnaire_submissions');
      const q = query(
        submissionsRef,
        where('user_id', '==', userId),
        where('constituency_id', '==', constituencyId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied checking questionnaire submission, assuming not submitted');
        return false;
      }
      console.error('Error checking questionnaire submission:', error);
      return false;
    }
  }

  static async submitQuestionnaire(submission: Omit<FirebaseQuestionnaireSubmission, 'id' | 'created_at'>): Promise<string> {
    try {
      const submissionsRef = collection(db, 'questionnaire_submissions');
      const newDoc = await addDoc(submissionsRef, {
        ...submission,
        created_at: serverTimestamp()
      });
      return newDoc.id;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.error('Permission denied submitting questionnaire');
        throw new Error('Permission denied: Cannot submit questionnaire');
      }
      console.error('Error submitting questionnaire:', error);
      throw error;
    }
  }

  static async getSubmittedQuestionnaire(userId: string, constituencyId: number): Promise<FirebaseQuestionnaireSubmission | null> {
    try {
      const submissionsRef = collection(db, 'questionnaire_submissions');
      const q = query(
        submissionsRef,
        where('user_id', '==', userId),
        where('constituency_id', '==', constituencyId)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as FirebaseQuestionnaireSubmission;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied getting submitted questionnaire, assuming not submitted');
        return null;
      }
      console.error('Error getting submitted questionnaire:', error);
      return null;
    }
  }

  static async getAllUsers(): Promise<any[]> {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      if (snapshot.empty) {
        console.log('No users found in users collection');
        return [];
      }
      
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ Successfully fetched ${usersData.length} users`);
      return usersData;
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.warn('Permission denied accessing users collection - admin access required');
        throw new Error('Admin access required to view users');
      }
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Alternative: Get users from user_profiles collection (more likely to have data)
  static async getAllUserProfiles(): Promise<any[]> {
    try {
      const profilesRef = collection(db, 'user_profiles');
      const snapshot = await getDocs(profilesRef);
      
      if (snapshot.empty) {
        console.log('No user profiles found in user_profiles collection');
        return [];
      }
      
      const profilesData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      
      console.log(`✅ Successfully fetched ${profilesData.length} user profiles`);
      return profilesData;
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        console.warn('Permission denied accessing user_profiles collection');
        throw new Error('Cannot access user profiles');
      }
      console.error('Error fetching user profiles:', error);
      throw error;
    }
  }

  // Get news by constituency or candidate
  static async getNewsByConstituency(constituencyName: string): Promise<any[]> {
    try {
      const newsRef = collection(db, 'constituency_news');
      const q = query(
        newsRef,
        where('constituencyName', '==', constituencyName),
        where('status', '==', 'published')
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      const newsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Sort by priority (high first) and then by creation date (newest first)
      return newsData.sort((a: any, b: any) => {
        const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 1;
        const bPriority = priorityOrder[b.priority] || 1;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (error: any) {
      console.error('Error fetching news by constituency:', error);
      return [];
    }
  }

  // Get news by candidate
  static async getNewsByCandidate(candidateName: string): Promise<any[]> {
    try {
      const newsRef = collection(db, 'constituency_news');
      const q = query(
        newsRef,
        where('candidateName', '==', candidateName),
        where('status', '==', 'published')
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      const newsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Sort by priority and creation date
      return newsData.sort((a: any, b: any) => {
        const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 1;
        const bPriority = priorityOrder[b.priority] || 1;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (error: any) {
      console.error('Error fetching news by candidate:', error);
      return [];
    }
  }

  // Get all published news
  static async getAllPublishedNews(): Promise<any[]> {
    try {
      const newsRef = collection(db, 'constituency_news');
      const q = query(
        newsRef,
        where('status', '==', 'published')
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }
      
      const newsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Sort by priority and creation date
      return newsData.sort((a: any, b: any) => {
        const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 1;
        const bPriority = priorityOrder[b.priority] || 1;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (error: any) {
      console.error('Error fetching all published news:', error);
      return [];
    }
  }

  // Get constituency data from database (replaces static JSON files)
  static async getConstituencyData(language: 'hindi' | 'english' = 'english'): Promise<any[]> {
    try {
      const collectionName = language === 'hindi' ? 'constituency_data_hindi' : 'constituency_data_english';
      const dataRef = collection(db, collectionName);
      
      // Try to get data from database first
      const snapshot = await getDocs(dataRef);
      
      if (!snapshot.empty) {
        // Data exists in database, return it
        const data = snapshot.docs
          .map(doc => doc.data())
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        console.log(`✅ Fetched ${data.length} constituencies from database (${language})`);
        return data;
      } else {
        // No data in database, fallback to static files
        console.log(`⚠️ No data in database, falling back to static files (${language})`);
        return [];
      }
    } catch (error: any) {
      console.error(`Error fetching constituency data (${language}):`, error);
      // Fallback to static files on error
      return [];
    }
  }

  // Get constituency data by name from database
  static async getConstituencyByName(constituencyName: string, language: 'hindi' | 'english' = 'english'): Promise<any | null> {
    try {
      const collectionName = language === 'hindi' ? 'constituency_data_hindi' : 'constituency_data_english';
      const dataRef = collection(db, collectionName);
      
      // Query by area_name
      const q = query(dataRef, where('area_name', '==', constituencyName));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return snapshot.docs[0].data();
      }
      
      return null;
    } catch (error: any) {
      console.error(`Error fetching constituency by name (${language}):`, error);
      return null;
    }
  }

  // Manifesto score aggregation
  static async recalcAndUpdateManifestoAverageScore(constituencyId: number): Promise<FirebaseManifestoAverageScore | null> {
    try {
      const submissionsRef = collection(db, 'questionnaire_submissions');
      const q = query(submissionsRef, where('constituency_id', '==', constituencyId));
      const snapshot = await getDocs(q);
      let total = 0;
      let count = 0;
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as any;
        if (typeof data.manifesto_score === 'number') {
          total += data.manifesto_score;
          count += 1;
        }
      });
      const average = count > 0 ? Number((total / count).toFixed(2)) : 0;

      // Upsert into manifesto_scores
      const scoresRef = collection(db, 'manifesto_scores');
      const q2 = query(scoresRef, where('constituency_id', '==', constituencyId));
      const snapshot2 = await getDocs(q2);
      if (!snapshot2.empty) {
        const docRef = doc(db, 'manifesto_scores', snapshot2.docs[0].id);
        await updateDoc(docRef, {
          average_score: average,
          rating_count: count,
          last_updated: serverTimestamp()
        });
        return {
          id: snapshot2.docs[0].id,
          constituency_id: constituencyId,
          average_score: average,
          rating_count: count,
          last_updated: Timestamp.now(),
          created_at: Timestamp.now()
        };
      } else {
        const newDoc = await addDoc(scoresRef, {
          constituency_id: constituencyId,
          average_score: average,
          rating_count: count,
          last_updated: serverTimestamp(),
          created_at: serverTimestamp()
        });
        return {
          id: newDoc.id,
          constituency_id: constituencyId,
          average_score: average,
          rating_count: count,
          last_updated: Timestamp.now(),
          created_at: Timestamp.now()
        };
      }
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied updating manifesto average score');
        return null;
      }
      console.error('Error updating manifesto average score:', error);
      return null;
    }
  }

  static async getManifestoAverageScore(constituencyId: number): Promise<{ average: number; count: number } | null> {
    try {
      const scoresRef = collection(db, 'manifesto_scores');
      const q = query(scoresRef, where('constituency_id', '==', constituencyId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as any;
        return { average: data.average_score || 0, count: data.rating_count || 0 };
      }
      return { average: 0, count: 0 };
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied getting manifesto average score');
        return null;
      }
      console.error('Error getting manifesto average score:', error);
      return null;
    }
  }

  // Initialize constituency scores for all constituencies
  static async initializeConstituencyScores(): Promise<void> {
    try {
      console.log('🔄 Initializing constituency scores for all constituencies...');

      const scoresRef = collection(db, 'constituency_scores');
      
      // First, check which constituencies already exist
      const existingQuery = query(scoresRef, where('constituency_id', '>=', 1), where('constituency_id', '<=', 243));
      const existingSnapshot = await getDocs(existingQuery);
      
      const existingIds = new Set(existingSnapshot.docs.map(doc => doc.data().constituency_id));
      console.log(`📊 Found ${existingIds.size} existing constituencies out of 243`);
      
      // Only create missing constituencies
      const missingConstituencies = [];
      for (let i = 1; i <= 243; i++) {
        if (!existingIds.has(i)) {
          missingConstituencies.push(i);
        }
      }
      
      if (missingConstituencies.length === 0) {
        console.log('✅ All 243 constituencies already exist, no initialization needed');
        return;
      }
      
      console.log(`📝 Creating ${missingConstituencies.length} missing constituencies: ${missingConstituencies.join(', ')}`);
      
      const batch = writeBatch(db);
      
      // Create only missing constituencies
      for (const constituencyId of missingConstituencies) {
        const scoreDoc = doc(scoresRef);
        batch.set(scoreDoc, {
          constituency_id: constituencyId,
          satisfaction_yes: 0,
          satisfaction_no: 0,
          satisfaction_total: 0,
          interaction_count: 0,
          manifesto_average: 0,
          last_updated: serverTimestamp(),
          created_at: serverTimestamp()
        });
      }

      await batch.commit();
      console.log(`✅ Successfully created ${missingConstituencies.length} missing constituency scores`);
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.error('Permission denied initializing constituency scores');
        throw new Error('Permission denied: Cannot initialize scores');
      }
      console.error('Error initializing constituency scores:', error);
      throw error;
    }
  }

  // Get only essential constituency data (manifesto scores and interaction counts) to reduce database load
  static async getConstituencyEssentials(): Promise<{ constituency_id: number; manifesto_average: number; interaction_count: number }[]> {
    try {
      const scoresRef = collection(db, 'constituency_scores');
      const q = query(scoresRef, orderBy('constituency_id', 'asc'));
      const querySnapshot = await getDocs(q);

      const essentials = querySnapshot.docs.map(doc => ({
        constituency_id: doc.data().constituency_id,
        manifesto_average: doc.data().manifesto_average || 0,
        interaction_count: doc.data().interaction_count || 0
      }));

      console.log(`📊 Loaded ${essentials.length} constituency essentials from database`);
      return essentials;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied accessing constituency essentials, returning empty array');
        return [];
      }
      console.error('Error getting constituency essentials:', error);
      return [];
    }
  }

  // Get constituency data including satisfaction votes for Charchit Vidhan Sabha
  static async getConstituencyDataWithSatisfaction(): Promise<{ 
    constituency_id: number; 
    manifesto_average: number; 
    interaction_count: number;
    satisfaction_yes: number;
    satisfaction_no: number;
    satisfaction_total: number;
  }[]> {
    try {
      const scoresRef = collection(db, 'constituency_scores');
      const q = query(scoresRef, orderBy('constituency_id', 'asc'));
      const querySnapshot = await getDocs(q);

      const data = querySnapshot.docs.map(doc => ({
        constituency_id: doc.data().constituency_id,
        manifesto_average: doc.data().manifesto_average || 0,
        interaction_count: doc.data().interaction_count || 0,
        satisfaction_yes: doc.data().satisfaction_yes || 0,
        satisfaction_no: doc.data().satisfaction_no || 0,
        satisfaction_total: doc.data().satisfaction_total || 0
      }));

      console.log(`📊 Loaded ${data.length} constituency data with satisfaction from database`);
      return data;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied accessing constituency data with satisfaction, returning empty array');
        return [];
      }
      console.error('Error getting constituency data with satisfaction:', error);
      return [];
    }
  }

  // Check database health and validate constituency scores
  static async checkDatabaseHealth(): Promise<{ isHealthy: boolean; validCount: number; totalCount: number; issues: string[] }> {
    try {
      const scoresRef = collection(db, 'constituency_scores');
      const querySnapshot = await getDocs(scoresRef);
      const totalCount = querySnapshot.docs.length;

      const issues: string[] = [];
      let validCount = 0;

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const constituencyId = data.constituency_id;

        if (constituencyId < 1 || constituencyId > 243) {
          issues.push(`Invalid constituency_id: ${constituencyId}`);
        } else if (data.manifesto_average === undefined) {
          issues.push(`Missing manifesto_average for constituency ${constituencyId}`);
        } else {
          validCount++;
        }
      });

      const isHealthy = validCount === 243 && issues.length === 0;

      return {
        isHealthy,
        validCount,
        totalCount,
        issues
      };
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.error('Permission denied checking database health');
        return {
          isHealthy: false,
          validCount: 0,
          totalCount: 0,
          issues: ['Permission denied: Cannot access database']
        };
      }
      console.error('Error checking database health:', error);
      return {
        isHealthy: false,
        validCount: 0,
        totalCount: 0,
        issues: [`Error: ${error.message}`]
      };
    }
  }

  // Clear all constituency scores (for database cleanup)
  static async clearAllConstituencyScores(): Promise<void> {
    try {
      console.log('🗑️ Clearing all constituency scores...');

      const scoresRef = collection(db, 'constituency_scores');
      const querySnapshot = await getDocs(scoresRef);

      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ Cleared ${querySnapshot.docs.length} constituency scores`);
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.error('Permission denied clearing constituency scores');
        throw new Error('Permission denied: Cannot clear scores');
      }
      console.error('Error clearing constituency scores:', error);
      throw error;
    }
  }

  // Clean up duplicate constituency scores and keep only valid ones (1-243)
  static async cleanupDuplicateConstituencyScores(): Promise<void> {
    try {
      console.log('🧹 Cleaning up duplicate constituency scores...');

      const scoresRef = collection(db, 'constituency_scores');
      const querySnapshot = await getDocs(scoresRef);

      // Group by constituency_id to find duplicates
      const constituencyGroups = new Map<number, any[]>();
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const constituencyId = data.constituency_id;
        
        if (!constituencyGroups.has(constituencyId)) {
          constituencyGroups.set(constituencyId, []);
        }
        constituencyGroups.get(constituencyId)!.push({ doc, data });
      });

      const batch = writeBatch(db);
      let deletedCount = 0;
      let keptCount = 0;

      // For each constituency, keep the best document and delete duplicates
      for (const [constituencyId, docs] of constituencyGroups) {
        if (constituencyId < 1 || constituencyId > 243) {
          // Delete invalid constituency IDs
          docs.forEach(({ doc }) => {
            batch.delete(doc.ref);
            deletedCount++;
          });
        } else if (docs.length > 1) {
          // Keep the document with the most data, delete others
          const bestDoc = docs.reduce((best, current) => {
            const bestScore = (best.data.interaction_count || 0) + (best.data.manifesto_average || 0);
            const currentScore = (current.data.interaction_count || 0) + (current.data.manifesto_average || 0);
            return currentScore > bestScore ? current : best;
          });
          
          docs.forEach(({ doc }) => {
            if (doc.id !== bestDoc.doc.id) {
              batch.delete(doc.ref);
              deletedCount++;
            } else {
              keptCount++;
            }
          });
        } else {
          // Single document, keep it
          keptCount++;
        }
      }

      if (deletedCount > 0) {
        await batch.commit();
        console.log(`✅ Cleaned up ${deletedCount} duplicate/invalid documents, kept ${keptCount} valid documents`);
      } else {
        console.log('✅ No cleanup needed, all documents are valid');
      }
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.error('Permission denied cleaning up constituency scores');
        throw new Error('Permission denied: Cannot cleanup scores');
      }
      console.error('Error cleaning up constituency scores:', error);
      throw error;
    }
  }

  // Migrate existing constituency scores to include manifesto_average field
  static async migrateConstituencyScores(): Promise<void> {
    try {
      console.log('🔄 Migrating existing constituency scores to include manifesto_average...');

      const scoresRef = collection(db, 'constituency_scores');
      const querySnapshot = await getDocs(scoresRef);

      const batch = writeBatch(db);
      let updateCount = 0;

      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.manifesto_average === undefined) {
          batch.update(doc.ref, {
            manifesto_average: 0
          });
          updateCount++;
        }
      });

      if (updateCount > 0) {
        await batch.commit();
        console.log(`✅ Successfully migrated ${updateCount} constituency scores`);
      } else {
        console.log('✅ All constituency scores already have manifesto_average field');
      }
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.error('Permission denied migrating constituency scores');
        throw new Error('Permission denied: Cannot migrate scores');
      }
      console.error('Error migrating constituency scores:', error);
      throw error;
    }
  }

  // Get all constituency scores at once
  static async getAllConstituencyScores(): Promise<FirebaseConstituencyScores[]> {
    try {
      const scoresRef = collection(db, 'constituency_scores');
      const q = query(scoresRef, orderBy('constituency_id', 'asc'));
      const querySnapshot = await getDocs(q);

      const scores = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseConstituencyScores[];

      console.log(`📊 Loaded ${scores.length} constituency scores from database`);
      return scores;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied accessing constituency scores, returning empty array');
        return [];
      }
      console.error('Error getting all constituency scores:', error);
      return [];
    }
  }

  // Constituency Scores Operations
  static async getConstituencyScores(constituencyId: number): Promise<FirebaseConstituencyScores | null> {
    try {
      const scoresRef = collection(db, 'constituency_scores');
      const q = query(scoresRef, where('constituency_id', '==', constituencyId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as FirebaseConstituencyScores;
      }
      return null;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied accessing constituency scores, returning null');
        return null;
      }
      console.error('Error getting constituency scores:', error);
      return null;
    }
  }

  static async updateConstituencyScores(constituencyId: number, scores: {
    satisfaction_yes: number;
    satisfaction_no: number;
    satisfaction_total: number;
    interaction_count: number;
  }): Promise<void> {
    try {
      const scoresRef = collection(db, 'constituency_scores');
      const q = query(scoresRef, where('constituency_id', '==', constituencyId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Update existing document
        const docRef = doc(db, 'constituency_scores', querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          ...scores,
          last_updated: serverTimestamp()
        });
      } else {
        // Create new document
        await addDoc(scoresRef, {
          constituency_id: constituencyId,
          ...scores,
          last_updated: serverTimestamp(),
          created_at: serverTimestamp()
        });
      }
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.error('Permission denied updating constituency scores');
        throw new Error('Permission denied: Cannot update scores');
      }
      console.error('Error updating constituency scores:', error);
      throw error;
    }
  }

  // Manifesto average via incremental update using interaction_count
  static async updateManifestoAverageIncrement(constituencyId: number, newScore: number): Promise<void> {
    try {
      const scoresRef = collection(db, 'constituency_scores');
      const q = query(scoresRef, where('constituency_id', '==', constituencyId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const existing: any = docSnap.data();
        const currentCount: number = typeof existing.interaction_count === 'number' ? existing.interaction_count : 0;
        const currentAvg: number = typeof existing.manifesto_average === 'number' ? existing.manifesto_average : 0;
        const newCount = currentCount + 1;

        let updatedAvg = currentAvg;
        // If newScore is 0, just increment count without changing average
        if (newScore > 0) {
          updatedAvg = Number(((currentAvg * currentCount + newScore) / newCount).toFixed(2));
        }

        const docRef = doc(db, 'constituency_scores', docSnap.id);
        await updateDoc(docRef, {
          manifesto_average: updatedAvg,
          interaction_count: newCount,
          last_updated: serverTimestamp()
        });
      } else {
        // Create with initial values if not present
        await addDoc(scoresRef, {
          constituency_id: constituencyId,
          satisfaction_yes: 0,
          satisfaction_no: 0,
          satisfaction_total: 0,
          interaction_count: 1,
          manifesto_average: newScore > 0 ? Number(newScore.toFixed(2)) : 0,
          last_updated: serverTimestamp(),
          created_at: serverTimestamp()
        });
      }
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.error('Permission denied updating manifesto average');
        throw new Error('Permission denied: Cannot update manifesto average');
      }
      console.error('Error updating manifesto average:', error);
      throw error;
    }
  }

  // Update satisfaction vote counts for a constituency
  static async updateSatisfactionVote(constituencyId: number, vote: 'yes' | 'no'): Promise<void> {
    try {
      console.log(`🗳️ Updating satisfaction vote for constituency ${constituencyId}: ${vote}`);
      
      const scoresRef = collection(db, 'constituency_scores');
      const q = query(scoresRef, where('constituency_id', '==', constituencyId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const docRef = doc(db, 'constituency_scores', snapshot.docs[0].id);
        const currentData = snapshot.docs[0].data();
        
        const currentYesVotes = currentData.satisfaction_yes || 0;
        const currentNoVotes = currentData.satisfaction_no || 0;
        
        // Update the appropriate vote count
        const updateData: any = {
          last_updated: serverTimestamp()
        };
        
        if (vote === 'yes') {
          updateData.satisfaction_yes = currentYesVotes + 1;
        } else {
          updateData.satisfaction_no = currentNoVotes + 1;
        }
        
        // Update total satisfaction votes
        updateData.satisfaction_total = (updateData.satisfaction_yes || currentYesVotes) + (updateData.satisfaction_no || currentNoVotes);
        
        await updateDoc(docRef, updateData);
        
        console.log(`✅ Updated constituency ${constituencyId} satisfaction votes: yes=${updateData.satisfaction_yes || currentYesVotes}, no=${updateData.satisfaction_no || currentNoVotes}, total=${updateData.satisfaction_total}`);
      } else {
        console.warn(`⚠️ No constituency score document found for constituency ${constituencyId}`);
      }
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.error('Permission denied updating satisfaction vote');
        throw new Error('Permission denied: Cannot update satisfaction vote');
      }
      console.error('Error updating satisfaction vote:', error);
      throw error;
    }
  }

  // Satisfaction Results aggregation
  static async getSatisfactionResults(constituencyId: number): Promise<{ yesCount: number; noCount: number; }> {
    try {
      const surveysRef = collection(db, 'satisfaction_surveys');
      const q = query(surveysRef, where('constituency_id', '==', constituencyId));
      const snapshot = await getDocs(q);
      let yesCount = 0;
      let noCount = 0;
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as any;
        if (data.answer === true) yesCount += 1;
        else if (data.answer === false) noCount += 1;
      });
      return { yesCount, noCount };
    } catch (error) {
      console.error('Error getting satisfaction results:', error);
      return { yesCount: 0, noCount: 0 };
    }
  }

  // Delete user profile
  static async deleteUserProfile(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'user_profiles', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        // Firestore doesn't support true deletes in this wrapper without import of deleteDoc; reuse update with tombstone or add deleteDoc
      }
      // Import deleteDoc lazily to avoid large import list
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(userRef);
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  }

  // Blog Operations
  static async getAllBlogs(): Promise<any[]> {
    try {
      const blogsRef = collection(db, 'blogs');
      const q = query(blogsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const blogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`📝 Loaded ${blogs.length} blogs from database`);
      return blogs;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied accessing blogs, returning empty array');
        return [];
      }
      console.error('Error getting blogs:', error);
      return [];
    }
  }

  static async getPublishedBlogs(): Promise<any[]> {
    try {
      console.log('🔍 getPublishedBlogs: Starting to fetch blogs...');
      
      const blogsRef = collection(db, 'blogs');
      console.log('🔍 getPublishedBlogs: Collection reference created');
      
      // First try to get all blogs to see what's available
      const allBlogsQuery = query(blogsRef);
      const allBlogsSnapshot = await getDocs(allBlogsQuery);
      console.log(`🔍 getPublishedBlogs: Found ${allBlogsSnapshot.size} total blogs in collection`);
      
      if (allBlogsSnapshot.size === 0) {
        console.log('🔍 getPublishedBlogs: No blogs found in collection');
        return [];
      }
      
      // Log the first blog to see its structure
      const firstBlog = allBlogsSnapshot.docs[0];
      if (firstBlog) {
        console.log('🔍 getPublishedBlogs: First blog data:', firstBlog.data());
        console.log('🔍 getPublishedBlogs: First blog status:', firstBlog.data().status);
      }
      
      // Now try to get published blogs
      const q = query(
        blogsRef, 
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );
      console.log('🔍 getPublishedBlogs: Query created with status filter');
      
      const querySnapshot = await getDocs(q);
      console.log(`🔍 getPublishedBlogs: Published blogs query returned ${querySnapshot.size} results`);

      const blogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`📝 Loaded ${blogs.length} published blogs from database`);
      return blogs;
    } catch (error: any) {
      console.error('❌ getPublishedBlogs: Error details:', error);
      console.error('❌ getPublishedBlogs: Error code:', error.code);
      console.error('❌ getPublishedBlogs: Error message:', error.message);
      
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied accessing published blogs, returning empty array');
        return [];
      }
      
              // If there's an error with the status filter, try getting all blogs
        try {
          console.log('🔄 getPublishedBlogs: Trying to get all blogs without status filter...');
          const blogsRef = collection(db, 'blogs');
          const allBlogsQuery = query(blogsRef, orderBy('createdAt', 'desc'));
          const allBlogsSnapshot = await getDocs(allBlogsQuery);
          
          const allBlogs = allBlogsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log(`🔄 getPublishedBlogs: Successfully loaded ${allBlogs.length} blogs without status filter`);
          
          // Filter to only show published blogs from the fallback results
          const publishedBlogs = allBlogs.filter((blog: any) => blog.status === 'published');
          console.log(`🔄 getPublishedBlogs: Filtered to ${publishedBlogs.length} published blogs from fallback`);
          
          return publishedBlogs;
        } catch (fallbackError) {
          console.error('❌ getPublishedBlogs: Fallback also failed:', fallbackError);
          return [];
        }
    }
  }

  static async getBlogById(blogId: string): Promise<any | null> {
    try {
      const blogDoc = await getDoc(doc(db, 'blogs', blogId));
      if (blogDoc.exists()) {
        return { id: blogDoc.id, ...blogDoc.data() };
      }
      return null;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied accessing blog, returning null');
        return null;
      }
      console.error('Error getting blog:', error);
      return null;
    }
  }

  static async getBlogsByCategory(category: string): Promise<any[]> {
    try {
      const blogsRef = collection(db, 'blogs');
      const q = query(
        blogsRef, 
        where('status', '==', 'published'),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const blogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return blogs;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied accessing blogs by category, returning empty array');
        return [];
      }
      console.error('Error getting blogs by category:', error);
      return [];
    }
  }

  static async searchBlogs(searchTerm: string): Promise<any[]> {
    try {
      const blogsRef = collection(db, 'blogs');
      const q = query(
        blogsRef, 
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const blogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter blogs based on search term (title, excerpt, content)
      const filteredBlogs = blogs.filter(blog => {
        const searchLower = searchTerm.toLowerCase();
        const blogData = blog as any;
        return (
          blogData.title?.toLowerCase().includes(searchLower) ||
          blogData.excerpt?.toLowerCase().includes(searchLower) ||
          blogData.content?.toLowerCase().includes(searchLower)
        );
      });

      return filteredBlogs;
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.warn('Permission denied searching blogs, returning empty array');
        return [];
      }
      console.error('Error searching blogs:', error);
      return [];
    }
  }

  // Like/Unlike blog
  static async toggleBlogLike(blogId: string, userId: string): Promise<{ success: boolean; newLikeCount: number; isLiked: boolean }> {
    try {
      const blogRef = doc(db, 'blogs', blogId);
      const likeRef = doc(db, 'blog_likes', `${blogId}_${userId}`);
      
      // Check if user already liked this blog
      const likeDoc = await getDoc(likeRef);
      const isCurrentlyLiked = likeDoc.exists();
      
      if (isCurrentlyLiked) {
        // Unlike: remove like document and decrease count
        await deleteDoc(likeRef);
        
        // Update blog like count
        const blogDoc = await getDoc(blogRef);
        if (blogDoc.exists()) {
          const currentLikes = blogDoc.data().likes || 0;
          const newLikeCount = Math.max(0, currentLikes - 1);
          
          await updateDoc(blogRef, {
            likes: newLikeCount,
            updatedAt: serverTimestamp()
          });
          
          return {
            success: true,
            newLikeCount,
            isLiked: false
          };
        }
      } else {
        // Like: create like document and increase count
        await setDoc(likeRef, {
          blogId: blogId,
          userId: userId,
          createdAt: serverTimestamp()
        });
        
        // Update blog like count
        const blogDoc = await getDoc(blogRef);
        if (blogDoc.exists()) {
          const currentLikes = blogDoc.data().likes || 0;
          const newLikeCount = currentLikes + 1;
          
          await updateDoc(blogRef, {
            likes: newLikeCount,
            updatedAt: serverTimestamp()
          });
          
          return {
            success: true,
            newLikeCount,
            isLiked: true
          };
        }
      }
      
      return {
        success: false,
        newLikeCount: 0,
        isLiked: false
      };
    } catch (error: any) {
      console.error('Error toggling blog like:', error);
      return {
        success: false,
        newLikeCount: 0,
        isLiked: false
      };
    }
  }

  // Get user's liked blogs
  static async getUserLikedBlogs(userId: string): Promise<string[]> {
    try {
      if (!userId) {
        console.log('No user ID provided, returning empty array');
        return [];
      }
      
      const likesRef = collection(db, 'blog_likes');
      const q = query(likesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      console.log(`🔍 Found ${querySnapshot.size} likes for user ${userId}`);
      querySnapshot.docs.forEach(doc => {
        console.log('🔍 Like document:', doc.data());
      });
      
      const likedBlogIds = querySnapshot.docs.map(doc => doc.data().blogId);
      console.log('🔍 Liked blog IDs:', likedBlogIds);
      return likedBlogIds;
    } catch (error: any) {
      console.error('Error getting user liked blogs:', error);
      return [];
    }
  }

  // Get user's liked discussion posts
  static async getUserLikedDiscussionPosts(userId: string): Promise<string[]> {
    try {
      if (!userId) {
        console.log('No user ID provided, returning empty array');
        return [];
      }
      
      const likesRef = collection(db, 'post_likes');
      const q = query(likesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      console.log(`🔍 Found ${querySnapshot.size} discussion post likes for user ${userId}`);
      
      const likedPostIds = querySnapshot.docs.map(doc => doc.data().postId);
      console.log('🔍 Liked discussion post IDs:', likedPostIds);
      return likedPostIds;
    } catch (error: any) {
      console.error('Error getting user liked discussion posts:', error);
      return [];
    }
  }

  // Get user's viewed discussion posts
  static async getUserViewedDiscussionPosts(userId: string): Promise<string[]> {
    try {
      if (!userId) {
        console.log('No user ID provided, returning empty array');
        return [];
      }
      
      // Since there's no dedicated post_views collection, we'll use the constituency_interactions
      // where interaction_type is 'view' and it's related to discussion posts
      const interactionsRef = collection(db, 'discussion_posts');
      const q = query(
        interactionsRef, 
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      console.log(`🔍 Found ${querySnapshot.size} discussion posts created by user ${userId}`);
      
      // Return the count of posts created by user
      return Array(querySnapshot.size).fill('created');
    } catch (error: any) {
      console.error('Error getting user discussion posts:', error);
      return [];
    }
  }

  // Get user's comment count from discussion posts
  static async getUserCommentCount(userId: string): Promise<number> {
    try {
      if (!userId) {
        console.log('No user ID provided, returning 0');
        return 0;
      }
      
      // Get comments from constituency_interactions where interaction_type is 'comment'
      const interactionsRef = collection(db, 'constituency_interactions');
      const q = query(
        interactionsRef, 
        where('user_id', '==', userId),
        where('interaction_type', '==', 'comment')
      );
      const querySnapshot = await getDocs(q);
      
      console.log(`🔍 Found ${querySnapshot.size} comments by user ${userId}`);
      
      return querySnapshot.size;
    } catch (error: any) {
      console.error('Error getting user comment count:', error);
      return 0;
    }
  }

  // Get user's share count from discussion posts
  static async getUserShareCount(userId: string): Promise<number> {
    try {
      if (!userId) {
        console.log('No user ID provided, returning 0');
        return 0;
      }
      
      // Get shares from constituency_interactions where interaction_type is 'share'
      const interactionsRef = collection(db, 'constituency_interactions');
      const q = query(
        interactionsRef, 
        where('user_id', '==', userId),
        where('interaction_type', '==', 'share')
      );
      const querySnapshot = await getDocs(q);
      
      console.log(`🔍 Found ${querySnapshot.size} shares by user ${userId}`);
      
      return querySnapshot.size;
    } catch (error: any) {
      console.error('Error getting user share count:', error);
      return 0;
    }
  }

  // Get user's satisfaction survey count
  static async getUserSatisfactionSurveyCount(userId: string): Promise<number> {
    try {
      if (!userId) {
        console.log('No user ID provided, returning 0');
        return 0;
      }
      
      // Get satisfaction surveys from satisfaction_surveys collection
      const surveysRef = collection(db, 'satisfaction_surveys');
      const q = query(surveysRef, where('user_id', '==', userId));
      const querySnapshot = await getDocs(q);
      
      console.log(`🔍 Found ${querySnapshot.size} satisfaction surveys by user ${userId}`);
      
      return querySnapshot.size;
    } catch (error: any) {
      console.error('Error getting user satisfaction survey count:', error);
      return 0;
    }
  }

  // Get user's total interaction count
  static async getUserTotalInteractionCount(userId: string): Promise<number> {
    try {
      if (!userId) {
        console.log('No user ID provided, returning 0');
        return 0;
      }
      
      // Get all interactions from constituency_interactions
      const interactionsRef = collection(db, 'constituency_interactions');
      const q = query(interactionsRef, where('user_id', '==', userId));
      const interactionsSnapshot = await getDocs(q);
      
      // Get satisfaction surveys
      const surveysRef = collection(db, 'satisfaction_surveys');
      const surveysQuery = query(surveysRef, where('user_id', '==', userId));
      const surveysSnapshot = await getDocs(surveysQuery);
      
      // Get discussion posts
      const postsRef = collection(db, 'discussion_posts');
      const postsQuery = query(postsRef, where('userId', '==', userId));
      const postsSnapshot = await getDocs(postsQuery);
      
      // Get likes given
      const likesRef = collection(db, 'post_likes');
      const likesQuery = query(likesRef, where('userId', '==', userId));
      const likesSnapshot = await getDocs(likesQuery);
      
      const totalInteractions = interactionsSnapshot.size + surveysSnapshot.size + postsSnapshot.size + likesSnapshot.size;
      
      console.log(`🔍 Total interactions for user ${userId}: ${totalInteractions}`);
      
      return totalInteractions;
    } catch (error: any) {
      console.error('Error getting user total interaction count:', error);
      return 0;
    }
  }

  // Get blog like count
  static async getBlogLikeCount(blogId: string): Promise<number> {
    try {
      const blogDoc = await getDoc(doc(db, 'blogs', blogId));
      if (blogDoc.exists()) {
        return blogDoc.data().likes || 0;
      }
      return 0;
    } catch (error: any) {
      console.error('Error getting blog like count:', error);
      return 0;
    }
  }

  // Increment blog view count (one per user)
  static async incrementBlogViews(blogId: string, userId: string): Promise<void> {
    try {
      if (!userId) {
        console.log('No user ID provided, cannot track view');
        return;
      }

      const blogRef = doc(db, 'blogs', blogId);
      const viewRef = doc(db, 'blog_views', `${blogId}_${userId}`);
      
      // Check if user has already viewed this blog
      const viewDoc = await getDoc(viewRef);
      if (viewDoc.exists()) {
        console.log(`👁️ User ${userId} has already viewed blog ${blogId}`);
        return;
      }
      
      // Create view document to track this user's view
      await setDoc(viewRef, {
        blogId: blogId,
        userId: userId,
        createdAt: serverTimestamp()
      });
      
      // Increment blog view count
      const blogDoc = await getDoc(blogRef);
      if (blogDoc.exists()) {
        const currentViews = blogDoc.data().views || 0;
        await updateDoc(blogRef, {
          views: currentViews + 1,
          updatedAt: serverTimestamp()
        });
        console.log(`✅ Incremented views for blog ${blogId} to ${currentViews + 1} (first view from user ${userId})`);
      }
    } catch (error: any) {
      console.error('Error incrementing blog views:', error);
    }
  }

  // Discussion Forum Methods
  static async getDiscussionPost(postId: string): Promise<any | null> {
    try {
      const postRef = doc(db, 'discussion_posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        return null;
      }
      
      const postData = postDoc.data() as FirebaseDiscussionPost;
      
      // Enrich post with user and constituency data
      try {
        const userProfile = await this.getUserProfile(postData.userId);
        const constituencyName = await this.getConstituencyName(postData.constituency);
        
        return {
          ...postData,
          id: postDoc.id,
          userName: postData.userName || userProfile?.display_name || 'User',
          userConstituency: userProfile?.constituency_id,
          constituencyName: constituencyName || `Constituency ${postData.constituency}`,
          interactionsCount: (postData.likesCount || 0) + (postData.commentsCount || 0)
        };
      } catch (error) {
        console.error('Error enriching post:', error);
        return {
          ...postData,
          id: postDoc.id,
          userName: postData.userName || 'User',
          constituencyName: `Constituency ${postData.constituency}`,
          interactionsCount: (postData.likesCount || 0) + (postData.commentsCount || 0)
        };
      }
    } catch (error: any) {
      console.error('Error getting discussion post:', error);
      return null;
    }
  }

  static async getDiscussionPosts(): Promise<any[]> {
    try {
      const postsRef = collection(db, 'discussion_posts');
      
      // Get all posts without ordering to avoid index issues
      const querySnapshot = await getDocs(postsRef);

      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseDiscussionPost[];

      // Filter posts by status after fetching
      const filteredPosts = posts.filter(post => 
        post.status === 'published' || post.status === 'under_review'
      );

      // Enrich posts with user and constituency data
      const enrichedPosts = await Promise.all(
        filteredPosts.map(async (post) => {
          try {
            // Get user profile
            const userProfile = await this.getUserProfile(post.userId);
            
            // Get constituency name
            const constituencyName = await this.getConstituencyName(post.constituency);
            
            return {
              ...post,
              userName: post.userName || userProfile?.display_name || 'User',
              userConstituency: userProfile?.constituency_id,
              constituencyName: constituencyName || `Constituency ${post.constituency}`,
              interactionsCount: (post.likesCount || 0) + (post.commentsCount || 0)
            };
          } catch (error) {
            console.error('Error enriching post:', error);
            return {
              ...post,
              userName: post.userName || 'User',
              constituencyName: `Constituency ${post.constituency}`,
              interactionsCount: (post.likesCount || 0) + (post.commentsCount || 0)
            };
          }
        })
      );

      // Sort posts by createdAt in memory instead of in query
      enrichedPosts.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return bTime.getTime() - aTime.getTime(); // Newest first
      });

      return enrichedPosts;
    } catch (error: any) {
      console.error('Error getting discussion posts:', error);
      return [];
    }
  }

  static async getConstituenciesWithPostCounts(): Promise<FirebaseConstituency[]> {
    try {
      const postsRef = collection(db, 'discussion_posts');
      const q = query(postsRef, where('status', '==', 'published'));
      const querySnapshot = await getDocs(q);

      // Count posts per constituency
      const constituencyCounts = new Map<number, number>();
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const constituencyId = data.constituency;
        constituencyCounts.set(constituencyId, (constituencyCounts.get(constituencyId) || 0) + 1);
      });

      // Convert to array format
      const constituencies: FirebaseConstituency[] = [];
      for (const [id, count] of constituencyCounts) {
        constituencies.push({
          id,
          name: `Constituency ${id}`,
          postCount: count
        });
      }

      // Sort by post count (descending)
      constituencies.sort((a, b) => b.postCount - a.postCount);

      return constituencies;
    } catch (error: any) {
      console.error('Error getting constituencies with post counts:', error);
      return [];
    }
  }

  static async getConstituencyName(constituencyId: number): Promise<string | null> {
    try {
      // First try to get from merged_candidates.json
      const constituencies = await this.loadConstituenciesFromJSON();
      const constituency = constituencies.find(c => c.id === constituencyId);
      
      if (constituency) {
        return constituency.name;
      }
      
      // Fallback to database if JSON file fails
      const constituenciesRef = collection(db, 'constituencies');
      const constituencyQuery = query(constituenciesRef, where('id', '==', constituencyId));
      const constituencySnapshot = await getDocs(constituencyQuery);
      
      if (!constituencySnapshot.empty) {
        const constituencyData = constituencySnapshot.docs[0].data();
        return constituencyData.area_name || constituencyData.name || `Constituency ${constituencyId}`;
      }
      
      return `Constituency ${constituencyId}`;
    } catch (error) {
      console.error('Error getting constituency name:', error);
      return `Constituency ${constituencyId}`;
    }
  }

  static async getAllConstituencies(): Promise<{ id: number; name: string; area_name?: string; area_name_hi?: string; district?: string }[]> {
    try {
      // First try to load from merged_candidates.json
      const constituencies = await this.loadConstituenciesFromJSON();
      if (constituencies.length > 0) {
        console.log(`✅ Loaded ${constituencies.length} constituencies from merged_candidates.json`);
        return constituencies;
      }

      // Fallback to database if JSON file fails
      const constituenciesRef = collection(db, 'constituencies');
      const snapshot = await getDocs(constituenciesRef);
      
      if (snapshot.empty) {
        console.log('No constituencies found in database, returning empty array');
        return [];
      }
      
      const dbConstituencies = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: parseInt(doc.id),
          name: data.area_name || data.name || `Constituency ${doc.id}`,
          area_name: data.area_name,
          area_name_hi: data.area_name_hi,
          district: data.district
        };
      });

      // Sort by name for better user experience
      dbConstituencies.sort((a, b) => a.name.localeCompare(b.name));
      
      console.log(`✅ Fetched ${dbConstituencies.length} constituencies from database`);
      return dbConstituencies;
    } catch (error: any) {
      console.error('Error fetching constituencies:', error);
      // Fallback to hardcoded list if everything fails
      return [];
    }
  }

  // Load constituencies from merged_candidates.json file
  static async loadConstituenciesFromJSON(): Promise<{ id: number; name: string; area_name?: string; area_name_hi?: string; district?: string }[]> {
    try {
      const response = await fetch('/data/merged_candidates.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch merged_candidates.json: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: expected array');
      }
      
      const constituencies = data.map((item: any) => ({
        id: item.id,
        name: item.area_name?.en || `Constituency ${item.id}`,
        area_name: item.area_name?.en || '',
        area_name_hi: item.area_name?.hi || '',
        district: item.district || ''
      }));

      // Sort by name for better user experience
      constituencies.sort((a, b) => a.name.localeCompare(b.name));
      
      console.log(`✅ Successfully loaded ${constituencies.length} constituencies from merged_candidates.json`);
      return constituencies;
    } catch (error: any) {
      console.error('Error loading constituencies from JSON:', error);
      return [];
    }
  }

  // Get constituency name by ID from merged_candidates.json
  static async getConstituencyNameById(constituencyId: number): Promise<string> {
    try {
      const constituencies = await this.loadConstituenciesFromJSON();
      const constituency = constituencies.find(c => c.id === constituencyId);
      return constituency?.name || `Constituency ${constituencyId}`;
    } catch (error: any) {
      console.error('Error getting constituency name by ID:', error);
      return `Constituency ${constituencyId}`;
    }
  }

  static async searchConstituencies(searchTerm: string): Promise<{ id: number; name: string; area_name?: string; area_name_hi?: string; district?: string }[]> {
    try {
      const constituencies = await this.getAllConstituencies();
      
      if (!searchTerm.trim()) {
        return constituencies;
      }
      
      const searchLower = searchTerm.toLowerCase();
      const filtered = constituencies.filter(constituency => 
        constituency.name.toLowerCase().includes(searchLower) ||
        constituency.area_name?.toLowerCase().includes(searchLower) ||
        constituency.district?.toLowerCase().includes(searchLower)
      );
      
      return filtered;
    } catch (error: any) {
      console.error('Error searching constituencies:', error);
      return [];
    }
  }

  static async removeDiscussionPost(postId: string): Promise<void> {
    try {
      const postRef = doc(db, 'discussion_posts', postId);
      await updateDoc(postRef, {
        status: 'removed',
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Post ${postId} marked as removed`);
    } catch (error: any) {
      console.error('Error removing discussion post:', error);
      throw error;
    }
  }

  static async approveDiscussionPost(postId: string): Promise<void> {
    try {
      const postRef = doc(db, 'discussion_posts', postId);
      await updateDoc(postRef, {
        status: 'published',
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Post ${postId} approved`);
    } catch (error: any) {
      console.error('Error approving discussion post:', error);
      throw error;
    }
  }

  static async createDiscussionPost(postData: Omit<FirebaseDiscussionPost, 'id'>): Promise<string> {
    try {
      // Validate that the constituency exists in merged_candidates.json
      const constituencies = await this.loadConstituenciesFromJSON();
      const constituencyExists = constituencies.some(c => c.id === postData.constituency);
      
      if (!constituencyExists) {
        throw new Error(`Constituency ID ${postData.constituency} is not valid. Only constituencies from the official list are allowed.`);
      }
      
      const postsRef = collection(db, 'discussion_posts');
      const newPost = await addDoc(postsRef, {
        ...postData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Created discussion post with ID: ${newPost.id}`);
      return newPost.id;
    } catch (error: any) {
      console.error('Error creating discussion post:', error);
      throw error;
    }
  }

  static async uploadMedia(file: File, userId: string, postId: string): Promise<{ type: 'image' | 'video'; url: string; thumbnail?: string }> {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${userId}_${postId}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `discussion_media/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      let thumbnail;
      if (file.type.startsWith('image/')) {
        // For images, we can use the same URL as thumbnail
        thumbnail = downloadURL;
        return {
          type: 'image' as const,
          url: downloadURL,
          thumbnail
        };
      } else if (file.type.startsWith('video/')) {
        // For videos, we'll need to generate a thumbnail
        // For now, we'll use a placeholder
        thumbnail = '/images/video-placeholder.png';
        return {
          type: 'video' as const,
          url: downloadURL,
          thumbnail
        };
      }
      
      return {
        type: 'image' as const,
        url: downloadURL,
        thumbnail
      };
    } catch (error: any) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  static async updateDiscussionPost(postId: string, updateData: Partial<FirebaseDiscussionPost>): Promise<void> {
    try {
      const postRef = doc(db, 'discussion_posts', postId);
      await updateDoc(postRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Updated discussion post ${postId}`);
    } catch (error: any) {
      console.error('Error updating discussion post:', error);
      throw error;
    }
  }

  // Add comment to a post
  static async addComment(postId: string, comment: {
    userId: string;
    userName: string;
    content: string;
    constituencyName: string;
  }): Promise<void> {
    try {
      const commentsRef = collection(db, 'comments');
      const newComment = {
        postId,
        ...comment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(commentsRef, newComment);
      
      // Update post comment count
      const postRef = doc(db, 'discussion_posts', postId);
      await updateDoc(postRef, {
        commentsCount: increment(1),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Comment added successfully');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  // Get comments for a post
  static async getComments(postId: string): Promise<any[]> {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        where('postId', '==', postId)
        // Removed orderBy to avoid index requirement
      );
      
      const querySnapshot = await getDocs(q);
      const comments: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const commentData = doc.data();
        comments.push({
          id: doc.id,
          ...commentData
        });
      });
      
      // Sort comments by createdAt in memory instead
      comments.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return aTime.getTime() - bTime.getTime();
      });
      
      return comments;
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  // Like a post (one like per user, removes any existing dislike)
  static async likePost(postId: string, userId: string): Promise<void> {
    try {
      console.log(`🔍 Starting like operation for post ${postId} by user ${userId}`);
      
      const postRef = doc(db, 'discussion_posts', postId);
      
      // Check if user already liked the post
      const likesRef = collection(db, 'post_likes');
      const likeQuery = query(
        likesRef,
        where('postId', '==', postId),
        where('userId', '==', userId)
      );
      
      const existingLike = await getDocs(likeQuery);
      console.log(`🔍 Existing like check: ${existingLike.empty ? 'No existing like' : 'User already liked'}`);
      
      if (existingLike.empty) {
        // Check if user has disliked the post and remove it first
        const dislikesRef = collection(db, 'post_dislikes');
        const dislikeQuery = query(
          dislikesRef,
          where('postId', '==', postId),
          where('userId', '==', userId)
        );
        
        const existingDislike = await getDocs(dislikeQuery);
        console.log(`🔍 Existing dislike check: ${existingDislike.empty ? 'No existing dislike' : 'User already disliked'}`);
        
        if (!existingDislike.empty) {
          console.log('🔍 Removing existing dislike before adding like');
          // Remove existing dislike
          const dislikeDoc = existingDislike.docs[0];
          await deleteDoc(doc(db, 'post_dislikes', dislikeDoc.id));
          
          // Update post dislike count
          await updateDoc(postRef, {
            dislikesCount: increment(-1),
            updatedAt: serverTimestamp()
          });
          console.log('✅ Existing dislike removed and count updated');
        }
        
        console.log('🔍 Adding new like');
        // Add like (only one per user)
        await addDoc(likesRef, {
          postId,
          userId,
          createdAt: serverTimestamp()
        });
        
        // Update post like count
        await updateDoc(postRef, {
          likesCount: increment(1),
          updatedAt: serverTimestamp()
        });
        console.log('✅ New like added and count updated');
      } else {
        console.log('🔍 Removing existing like');
        // Remove like
        const likeDoc = existingLike.docs[0];
        await deleteDoc(doc(db, 'post_likes', likeDoc.id));
        
        // Update post like count
        await updateDoc(postRef, {
          likesCount: increment(-1),
          updatedAt: serverTimestamp()
        });
        console.log('✅ Existing like removed and count updated');
      }
      
      console.log('✅ Post like updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating post like:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }



  // Check if user has liked a post
  static async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    try {
      const likesRef = collection(db, 'post_likes');
      const likeQuery = query(
        likesRef,
        where('postId', '==', postId),
        where('userId', '==', userId)
      );
      
      const existingLike = await getDocs(likeQuery);
      return !existingLike.empty;
    } catch (error: any) {
      console.error('Error checking user like:', error);
      return false;
    }
  }

  // Dislike a post (one dislike per user, removes any existing like)
  static async dislikePost(postId: string, userId: string): Promise<void> {
    try {
      console.log(`🔍 Starting dislike operation for post ${postId} by user ${userId}`);
      
      const postRef = doc(db, 'discussion_posts', postId);
      
      // Check if user already disliked the post
      const dislikesRef = collection(db, 'post_dislikes');
      const dislikeQuery = query(
        dislikesRef,
        where('postId', '==', postId),
        where('userId', '==', userId)
      );
      
      const existingDislike = await getDocs(dislikeQuery);
      console.log(`🔍 Existing dislike check: ${existingDislike.empty ? 'No existing dislike' : 'User already disliked'}`);
      
      if (existingDislike.empty) {
        // Check if user has liked the post and remove it first
        const likesRef = collection(db, 'post_likes');
        const likeQuery = query(
          likesRef,
          where('postId', '==', postId),
          where('userId', '==', userId)
        );
        
        const existingLike = await getDocs(likeQuery);
        console.log(`🔍 Existing like check: ${existingLike.empty ? 'No existing like' : 'User already liked'}`);
        
        if (!existingLike.empty) {
          console.log('🔍 Removing existing like before adding dislike');
          // Remove existing like
          const likeDoc = existingLike.docs[0];
          await deleteDoc(doc(db, 'post_likes', likeDoc.id));
          
          // Update post like count
          await updateDoc(postRef, {
            likesCount: increment(-1),
            updatedAt: serverTimestamp()
          });
          console.log('✅ Existing like removed and count updated');
        }
        
        console.log('🔍 Adding new dislike');
        // Add dislike (only one per user)
        await addDoc(dislikesRef, {
          postId,
          userId,
          createdAt: serverTimestamp()
        });
        
        // Update post dislike count
        await updateDoc(postRef, {
          dislikesCount: increment(1),
          updatedAt: serverTimestamp()
        });
        console.log('✅ New dislike added and count updated');
      } else {
        console.log('🔍 Removing existing dislike');
        // Remove dislike
        const dislikeDoc = existingDislike.docs[0];
        await deleteDoc(doc(db, 'post_dislikes', dislikeDoc.id));
        
        // Update post dislike count
        await updateDoc(postRef, {
          dislikesCount: increment(-1),
          updatedAt: serverTimestamp()
        });
        console.log('✅ Existing dislike removed and count updated');
      }
      
      console.log('✅ Post dislike updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating post dislike:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Check if user has disliked a post
  static async hasUserDislikedPost(postId: string, userId: string): Promise<boolean> {
    try {
      const dislikesRef = collection(db, 'post_dislikes');
      const dislikeQuery = query(
        dislikesRef,
        where('postId', '==', postId),
        where('userId', '==', userId)
      );
      
      const existingDislike = await getDocs(dislikeQuery);
      return !existingDislike.empty;
    } catch (error: any) {
      console.error('Error checking user dislike:', error);
      return false;
    }
  }

  // Test Firebase connectivity and permissions
  static async testFirebaseAccess(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 Testing Firebase access...');
      
      // Test reading from discussion_posts
      const postsRef = collection(db, 'discussion_posts');
      const postsSnapshot = await getDocs(postsRef);
      console.log('✅ Successfully read from discussion_posts:', postsSnapshot.size, 'posts found');
      
      // Test reading from post_likes
      const likesRef = collection(db, 'post_likes');
      const likesSnapshot = await getDocs(likesRef);
      console.log('✅ Successfully read from post_likes:', likesSnapshot.size, 'likes found');
      
      // Test reading from post_dislikes
      const dislikesRef = collection(db, 'post_dislikes');
      const dislikesSnapshot = await getDocs(dislikesRef);
      console.log('✅ Successfully read from post_dislikes:', dislikesSnapshot.size, 'dislikes found');
      
      // Test writing to post_likes (this will test permissions)
      const testLikeData = {
        postId: 'test-post-id',
        userId: 'test-user-id',
        createdAt: serverTimestamp()
      };
      
      try {
        const testLikeRef = await addDoc(likesRef, testLikeData);
        console.log('✅ Successfully wrote to post_likes, test document ID:', testLikeRef.id);
        
        // Clean up test document
        await deleteDoc(doc(db, 'post_likes', testLikeRef.id));
        console.log('✅ Successfully cleaned up test document');
        
        return { success: true };
      } catch (writeError: any) {
        console.error('❌ Failed to write to post_likes:', writeError);
        return { success: false, error: `Write permission denied: ${writeError.message}` };
      }
      
    } catch (error: any) {
      console.error('❌ Firebase access test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete a discussion post (only by post owner or admin)
  static async deleteDiscussionPost(postId: string, userId: string): Promise<void> {
    try {
      console.log(`🔍 Attempting to delete post ${postId} by user ${userId}`);
      
      const postRef = doc(db, 'discussion_posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }
      
      const postData = postDoc.data();
      console.log(`🔍 Post data:`, postData);
      console.log(`🔍 Checking permissions: post owner: ${postData.userId}, current user: ${userId}`);
      
      // Check if user is the post owner or an admin
      if (postData.userId !== userId) {
        // Check if user is admin (you can implement admin check here)
        // For now, only post owner can delete
        throw new Error('Only post owner can delete this post');
      }
      
      console.log(`✅ Permission check passed, proceeding with deletion`);
      
      // Use a single batch for all operations to ensure atomicity
      const batch = writeBatch(db);
      
      // Delete all comments for this post
      const commentsRef = collection(db, 'comments');
      const commentsQuery = query(commentsRef, where('postId', '==', postId));
      const commentsSnapshot = await getDocs(commentsQuery);
      
      console.log(`🔍 Found ${commentsSnapshot.docs.length} comments to delete`);
      commentsSnapshot.docs.forEach(commentDoc => {
        batch.delete(commentDoc.ref);
      });
      
      // Delete all likes for this post
      const likesRef = collection(db, 'post_likes');
      const likesQuery = query(likesRef, where('postId', '==', postId));
      const likesSnapshot = await getDocs(likesQuery);
      
      console.log(`🔍 Found ${likesSnapshot.docs.length} likes to delete`);
      likesSnapshot.docs.forEach(likeDoc => {
        batch.delete(likeDoc.ref);
      });

      // Delete all dislikes for this post
      const dislikesRef = collection(db, 'post_dislikes');
      const dislikesQuery = query(dislikesRef, where('postId', '==', postId));
      const dislikesSnapshot = await getDocs(dislikesQuery);
      
      console.log(`🔍 Found ${dislikesSnapshot.docs.length} dislikes to delete`);
      dislikesSnapshot.docs.forEach(dislikeDoc => {
        batch.delete(dislikeDoc.ref);
      });
      
      // Delete the post
      batch.delete(postRef);
      
      // Commit all operations in a single batch
      await batch.commit();
      
      console.log('✅ Post and all associated data deleted successfully');
    } catch (error: any) {
      console.error('❌ Error deleting discussion post:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  static async deleteReply(replyId: string, userId: string, postId: string): Promise<void> {
    try {
      console.log(`🔍 Attempting to delete reply ${replyId} by user ${userId} from post ${postId}`);
      
      const replyRef = doc(db, 'comment_replies', replyId);
      const replySnapshot = await getDoc(replyRef);
      
      if (!replySnapshot.exists()) {
        throw new Error('Reply not found');
      }
      
      const replyData = replySnapshot.data();
      console.log(`🔍 Reply data:`, replyData);
      
      // Get post data to check if user is post owner
      const postRef = doc(db, 'discussion_posts', postId);
      const postDoc = await getDoc(postRef);
      const postData = postDoc.data();
      
      if (!postData) {
        throw new Error('Post not found');
      }
      
      console.log(`🔍 Post data:`, postData);
      console.log(`🔍 Checking permissions: reply owner: ${replyData.userId}, post owner: ${postData.userId}, current user: ${userId}`);
      
      // Check if user is the reply owner or post owner
      if (replyData.userId !== userId && postData.userId !== userId) {
        throw new Error('Only reply owner or post owner can delete this reply');
      }
      
      console.log(`✅ Permission check passed, proceeding with deletion`);
      
      // Delete the reply
      await deleteDoc(replyRef);
      
      console.log('✅ Reply deleted successfully');
    } catch (error: any) {
      console.error('❌ Error deleting reply:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Delete a reply (admin override - can delete any reply)
  static async deleteReplyAsAdmin(replyId: string): Promise<void> {
    try {
      console.log(`🔍 Admin attempting to delete reply ${replyId}`);
      
      const replyRef = doc(db, 'comment_replies', replyId);
      const replySnapshot = await getDoc(replyRef);
      
      if (!replySnapshot.exists()) {
        throw new Error('Reply not found');
      }
      
      console.log(`✅ Reply found, proceeding with admin deletion`);
      
      // Delete the reply
      await deleteDoc(replyRef);
      
      console.log('✅ Reply deleted successfully by admin');
    } catch (error: any) {
      console.error('❌ Error deleting reply as admin:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Update a reply (only by reply owner, post owner, or admin)
  static async updateReply(replyId: string, userId: string, postId: string, newContent: string, isAdmin: boolean = false): Promise<void> {
    try {
      console.log(`🔍 Attempting to update reply ${replyId} by user ${userId} from post ${postId}`);
      
      const replyRef = doc(db, 'comment_replies', replyId);
      const replySnapshot = await getDoc(replyRef);
      
      if (!replySnapshot.exists()) {
        throw new Error('Reply not found');
      }
      
      const replyData = replySnapshot.data();
      console.log(`🔍 Reply data:`, replyData);
      
      // Get post data to check if user is post owner
      const postRef = doc(db, 'discussion_posts', postId);
      const postDoc = await getDoc(postRef);
      const postData = postDoc.data();
      
      if (!postData) {
        throw new Error('Post not found');
      }
      
      console.log(`🔍 Post data:`, postData);
      console.log(`🔍 Checking permissions: reply owner: ${replyData.userId}, post owner: ${postData.userId}, current user: ${userId}, isAdmin: ${isAdmin}`);
      
      // Check if user is the reply owner, post owner, or admin
      if (!isAdmin && replyData.userId !== userId && postData.userId !== userId) {
        throw new Error('Only reply owner, post owner, or admin can edit this reply');
      }
      
      console.log(`✅ Permission check passed, proceeding with update`);
      
      // Update the reply
      await updateDoc(replyRef, {
        content: newContent,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Reply updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating reply:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Delete a comment (only by comment owner or post owner)
  static async deleteComment(commentId: string, userId: string, postId: string): Promise<void> {
    try {
      console.log(`🔍 Attempting to delete comment ${commentId} by user ${userId} from post ${postId}`);
      
      const commentRef = doc(db, 'comments', commentId);
      const commentSnapshot = await getDoc(commentRef);
      
      if (!commentSnapshot.exists()) {
        throw new Error('Comment not found');
      }
      
      const commentData = commentSnapshot.data();
      console.log(`🔍 Comment data:`, commentData);
      
      // Get post data to check if user is post owner
      const postRef = doc(db, 'discussion_posts', postId);
      const postDoc = await getDoc(postRef);
      const postData = postDoc.data();
      
      if (!postData) {
        throw new Error('Post not found');
      }
      
      console.log(`🔍 Post data:`, postData);
      console.log(`🔍 Checking permissions: comment owner: ${commentData.userId}, post owner: ${postData.userId}, current user: ${userId}`);
      
      // Check if user is the comment owner or post owner
      if (commentData.userId !== userId && postData.userId !== userId) {
        throw new Error('Only comment owner or post owner can delete this comment');
      }
      
      console.log(`✅ Permission check passed, proceeding with deletion`);
      
      // Use a batch to ensure atomic operations
      const batch = writeBatch(db);
      
      // Delete the comment
      batch.delete(commentRef);
      
      // Update post comment count
      batch.update(postRef, {
        commentsCount: increment(-1),
        updatedAt: serverTimestamp()
      });
      
      // Commit the batch
      await batch.commit();
      
      console.log('✅ Comment deleted successfully');
    } catch (error: any) {
      console.error('❌ Error deleting comment:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Update a comment (only by comment owner, post owner, or admin)
  static async updateComment(commentId: string, userId: string, postId: string, newContent: string, isAdmin: boolean = false): Promise<void> {
    try {
      console.log(`🔍 Attempting to update comment ${commentId} by user ${userId} from post ${postId}`);
      
      const commentRef = doc(db, 'comments', commentId);
      const commentSnapshot = await getDoc(commentRef);
      
      if (!commentSnapshot.exists()) {
        throw new Error('Comment not found');
      }
      
      const commentData = commentSnapshot.data();
      console.log(`🔍 Comment data:`, commentData);
      
      // Get post data to check if user is post owner
      const postRef = doc(db, 'discussion_posts', postId);
      const postDoc = await getDoc(postRef);
      const postData = postDoc.data();
      
      if (!postData) {
        throw new Error('Post not found');
      }
      
      console.log(`🔍 Post data:`, postData);
      console.log(`🔍 Checking permissions: comment owner: ${commentData.userId}, post owner: ${postData.userId}, current user: ${userId}, isAdmin: ${isAdmin}`);
      
      // Check if user is the comment owner, post owner, or admin
      if (!isAdmin && commentData.userId !== userId && postData.userId !== userId) {
        throw new Error('Only comment owner, post owner, or admin can edit this comment');
      }
      
      console.log(`✅ Permission check passed, proceeding with update`);
      
      // Update the comment
      await updateDoc(commentRef, {
        content: newContent,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Comment updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating comment:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Delete a comment (admin override - can delete any comment)
  static async deleteCommentAsAdmin(commentId: string, postId: string): Promise<void> {
    try {
      console.log(`🔍 Admin attempting to delete comment ${commentId} from post ${postId}`);
      
      const commentRef = doc(db, 'comments', commentId);
      const commentSnapshot = await getDoc(commentRef);
      
      if (!commentSnapshot.exists()) {
        throw new Error('Comment not found');
      }
      
      console.log(`✅ Comment found, proceeding with admin deletion`);
      
      // Use a batch to ensure atomic operations
      const batch = writeBatch(db);
      
      // Delete the comment
      batch.delete(commentRef);
      
      // Update post comment count
      const postRef = doc(db, 'discussion_posts', postId);
      batch.update(postRef, {
        commentsCount: increment(-1),
        updatedAt: serverTimestamp()
      });
      
      // Commit the batch
      await batch.commit();
      
      console.log('✅ Comment deleted successfully by admin');
    } catch (error: any) {
      console.error('❌ Error deleting comment as admin:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Add reply to a comment
  static async addReply(_commentId: string, reply: {
    userId: string;
    userName: string;
    content: string;
    constituencyName: string;
    parentCommentId: string;
  }): Promise<void> {
    try {
      const repliesRef = collection(db, 'comment_replies');
      const newReply = {
        ...reply,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(repliesRef, newReply);
      
      console.log('✅ Reply added successfully');
    } catch (error: any) {
      console.error('Error adding reply:', error);
      throw error;
    }
  }



  // Get replies for a comment
  static async getReplies(commentId: string): Promise<any[]> {
    try {
      const repliesRef = collection(db, 'comment_replies');
      const q = query(
        repliesRef,
        where('parentCommentId', '==', commentId)
        // Removed orderBy to avoid index requirement
      );
      
      const querySnapshot = await getDocs(q);
      const replies: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const replyData = doc.data();
        replies.push({
          id: doc.id,
          ...replyData
        });
      });
      
      // Sort replies by createdAt in memory instead
      replies.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return aTime.getTime() - bTime.getTime();
      });
      
      return replies;
    } catch (error: any) {
      console.error('Error fetching replies:', error);
      throw error;
    }
  }



  // Get discussion posts by constituency
  static async getDiscussionPostsByConstituency(constituencyId: number): Promise<any[]> {
    try {
      const postsRef = collection(db, 'discussion_posts');
      const q = query(
        postsRef, 
        where('constituency', '==', constituencyId),
        where('status', 'in', ['published', 'under_review'])
        // Removed orderBy to avoid index requirement
      );
      const querySnapshot = await getDocs(q);

      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseDiscussionPost[];

      // Enrich posts with user data
      const enrichedPosts = await Promise.all(
        posts.map(async (post) => {
          try {
            const userProfile = await this.getUserProfile(post.userId);
            return {
              ...post,
              userName: userProfile?.display_name || 'User',
              interactionsCount: (post.likesCount || 0) + (post.commentsCount || 0)
            };
          } catch (error) {
            console.error('Error enriching post:', error);
            return {
              ...post,
              userName: 'User',
              interactionsCount: (post.likesCount || 0) + (post.commentsCount || 0)
            };
          }
        })
      );

      // Sort posts by createdAt in memory instead of in query
      enrichedPosts.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return bTime.getTime() - aTime.getTime(); // Newest first
      });

      return enrichedPosts;
    } catch (error: any) {
      console.error('Error getting discussion posts by constituency:', error);
      return [];
    }
  }

  // Search discussion posts
  static async searchDiscussionPosts(searchTerm: string, constituencyId?: number): Promise<any[]> {
    try {
      const postsRef = collection(db, 'discussion_posts');
      let q;
      
      if (constituencyId) {
        q = query(
          postsRef,
          where('constituency', '==', constituencyId),
          where('status', 'in', ['published', 'under_review']),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          postsRef,
          where('status', 'in', ['published', 'under_review']),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FirebaseDiscussionPost[];

      // Filter by search term
      const filteredPosts = posts.filter(post => {
        const searchLower = searchTerm.toLowerCase();
        return (
          post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      });

      // Enrich posts
      const enrichedPosts = await Promise.all(
        filteredPosts.map(async (post) => {
          try {
            const userProfile = await this.getUserProfile(post.userId);
            const constituencyName = await this.getConstituencyName(post.constituency);
            return {
              ...post,
              userName: userProfile?.display_name || 'User',
              constituencyName: constituencyName || `Constituency ${post.constituency}`,
              interactionsCount: (post.likesCount || 0) + (post.commentsCount || 0)
            };
          } catch (error) {
            console.error('Error enriching post:', error);
            return {
              ...post,
              userName: 'User',
              constituencyName: `Constituency ${post.constituency}`,
              interactionsCount: (post.likesCount || 0) + (post.commentsCount || 0)
            };
          }
        })
      );

      return enrichedPosts;
    } catch (error: any) {
      console.error('Error searching discussion posts:', error);
      return [];
    }
  }
}

export default FirebaseService;
