import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../configs/firebase';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'moderator' | 'admin' | 'super_admin';
  createdAt: Date;
  lastLogin: Date;
  isActive: boolean;
  phoneNumber?: string;
  profileImage?: string;
}

export interface AdminConstituency {
  id: string;
  name: string;
  state: string;
  totalVoters: number;
  status: 'active' | 'inactive' | 'pending';
  lastUpdated: Date;
  areaCode?: string;
  description?: string;
}

export interface SystemMetric {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: Date;
}

export interface AdminSettings {
  maintenanceMode: boolean;
  emailNotifications: boolean;
  sessionTimeout: number;
  require2FA: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
}

class AdminService {
  // User Management
  async getAllUsers(): Promise<AdminUser[]> {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastLogin: doc.data().lastLogin?.toDate() || new Date(),
      })) as AdminUser[];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(uid: string): Promise<AdminUser | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid: userDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || new Date(),
        } as AdminUser;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async updateUserRole(uid: string, role: AdminUser['role']): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async toggleUserStatus(uid: string, isActive: boolean): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Constituency Management
  async getAllConstituencies(): Promise<AdminConstituency[]> {
    try {
      const constituenciesRef = collection(db, 'constituencies');
      const snapshot = await getDocs(constituenciesRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
      })) as AdminConstituency[];
    } catch (error) {
      console.error('Error fetching constituencies:', error);
      throw error;
    }
  }

  async getConstituencyById(id: string): Promise<AdminConstituency | null> {
    try {
      const constituencyDoc = await getDoc(doc(db, 'constituencies', id));
      if (constituencyDoc.exists()) {
        const data = constituencyDoc.data();
        return {
          id: constituencyDoc.id,
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
        } as AdminConstituency;
      }
      return null;
    } catch (error) {
      console.error('Error fetching constituency:', error);
      throw error;
    }
  }

  async createConstituency(constituency: Omit<AdminConstituency, 'id' | 'lastUpdated'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'constituencies'), {
        ...constituency,
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating constituency:', error);
      throw error;
    }
  }

  async updateConstituency(id: string, updates: Partial<AdminConstituency>): Promise<void> {
    try {
      await updateDoc(doc(db, 'constituencies', id), {
        ...updates,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating constituency:', error);
      throw error;
    }
  }

  async deleteConstituency(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'constituencies', id));
    } catch (error) {
      console.error('Error deleting constituency:', error);
      throw error;
    }
  }

  // Analytics and Metrics
  async getSystemMetrics(): Promise<SystemMetric[]> {
    try {
      // This would typically fetch from a metrics collection or calculate from other data
      // For now, returning mock data structure
      return [
        { name: 'Total Users', value: 15420, change: 12.5, trend: 'up', timestamp: new Date() },
        { name: 'Active Constituencies', value: 543, change: -2.1, trend: 'down', timestamp: new Date() },
        { name: 'Total Interactions', value: 89234, change: 8.7, trend: 'up', timestamp: new Date() },
        { name: 'System Uptime', value: 99.9, change: 0.1, trend: 'stable', timestamp: new Date() }
      ];
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      throw error;
    }
  }

  async getUserGrowthData(days: number = 30): Promise<{ date: string; count: number }[]> {
    try {
      // This would typically aggregate user creation data over time
      // For now, returning mock data structure
      const data = [];
      const today = new Date();
      for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 100) + 50
        });
      }
      return data;
    } catch (error) {
      console.error('Error fetching user growth data:', error);
      throw error;
    }
  }

  // System Settings
  async getSystemSettings(): Promise<AdminSettings> {
    try {
      const settingsDoc = await getDoc(doc(db, 'system', 'settings'));
      if (settingsDoc.exists()) {
        return settingsDoc.data() as AdminSettings;
      }
      // Return default settings if none exist
      return {
        maintenanceMode: false,
        emailNotifications: true,
        sessionTimeout: 30,
        require2FA: false,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
      };
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  }

  async updateSystemSettings(settings: Partial<AdminSettings>): Promise<void> {
    try {
      await updateDoc(doc(db, 'system', 'settings'), {
        ...settings,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  // Utility Methods
  async searchUsers(query: string): Promise<AdminUser[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('displayName', '>=', query),
        where('displayName', '<=', query + '\uf8ff'),
        orderBy('displayName'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastLogin: doc.data().lastLogin?.toDate() || new Date(),
      })) as AdminUser[];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  async getUsersByRole(role: AdminUser['role']): Promise<AdminUser[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', role));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastLogin: doc.data().lastLogin?.toDate() || new Date(),
      })) as AdminUser[];
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }
}

export default new AdminService();
