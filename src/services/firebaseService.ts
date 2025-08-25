import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../configs/firebase';

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

// Firebase Service Class
export class FirebaseService {
  
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
      await updateDoc(userRef, {
        ...updateData,
        updated_at: serverTimestamp()
      });
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
      const postsQuery = query(postsRef, where('user_id', '==', userId));
      const postsSnapshot = await getDocs(postsQuery);
      
      return postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      const batch = writeBatch(db);
      
      // Create scores for constituencies 1-243
      for (let i = 1; i <= 243; i++) {
        const scoreDoc = doc(scoresRef);
        batch.set(scoreDoc, {
          constituency_id: i,
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
      console.log('✅ Successfully initialized constituency scores for all 243 constituencies');
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        console.error('Permission denied initializing constituency scores');
        throw new Error('Permission denied: Cannot initialize scores');
      }
      console.error('Error initializing constituency scores:', error);
      throw error;
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
}

export default FirebaseService;
