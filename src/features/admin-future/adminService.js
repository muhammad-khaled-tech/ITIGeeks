/**
 * Admin Service
 * Handles admin-related Firestore operations
 */

import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Seed the initial super admin account
 * Call this function once to set up the admin user
 */
export const seedSuperAdmin = async () => {
  const adminUsername = 'admin';
  
  try {
    // Check if admin already exists
    const existingDoc = await getDoc(doc(db, 'admin_users', adminUsername));
    if (existingDoc.exists()) {
      console.log('Admin user already exists!');
      return { success: false, message: 'Admin already exists' };
    }
    
    // Create super admin
    await setDoc(doc(db, 'admin_users', adminUsername), {
      email: 'admin@itigeeks.local',
      password: 'admin', // Note: In production, use proper hashing!
      role: 'super_admin',
      trackId: null,
      branchId: null,
      groupIds: [],
      createdAt: serverTimestamp(),
      createdBy: 'system',
      mustChangePassword: true,
      lastLogin: null
    });
    
    console.log('✅ Super Admin created successfully!');
    console.log('Username: admin');
    console.log('Password: admin');
    
    return { 
      success: true, 
      message: 'Super Admin created! Username: admin, Password: admin' 
    };
  } catch (error) {
    console.error('Error seeding admin:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Create a new admin user (track leader, supervisor, or instructor)
 */
export const createAdminUser = async (userData, createdBy) => {
  const { username, email, role, trackId, branchId, groupIds } = userData;
  
  if (!username || !email || !role) {
    throw new Error('Username, email, and role are required');
  }
  
  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-8);
  
  try {
    // Check if username already exists
    const existingDoc = await getDoc(doc(db, 'admin_users', username.toLowerCase()));
    if (existingDoc.exists()) {
      throw new Error('Username already exists');
    }
    
    // Create admin user
    await setDoc(doc(db, 'admin_users', username.toLowerCase()), {
      email: email.trim(),
      password: tempPassword,
      role,
      trackId: trackId || null,
      branchId: branchId || null,
      groupIds: groupIds || [],
      createdAt: serverTimestamp(),
      createdBy: createdBy || 'unknown',
      mustChangePassword: true,
      lastLogin: null
    });
    
    // Create email lookup for Google OAuth
    await setDoc(doc(db, 'admin_users_by_email', email.trim()), {
      username: username.toLowerCase(),
      email: email.trim()
    });
    
    return {
      success: true,
      username: username.toLowerCase(),
      tempPassword,
      message: `Admin user created. Temp password: ${tempPassword}`
    };
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

/**
 * Get admin user by email (for Google OAuth lookup)
 */
export const getAdminByEmail = async (email) => {
  try {
    const lookupDoc = await getDoc(doc(db, 'admin_users_by_email', email.trim()));
    if (!lookupDoc.exists()) {
      return null;
    }
    
    const { username } = lookupDoc.data();
    const adminDoc = await getDoc(doc(db, 'admin_users', username));
    
    if (!adminDoc.exists()) {
      return null;
    }
    
    return { username, ...adminDoc.data() };
  } catch (error) {
    console.error('Error getting admin by email:', error);
    return null;
  }
};

/**
 * Update admin password
 */
export const updateAdminPassword = async (username, newPassword) => {
  try {
    await setDoc(doc(db, 'admin_users', username), {
      password: newPassword,
      mustChangePassword: false
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

// Expose seedSuperAdmin to window for browser console access
if (typeof window !== 'undefined') {
  window.seedSuperAdmin = seedSuperAdmin;
}

export default {
  seedSuperAdmin,
  createAdminUser,
  getAdminByEmail,
  updateAdminPassword
};
