import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { FaUserGraduate, FaChartLine, FaPlus, FaSearch, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function SupervisorDashboard() {
    const { userData, loading } = useAuth();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Assignment Form State
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [assignmentDeadline, setAssignmentDeadline] = useState('');
    const [assignmentSlugs, setAssignmentSlugs] = useState('');

    useEffect(() => {
        if (!loading && userData?.role !== 'supervisor') {
            navigate('/');
        }
    }, [userData, loading, navigate]);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const q = query(collection(db, 'users'), where('role', '==', 'student'));
                const querySnapshot = await getDocs(q);
                const studentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStudents(studentsData);
            } catch (error) {
                console.error("Error fetching students:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (userData?.role === 'supervisor') {
            fetchStudents();
        }
    }, [userData]);

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        if (!assignmentTitle || !assignmentDeadline || !assignmentSlugs) return;

        try {
            const slugs = assignmentSlugs.split(',').map(s => s.trim()).filter(s => s);
            await addDoc(collection(db, 'assignments'), {
                title: assignmentTitle,
                deadline: assignmentDeadline,
                problems: slugs.map(slug => ({ titleSlug: slug })),
                createdBy: userData.uid,
                createdAt: new Date().toISOString()
            });
            alert("Assignment Created!");
            setAssignmentTitle('');
            setAssignmentDeadline('');
            setAssignmentSlugs('');
        } catch (error) {
            console.error("Error creating assignment:", error);
            alert("Failed to create assignment.");
        }
    };

    const filteredStudents = students.filter(s =>
        (s.displayName || s.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading || isLoading) return <div className="p-8 text-center">Loading Dashboard...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <FaChartLine className="text-brand" /> Supervisor Dashboard
            </h1>

            {/* Assignment Manager */}
            <div className="bg-white dark:bg-leet-card p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
                    <FaPlus className="text-green-500" /> Create Assignment
                </h2>
                <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="text"
                        placeholder="Assignment Title"
                        value={assignmentTitle}
                        onChange={(e) => setAssignmentTitle(e.target.value)}
                        className="p-2 border rounded dark:bg-leet-input dark:border-leet-border dark:text-white"
                        required
                    />
                    <input
                        type="date"
                        value={assignmentDeadline}
                        onChange={(e) => setAssignmentDeadline(e.target.value)}
                        className="p-2 border rounded dark:bg-leet-input dark:border-leet-border dark:text-white"
                        required
                    />
                    <textarea
                        placeholder="Problem Slugs (comma separated, e.g. two-sum, valid-anagram)"
                        value={assignmentSlugs}
                        onChange={(e) => setAssignmentSlugs(e.target.value)}
                        className="p-2 border rounded dark:bg-leet-input dark:border-leet-border dark:text-white md:col-span-2"
                        rows="3"
                        required
                    />
                    <button type="submit" className="bg-brand hover:bg-brand-hover text-white py-2 px-4 rounded md:col-span-2 font-bold">
                        Publish Assignment
                    </button>
                </form>
            </div>

            {/* Student Progress */}
            <div className="bg-white dark:bg-leet-card p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <FaUserGraduate className="text-blue-500" /> Student Progress
                    </h2>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 p-2 border rounded dark:bg-leet-input dark:border-leet-border dark:text-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-leet-border">
                        <thead className="bg-gray-50 dark:bg-leet-input">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-leet-sub uppercase tracking-wider">Student</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-leet-sub uppercase tracking-wider">Solved (Total)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-leet-sub uppercase tracking-wider">Easy / Med / Hard</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-leet-sub uppercase tracking-wider">Last Active</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-leet-sub uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-leet-card divide-y divide-gray-200 dark:divide-leet-border">
                            {filteredStudents.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-4 text-gray-500">No students found.</td></tr>
                            ) : (
                                filteredStudents.map(student => {
                                    const problems = student.problems || [];
                                    const done = problems.filter(p => p.status === 'Done');
                                    const easy = done.filter(p => p.difficulty === 'Easy').length;
                                    const medium = done.filter(p => p.difficulty === 'Medium').length;
                                    const hard = done.filter(p => p.difficulty === 'Hard').length;
                                    const lastActive = student.aiUsage?.date || 'N/A';

                                    return (
                                        <tr key={student.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                                                        {student.photoURL ? <img src={student.photoURL} alt="" className="h-full w-full object-cover" /> : (student.displayName?.[0] || 'S')}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{student.displayName || 'Unknown'}</div>
                                                        <div className="text-sm text-gray-500">{student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-bold">
                                                {done.length}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className="text-green-600 font-bold">{easy}</span> / <span className="text-yellow-600 font-bold">{medium}</span> / <span className="text-red-600 font-bold">{hard}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {lastActive}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => setSelectedStudent(student)} className="text-brand hover:text-brand-hover flex items-center gap-1 ml-auto">
                                                    <FaEye /> Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-leet-card w-full max-w-2xl rounded-lg shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b dark:border-leet-border flex justify-between items-center">
                            <h3 className="text-xl font-bold dark:text-white">{selectedStudent.displayName}'s Analysis</h3>
                            <button onClick={() => setSelectedStudent(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">Close</button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Recent Activity */}
                            <div>
                                <h4 className="font-bold text-lg mb-3 dark:text-gray-200">Recent Activity</h4>
                                <div className="space-y-2">
                                    {(selectedStudent.problems || [])
                                        .filter(p => p.status === 'Done')
                                        .sort((a, b) => new Date(b.completedDate || 0) - new Date(a.completedDate || 0))
                                        .slice(0, 5)
                                        .map((p, i) => (
                                            <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-leet-input p-3 rounded">
                                                <span className="font-medium dark:text-white">{p.title || p.name}</span>
                                                <span className="text-xs text-gray-500">{new Date(p.completedDate).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                    {!(selectedStudent.problems || []).some(p => p.status === 'Done') && <p className="text-gray-500">No recent activity.</p>}
                                </div>
                            </div>

                            {/* Tag Analysis (Mocked based on problem types) */}
                            <div>
                                <h4 className="font-bold text-lg mb-3 dark:text-gray-200">Technique Analysis</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(() => {
                                        const tags = {};
                                        (selectedStudent.problems || []).forEach(p => {
                                            if (p.status === 'Done' && p.type) {
                                                p.type.split(',').forEach(t => {
                                                    const tag = t.trim();
                                                    if (tag) tags[tag] = (tags[tag] || 0) + 1;
                                                });
                                            }
                                        });
                                        const sortedTags = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 10);
                                        if (sortedTags.length === 0) return <p className="text-gray-500">No data available.</p>;
                                        return sortedTags.map(([tag, count]) => (
                                            <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
                                                {tag} ({count})
                                            </span>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
