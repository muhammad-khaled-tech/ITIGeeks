import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user has admin privileges
  const checkAdminUser = async (username) => {
    try {
      const adminDoc = await getDoc(doc(db, "admin_users", username));
      if (adminDoc.exists()) {
        return { username, ...adminDoc.data() };
      }
      return null;
    } catch (err) {
      console.error("Error checking admin user:", err);
      return null;
    }
  };

  // Login with username and password
  const loginWithCredentials = async (username, password) => {
    setError(null);
    setLoading(true);

    try {
      // Get admin user document
      const adminDoc = await getDoc(
        doc(db, "admin_users", username.toLowerCase())
      );

      if (!adminDoc.exists()) {
        throw new Error("Invalid username or password");
      }

      const adminData = adminDoc.data();

      // Simple password check (in production, use bcrypt on server-side)
      // For now, we'll use a simple comparison (NOT SECURE - for demo only)
      if (adminData.password !== password) {
        throw new Error("Invalid username or password");
      }

      // Update last login
      await updateDoc(doc(db, "admin_users", username.toLowerCase()), {
        lastLogin: serverTimestamp(),
      });

      const user = {
        username: username.toLowerCase(),
        email: adminData.email,
        role: adminData.role,
        trackId: adminData.trackId,
        branchId: adminData.branchId,
        groupIds: adminData.groupIds || [],
        mustChangePassword: adminData.mustChangePassword || false,
      };

      // Store in localStorage for persistence
      localStorage.setItem("adminUser", JSON.stringify(user));
      setAdminUser(user);

      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login with Google OAuth
  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      // TESTING: Hardcoded super admin for development
      const SUPER_ADMIN_EMAILS = ['phys.mkhaled@gmail.com'];
      
      if (SUPER_ADMIN_EMAILS.includes(email)) {
        // Auto-login as super admin for testing
        const user = {
          username: email.split('@')[0],
          email: email,
          role: 'super_admin',
          trackId: null,
          branchId: null,
          groupIds: [],
          mustChangePassword: false,
          firebaseUid: result.user.uid,
        };

        localStorage.setItem('adminUser', JSON.stringify(user));
        setAdminUser(user);
        return user;
      }

      // Check if this email is whitelisted as an admin in Firestore
      const adminDoc = await getDoc(doc(db, 'admin_users_by_email', email));

      if (!adminDoc.exists()) {
        await signOut(auth);
        throw new Error('This Google account is not authorized as an admin');
      }

      const adminData = adminDoc.data();
      const username = adminData.username;

      // Get full admin data
      const fullAdminDoc = await getDoc(doc(db, 'admin_users', username));
      const fullAdminData = fullAdminDoc.data();

      // Update last login
      await updateDoc(doc(db, 'admin_users', username), {
        lastLogin: serverTimestamp(),
        linkedFirebaseUid: result.user.uid,
      });

      const user = {
        username,
        email: fullAdminData.email,
        role: fullAdminData.role,
        trackId: fullAdminData.trackId,
        branchId: fullAdminData.branchId,
        groupIds: fullAdminData.groupIds || [],
        mustChangePassword: false,
        firebaseUid: result.user.uid,
      };

      localStorage.setItem('adminUser', JSON.stringify(user));
      setAdminUser(user);

      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("adminUser");
      setAdminUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("adminUser");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Verify the user still exists in database
        checkAdminUser(user.username).then((adminData) => {
          if (adminData) {
            setAdminUser(user);
          } else {
            localStorage.removeItem("adminUser");
          }
          setLoading(false);
        });
      } catch (err) {
        localStorage.removeItem("adminUser");
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Permission helpers
  const isSuperAdmin = () => adminUser?.role === "super_admin";
  const isTrackLeader = () =>
    adminUser?.role === "track_leader" || isSuperAdmin();
  const isSupervisor = () =>
    adminUser?.role === "supervisor" || isTrackLeader();
  const isInstructor = () => adminUser?.role === "instructor" || isSupervisor();

  const value = {
    adminUser,
    loading,
    error,
    loginWithCredentials,
    loginWithGoogle,
    logout,
    isSuperAdmin,
    isTrackLeader,
    isSupervisor,
    isInstructor,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;
