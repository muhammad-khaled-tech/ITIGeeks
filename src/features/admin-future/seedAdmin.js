/**
 * Seed Super Admin Script
 * 
 * This script creates the initial super admin account in Firestore.
 * Run this once to set up the admin user.
 * 
 * Usage: node scripts/seedAdmin.js
 * 
 * Or you can use the browser console to run the seedAdminInBrowser function.
 */

// For browser console usage, paste this function:
window.seedAdminUser = async function() {
  const { collection, doc, setDoc, getDoc } = await import('firebase/firestore');
  const { db } = await import('../src/firebase.js');
  
  const adminUsername = 'admin';
  
  // Check if admin already exists
  const existingDoc = await getDoc(doc(db, 'admin_users', adminUsername));
  if (existingDoc.exists()) {
    console.log('Admin user already exists!');
    return;
  }
  
  // Create super admin
  await setDoc(doc(db, 'admin_users', adminUsername), {
    email: 'admin@itigeeks.local',
    password: 'admin', // In production, this should be hashed!
    role: 'super_admin',
    trackId: null,
    branchId: null,
    groupIds: [],
    createdAt: new Date(),
    createdBy: 'system',
    mustChangePassword: true,
    lastLogin: null
  });
  
  console.log('✅ Super Admin created successfully!');
  console.log('Username: admin');
  console.log('Password: admin');
  console.log('⚠️  Please change the password after first login!');
};

// Export for module usage
export const seedAdmin = async (db) => {
  const { doc, setDoc, getDoc } = await import('firebase/firestore');
  
  const adminUsername = 'admin';
  
  // Check if admin already exists
  const existingDoc = await getDoc(doc(db, 'admin_users', adminUsername));
  if (existingDoc.exists()) {
    console.log('Admin user already exists!');
    return false;
  }
  
  // Create super admin
  await setDoc(doc(db, 'admin_users', adminUsername), {
    email: 'admin@itigeeks.local',
    password: 'admin',
    role: 'super_admin',
    trackId: null,
    branchId: null,
    groupIds: [],
    createdAt: new Date(),
    createdBy: 'system',
    mustChangePassword: true,
    lastLogin: null
  });
  
  console.log('✅ Super Admin seeded!');
  return true;
};

console.log('To seed admin in browser console, run: seedAdminUser()');
