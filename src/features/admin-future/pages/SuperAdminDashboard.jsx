import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  FaBuilding, 
  FaGraduationCap, 
  FaUserTie, 
  FaPlus, 
  FaEdit, 
  FaTrash,
  FaUsers,
  FaChartLine,
  FaSignOutAlt,
  FaSpinner,
  FaTimes,
  FaCheck
} from 'react-icons/fa';

const SuperAdminDashboard = () => {
  const { adminUser, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [branches, setBranches] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [trackLeaders, setTrackLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch branches
      const branchesSnap = await getDocs(query(collection(db, 'branches'), orderBy('name')));
      setBranches(branchesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch tracks
      const tracksSnap = await getDocs(query(collection(db, 'tracks'), orderBy('name')));
      setTracks(tracksSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // Fetch track leaders
      const leadersSnap = await getDocs(
        query(collection(db, 'admin_users'))
      );
      setTrackLeaders(
        leadersSnap.docs
          .map(d => ({ username: d.id, ...d.data() }))
          .filter(u => u.role === 'track_leader')
      );
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Branch CRUD
  const handleAddBranch = async () => {
    if (!formData.name?.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'branches'), {
        name: formData.name.trim(),
        location: formData.location?.trim() || '',
        isActive: true,
        createdAt: serverTimestamp()
      });
      setShowModal(null);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Error adding branch:', error);
      alert('Failed to add branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBranch = async (branchId) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    try {
      await deleteDoc(doc(db, 'branches', branchId));
      fetchData();
    } catch (error) {
      console.error('Error deleting branch:', error);
      alert('Failed to delete branch');
    }
  };

  // Track CRUD
  const handleAddTrack = async () => {
    if (!formData.name?.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'tracks'), {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        leaderId: formData.leaderId || null,
        createdAt: serverTimestamp()
      });
      setShowModal(null);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Error adding track:', error);
      alert('Failed to add track');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrack = async (trackId) => {
    if (!confirm('Are you sure you want to delete this track?')) return;
    try {
      await deleteDoc(doc(db, 'tracks', trackId));
      fetchData();
    } catch (error) {
      console.error('Error deleting track:', error);
      alert('Failed to delete track');
    }
  };

  // Track Leader CRUD
  const handleAddTrackLeader = async () => {
    if (!formData.email?.trim() || !formData.username?.trim()) return;
    setSaving(true);
    try {
      const username = formData.username.trim().toLowerCase();
      const tempPassword = Math.random().toString(36).slice(-8);
      
      // Create admin user document
      await addDoc(collection(db, 'admin_users'), {
        email: formData.email.trim(),
        password: tempPassword, // In production, hash this!
        role: 'track_leader',
        trackId: formData.trackId || null,
        branchId: null,
        groupIds: [],
        createdAt: serverTimestamp(),
        createdBy: adminUser.username,
        mustChangePassword: true,
        lastLogin: null
      });

      // Also create email lookup doc
      await addDoc(collection(db, 'admin_users_by_email'), {
        email: formData.email.trim(),
        username: username
      });

      alert(`Track Leader created!\n\nUsername: ${username}\nTemporary Password: ${tempPassword}\n\nPlease share these credentials securely.`);
      setShowModal(null);
      setFormData({});
      fetchData();
    } catch (error) {
      console.error('Error adding track leader:', error);
      alert('Failed to add track leader');
    } finally {
      setSaving(false);
    }
  };

  // Stats calculations
  const stats = {
    totalBranches: branches.length,
    totalTracks: tracks.length,
    totalTrackLeaders: trackLeaders.length,
    activeBranches: branches.filter(b => b.isActive !== false).length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <FaSpinner className="animate-spin text-4xl text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FaUserTie className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Super Admin Dashboard</h1>
              <p className="text-sm text-gray-400">Welcome, {adminUser?.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-gray-800 border-r border-gray-700 p-4">
          <nav className="space-y-2">
            {[
              { id: 'overview', icon: FaChartLine, label: 'Overview' },
              { id: 'branches', icon: FaBuilding, label: 'Branches' },
              { id: 'tracks', icon: FaGraduationCap, label: 'Tracks' },
              { id: 'track-leaders', icon: FaUserTie, label: 'Track Leaders' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <item.icon />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Platform Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Total Branches', value: stats.totalBranches, icon: FaBuilding, color: 'from-blue-500 to-blue-600' },
                  { label: 'Active Branches', value: stats.activeBranches, icon: FaCheck, color: 'from-green-500 to-green-600' },
                  { label: 'Total Tracks', value: stats.totalTracks, icon: FaGraduationCap, color: 'from-purple-500 to-purple-600' },
                  { label: 'Track Leaders', value: stats.totalTrackLeaders, icon: FaUserTie, color: 'from-orange-500 to-orange-600' },
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="text-white text-xl" />
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => { setActiveTab('branches'); setShowModal('addBranch'); }}
                    className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                  >
                    <FaPlus className="text-green-400" />
                    <div>
                      <p className="text-white font-medium">Add Branch</p>
                      <p className="text-sm text-gray-400">Create new ITI branch</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setActiveTab('tracks'); setShowModal('addTrack'); }}
                    className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                  >
                    <FaPlus className="text-purple-400" />
                    <div>
                      <p className="text-white font-medium">Add Track</p>
                      <p className="text-sm text-gray-400">Create new academic track</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setActiveTab('track-leaders'); setShowModal('addTrackLeader'); }}
                    className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                  >
                    <FaPlus className="text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Add Track Leader</p>
                      <p className="text-sm text-gray-400">Assign track leadership</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Branches Tab */}
          {activeTab === 'branches' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Branches</h2>
                <button
                  onClick={() => setShowModal('addBranch')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <FaPlus /> Add Branch
                </button>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-left px-6 py-4 text-gray-300 font-medium">Name</th>
                      <th className="text-left px-6 py-4 text-gray-300 font-medium">Location</th>
                      <th className="text-left px-6 py-4 text-gray-300 font-medium">Status</th>
                      <th className="text-right px-6 py-4 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map(branch => (
                      <tr key={branch.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-white font-medium">{branch.name}</td>
                        <td className="px-6 py-4 text-gray-400">{branch.location || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            branch.isActive !== false 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {branch.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteBranch(branch.id)}
                            className="text-red-400 hover:text-red-300 p-2"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {branches.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No branches yet. Add your first branch!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tracks Tab */}
          {activeTab === 'tracks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Tracks</h2>
                <button
                  onClick={() => setShowModal('addTrack')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <FaPlus /> Add Track
                </button>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-left px-6 py-4 text-gray-300 font-medium">Name</th>
                      <th className="text-left px-6 py-4 text-gray-300 font-medium">Description</th>
                      <th className="text-left px-6 py-4 text-gray-300 font-medium">Leader</th>
                      <th className="text-right px-6 py-4 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tracks.map(track => (
                      <tr key={track.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-white font-medium">{track.name}</td>
                        <td className="px-6 py-4 text-gray-400">{track.description || '-'}</td>
                        <td className="px-6 py-4 text-gray-400">{track.leaderId || 'Not assigned'}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteTrack(track.id)}
                            className="text-red-400 hover:text-red-300 p-2"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {tracks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No tracks yet. Add your first track!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Track Leaders Tab */}
          {activeTab === 'track-leaders' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Track Leaders</h2>
                <button
                  onClick={() => setShowModal('addTrackLeader')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <FaPlus /> Add Track Leader
                </button>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-left px-6 py-4 text-gray-300 font-medium">Username</th>
                      <th className="text-left px-6 py-4 text-gray-300 font-medium">Email</th>
                      <th className="text-left px-6 py-4 text-gray-300 font-medium">Track</th>
                      <th className="text-left px-6 py-4 text-gray-300 font-medium">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackLeaders.map(leader => (
                      <tr key={leader.username} className="border-t border-gray-700 hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-white font-medium">{leader.username}</td>
                        <td className="px-6 py-4 text-gray-400">{leader.email}</td>
                        <td className="px-6 py-4 text-gray-400">
                          {tracks.find(t => t.id === leader.trackId)?.name || 'Not assigned'}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {leader.lastLogin ? new Date(leader.lastLogin.toDate()).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                    {trackLeaders.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No track leaders yet. Add your first track leader!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                {showModal === 'addBranch' && 'Add Branch'}
                {showModal === 'addTrack' && 'Add Track'}
                {showModal === 'addTrackLeader' && 'Add Track Leader'}
              </h3>
              <button
                onClick={() => { setShowModal(null); setFormData({}); }}
                className="text-gray-400 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {showModal === 'addBranch' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Branch Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="e.g., ITI New Capital"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="e.g., New Capital City, Egypt"
                    />
                  </div>
                </>
              )}

              {showModal === 'addTrack' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Track Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="e.g., Open Source Applications Development"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      rows={3}
                      placeholder="Track description..."
                    />
                  </div>
                </>
              )}

              {showModal === 'addTrackLeader' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Username *</label>
                    <input
                      type="text"
                      value={formData.username || ''}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="e.g., ahmed_leader"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="leader@iti.gov.eg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Assign to Track</label>
                    <select
                      value={formData.trackId || ''}
                      onChange={(e) => setFormData({ ...formData, trackId: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="">Select track...</option>
                      {tracks.map(track => (
                        <option key={track.id} value={track.id}>{track.name}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-sm text-gray-400">
                    A temporary password will be generated and shown after creation.
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
              <button
                onClick={() => { setShowModal(null); setFormData({}); }}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showModal === 'addBranch') handleAddBranch();
                  if (showModal === 'addTrack') handleAddTrack();
                  if (showModal === 'addTrackLeader') handleAddTrackLeader();
                }}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <FaSpinner className="animate-spin" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
