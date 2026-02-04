import React, { useState, useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { getProblemDifficulty } from '../services/problemMetadataService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  FaTrophy, FaFire, FaChartLine, FaUsers, FaUser, FaArrowUp, FaArrowDown, 
  FaMinus, FaCalendarAlt, FaChevronUp, FaChevronDown 
} from 'react-icons/fa';
import clsx from 'clsx';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Enhanced Leaderboard Component
 * Features:
 * - 3 Tabs: Overall (Total), This Week (Velocity), This Month (Velocity)
 * - Velocity Ranking: Re-orders students based on recent progress
 * - Progress Graph: 180-day cumulative trajectory
 * - 27 Distinct Colors for students
 * - Interactive Legend: Toggle lines on/off
 * - Responsive: Table only on mobile
 */
const EnhancedLeaderboard = ({ members = [], currentUserId }) => {
  const [activeTab, setActiveTab] = useState('weekly'); // overall, weekly, monthly
  const [hiddenStudents, setHiddenStudents] = useState(new Set());
  const [viewMode, setViewMode] = useState('all'); // all, me
  const [isMobile, setIsMobile] = useState(false);
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);
  const [extraMetadata, setExtraMetadata] = useState({});

  // Background Metadata Enrichment (Fixes "All Easy" bug if sync failed)
  // Memoize the missing slugs list to avoid effect re-running if object references change but data doesn't
  const uniqueMissingSlugs = useMemo(() => {
    if (!members.length) return [];
    
    const missing = [];
    members.forEach(m => {
      (m.recentSubmissions || []).forEach(s => {
        const d = (s.difficulty || '').toLowerCase();
        if (!d || d === 'unknown' || d === 'easy') {
          missing.push(s.titleSlug);
        }
      });
    });

    // Only return unique, truthy slugs
    return [...new Set(missing.filter(Boolean))];
  }, [members]); // Depends on members, but "useEffect" below will check length

  useEffect(() => {
    if (uniqueMissingSlugs.length === 0) return;

    const processSequentially = async () => {
      const results = {};
      let failureCount = 0;
      
      for (const slug of uniqueMissingSlugs) {
        // Skip if we already have it in extraMetadata (prevents loop)
        if (extraMetadata[slug]) continue;

        // Abort if we hit 3 consecutive failures (avoids infinite spinning/flooding)
        if (failureCount >= 3) {
          console.warn("[Leaderboard] 🛑 Aborting metadata enrichment due to repeated failures.");
          break;
        }

        try {
          const meta = await getProblemDifficulty(slug);
          if (meta && meta.difficulty !== 'Unknown') {
            results[slug] = meta;
            failureCount = 0; // Reset consecutive counter
          } else {
            failureCount++;
          }
        } catch (e) {
          failureCount++;
        }
      }
      
      if (Object.keys(results).length > 0) {
        setExtraMetadata(prev => ({ ...prev, ...results }));
      }
    };
    
    processSequentially();
    // Intentionally omit extraMetadata from deps to avoid loop (we check inside)
  }, [uniqueMissingSlugs]);

  // Detect mobile view to disable graph
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Helpers ---

  // Generate 27 distinct HSL colors
  const colors = useMemo(() => {
    return Array.from({ length: 27 }, (_, i) => ({
      main: `hsl(${(i * 360) / 27}, 75%, 55%)`,
      light: `hsl(${(i * 360) / 27}, 75%, 90%)`,
    }));
  }, []);

  // Safe parse for submission calendar
  const parseCalendar = (cal) => {
    if (!cal) return {};
    if (typeof cal === 'object') return cal;
    try {
      return JSON.parse(cal);
    } catch (e) {
      console.error("Calendar parse error", e);
      return {};
    }
  };

  // --- Data Processing Logic ---

  const { leaderboardData, chartData, timelineLabels } = useMemo(() => {
    const nowTs = Math.floor(Date.now() / 1000);
    const ONE_DAY = 24 * 60 * 60;
    
    // 1. Prepare Period Timestamps (Egypt/UTC context)
    const today = new Date();
    // Use UTC for consistent midnight boundaries
    const dayOfWeek = today.getUTCDay(); // 0(Sun) - 6(Sat)
    const diffSat = (dayOfWeek + 1) % 7; 
    
    const satUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - diffSat, 0, 0, 0);
    const satTs = Math.floor(satUTC / 1000);

    const monthUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 0, 0, 0);
    const monthTs = Math.floor(monthUTC / 1000);

    const lifetimeTs = Math.floor(new Date('2026-01-01T00:00:00Z').getTime() / 1000);

    // 2. Determine Graph Start based on active tab
    let graphStartTs = lifetimeTs;
    if (activeTab === 'weekly') graphStartTs = satTs;
    else if (activeTab === 'monthly') graphStartTs = monthTs;

    const timelineDays = Math.max(1, Math.ceil((nowTs - graphStartTs) / ONE_DAY));

    // 3. Generate dynamic timeline labels
    const labels = [];
    const dateStrings = [];
    for (let i = timelineDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      labels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      
      const dateKey = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0);
      dateStrings.push(dateKey / 1000);
    }

    // 4. Process each member
    const processedMembers = members.map((m, idx) => {
      const submissions = m.recentSubmissions || [];
      const streak = m.currentStreak || m.streak || 0;
      const streakMultiplier = 1 + (streak / 100);

      // Helper to calculate points for a specific period
      const getPeriodScore = (startTs) => {
        let score = 0;
        let easy = 0,
          medium = 0,
          hard = 0;
        let knownCount = 0;
        const seenSlugs = new Set();

        // 1. Calculate points from visible submissions
        submissions.forEach((sub) => {
          const isAccepted =
            sub.status === "Accepted" ||
            sub.status === "A" ||
            String(sub.status).toLowerCase().includes("accept");

          if (
            isAccepted &&
            sub.timestamp >= startTs &&
            !seenSlugs.has(sub.titleSlug)
          ) {
            seenSlugs.add(sub.titleSlug);

            const enriched = extraMetadata[sub.titleSlug];
            const rawDiff = (sub.difficulty || "Unknown").toLowerCase();
            const diff = enriched ? enriched.difficulty.toLowerCase() : rawDiff;

            if (diff === "easy") {
              score += 25;
              easy++;
              knownCount++;
            } else if (diff === "medium") {
              score += 50;
              medium++;
              knownCount++;
            } else if (diff === "hard") {
              score += 100;
              hard++;
              knownCount++;
            }
          }
        });

        // 2. Use calendar for gap filling (assumes Easy for unknown)
        const calendar = parseCalendar(m.submissionCalendar);
        let calendarCount = 0;

        Object.keys(calendar).forEach((tsStr) => {
          const ts = parseInt(tsStr);
          if (ts >= startTs) {
            calendarCount += calendar[tsStr];
          }
        });

        // Fill gap with Easy points (conservative estimate)
        if (calendarCount > knownCount) {
          const gap = calendarCount - knownCount;
          score += gap * 25;
          easy += gap;
        }

        return {
          score,
          easy,
          medium,
          hard,
        };
      };

      // Calculate period scores
      const weekly = getPeriodScore(satTs);
      const monthly = getPeriodScore(monthTs);

      // Determine final score based on active tab
      let finalScore = 0;
      let rawCount = 0;

      if (activeTab === "weekly") {
        finalScore = Math.round(weekly.score * streakMultiplier);
        rawCount = weekly.easy + weekly.medium + weekly.hard;
      } else if (activeTab === "monthly") {
        finalScore = Math.round(monthly.score * streakMultiplier);
        rawCount = monthly.easy + monthly.medium + monthly.hard;
      } else {
        // Overall: Lifetime weighted points × streak multiplier
        const basePoints =
          (m.easySolved * 25) +
          (m.mediumSolved * 50) +
          (m.hardSolved * 100);
        finalScore = Math.round(basePoints * streakMultiplier);
        rawCount = m.totalSolved || 0;
      }

      // 5. Build Unified Graph Data
      let dailyPoints = [];
      
      // Use Submission Calendar for ALL tabs to ensure consistency with table counts
      const calendar = parseCalendar(m.submissionCalendar);
      dailyPoints = dateStrings.map(ts => {
        let dayCount = 0;
        Object.entries(calendar).forEach(([cts, count]) => {
          const c = parseInt(cts);
          // Match any timestamp within that UTC day
          if (c >= ts && c < ts + ONE_DAY) dayCount += count;
        });
        return dayCount;
      });

      let rollingTotal = 0;
      const cumulativePoints = dailyPoints.map(p => {
        rollingTotal += p;
        return rollingTotal;
      });

      return {
        ...m,
        rawSolved: rawCount,
        currentScore: finalScore,
        periodBreakdown:
          activeTab === "weekly"
            ? weekly
            : activeTab === "monthly"
              ? monthly
              : null,
        graphData: cumulativePoints,
        color: colors[idx % 27],
        streak: streak,
      };
    });

    // 3. Sort and Rank
    const rankedMembers = [...processedMembers]
      .sort((a, b) => b.currentScore - a.currentScore)
      .map((m, i) => ({ 
        ...m, 
        rank: i + 1,
        // Calculate percentages or labels to help the user understand why metrics are static for now
        isVelocityTab: activeTab !== 'overall'
      }));

    // 4. Chart Data Construction
    const visibleDatasets = processedMembers
      .filter(m => viewMode === 'me' ? m.id === currentUserId : !hiddenStudents.has(m.id))
      .map(m => ({
        label: m.displayName || m.leetcodeUsername,
        data: m.graphData,
        borderColor: m.color.main,
        backgroundColor: m.color.main,
        borderWidth: m.id === currentUserId ? 4 : 2,
        tension: 0.3,
        pointRadius: 0, // Performance: hide points unless hovering
        pointHoverRadius: 5,
        hidden: !hiddenStudents.has(m.id) && ! (viewMode === 'me') && rankedMembers.find(rm => rm.id === m.id).rank > 10
      }));

    return {
      leaderboardData: rankedMembers,
      timelineLabels: labels,
      chartData: {
        labels,
        datasets: visibleDatasets
      }
    };
  }, [members, activeTab, hiddenStudents, viewMode, currentUserId, colors]);

  // --- Render Helpers ---

  const getRankBadge = (rank) => {
    let badge = null;
    if (rank === 1) badge = <span className="text-2xl">🥇</span>;
    else if (rank === 2) badge = <span className="text-2xl">🥈</span>;
    else if (rank === 3) badge = <span className="text-2xl">🥉</span>;

    return (
      <div className="flex items-center justify-center gap-3">
        <div className={clsx(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-inner border",
          rank === 1 ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-600" :
          rank === 2 ? "bg-gray-400/10 border-gray-400/20 text-gray-500" :
          rank === 3 ? "bg-orange-500/10 border-orange-500/20 text-orange-600" :
          "bg-gray-100/50 dark:bg-leet-input/50 border-transparent text-gray-400"
        )}>
          #{rank}
        </div>
        {badge && <div className="flex-shrink-0 animate-in zoom-in duration-300">{badge}</div>}
      </div>
    );
  };

  const UserAvatar = ({ user, size = "w-11 h-11" }) => {
    const [imgError, setImgError] = useState(false);
    const initials = (user.displayName || user.leetcodeUsername || '?').charAt(0).toUpperCase();

    if (user.photoURL && !imgError) {
      return (
        <img 
          src={user.photoURL} 
          alt="" 
          className={`${size} rounded-2xl object-cover border-2 border-white dark:border-leet-card shadow-sm group-hover:scale-105 transition-transform`}
          onError={() => setImgError(true)}
        />
      );
    }

    return (
      <div 
        className={`${size} rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm border-2 border-white dark:border-leet-card group-hover:scale-105 transition-transform`}
        style={{ 
          background: `linear-gradient(135deg, ${user.color.main}, ${user.color.main}dd)`,
          textShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        {initials}
      </div>
    );
  };

  const toggleStudent = (id) => {
    setHiddenStudents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // Using custom legend
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 10, font: { size: 10 } }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cumulative Solved Problems',
          font: { size: 10, weight: 'bold' },
          color: '#888'
        },
        grid: { color: 'rgba(200, 200, 200, 0.1)' },
        ticks: { font: { size: 10 } }
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      
      {/* 1. Controller Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-leet-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-leet-border">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-leet-input p-1 rounded-xl w-full lg:w-fit">
          {['overall', 'weekly', 'monthly'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "flex-1 lg:flex-none px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all",
                activeTab === tab 
                  ? "bg-white dark:bg-leet-card text-brand shadow-md shadow-brand/10 ring-1 ring-gray-200 dark:ring-leet-border" 
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-fit">
          {/* View mode toggle removed from here, moved to Graph header per feedback */}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* 2. Leaderboard Table (Always Top, Collapsable) */}
        <div className="bg-white dark:bg-leet-card rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-leet-border flex flex-col transition-all duration-500 ease-in-out">
          <div 
            className="p-6 border-b border-gray-100 dark:border-leet-border bg-gray-50/50 dark:bg-leet-input/50 flex justify-between items-center cursor-pointer hover:bg-gray-100/50 dark:hover:bg-leet-input transition-colors"
            onClick={() => setIsTableCollapsed(!isTableCollapsed)}
          >
            <div className="flex items-center gap-4">
              <h3 className="font-black dark:text-white flex items-center gap-2 uppercase tracking-tighter">
                <FaTrophy className="text-yellow-500" />
                {activeTab} Leaderboard
              </h3>
              <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-leet-input px-2 py-0.5 rounded-full">
                {leaderboardData.length} GEEKS
              </span>
            </div>
            <div className="flex items-center gap-3">
              {isTableCollapsed && (
                <div className="flex -space-x-2 overflow-hidden mr-2">
                  {leaderboardData.slice(0, 5).map(m => (
                    <div key={m.id} className="w-6 h-6 rounded-full border-2 border-white dark:border-leet-card overflow-hidden">
                      <UserAvatar user={m} size="w-full h-full" />
                    </div>
                  ))}
                </div>
              )}
              {isTableCollapsed ? <FaChevronDown className="text-gray-400" /> : <FaChevronUp className="text-gray-400" />}
            </div>
          </div>

          <div className={clsx(
            "transition-all duration-500 ease-in-out overflow-hidden",
            isTableCollapsed ? "max-h-0 opacity-0" : "max-h-[1000px] opacity-100"
          )}>
            <div className="overflow-x-auto overflow-y-auto max-h-[500px] p-2 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-leet-border">
                  <tr>
                    <th className="px-4 py-3 w-32 text-center">🏆 RANKING</th>
                    <th className="px-4 py-3">👤 STUDENT</th>
                    <th className="px-4 py-3 text-center">
                      <div className="flex flex-col">
                        <span className="text-yellow-500">🎯 {activeTab === 'overall' ? 'POINTS' : 'SCORE'}</span>
                        <span className="text-[7px] opacity-60 tracking-[0.2em]">BY DIFFICULTY</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center">
                      <div className="flex flex-col">
                        <span className="text-brand">📊 SOLVED</span>
                        <span className="text-[7px] opacity-60 tracking-[0.2em]">
                          {activeTab === 'overall' ? 'ALL-TIME' : `THIS ${activeTab.replace('ly', '').toUpperCase()}`}
                        </span>
                      </div>
                    </th>
                    {activeTab === 'overall' && (
                      <>
                        <th className="px-2 py-3 text-center text-green-500/70">
                          <div className="flex flex-col">
                            <span>🟢 EASY</span>
                            <span className="text-[7px] opacity-40 italic">LIFETIME</span>
                          </div>
                        </th>
                        <th className="px-2 py-3 text-center text-yellow-500/70">
                          <div className="flex flex-col">
                            <span>🟡 MED</span>
                            <span className="text-[7px] opacity-40 italic">LIFETIME</span>
                          </div>
                        </th>
                        <th className="px-2 py-3 text-center text-red-500/70">
                          <div className="flex flex-col">
                            <span>🔴 HARD</span>
                            <span className="text-[7px] opacity-40 italic">LIFETIME</span>
                          </div>
                        </th>
                      </>
                    )}
                    <th className="px-4 py-3 text-center">🔥 STREAK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-leet-border/30">
                  {leaderboardData.map((member) => (
                    <tr 
                      key={member.id}
                      className={clsx(
                        "group transition-colors duration-200",
                        member.id === currentUserId 
                          ? "bg-brand/[0.03] dark:bg-brand/5" 
                          : "hover:bg-gray-50/50 dark:hover:bg-leet-input/30"
                      )}
                    >
                      {/* Rank */}
                      <td className="px-4 py-4 text-center">
                        {getRankBadge(member.rank)}
                      </td>

                      {/* Info & Avatar */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <UserAvatar user={member} size="w-9 h-9" />
                            {member.streak >= 7 && (
                              <div className="absolute -top-1 -right-1 bg-gradient-to-tr from-orange-600 to-yellow-400 text-white rounded-full p-0.5 border border-white dark:border-leet-card animate-pulse shadow-sm z-10">
                                <FaFire size={6} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={clsx(
                              "text-sm font-black truncate tracking-tight flex items-center gap-1",
                              member.id === currentUserId ? "text-brand" : "text-gray-800 dark:text-gray-100"
                            )}>
                              {member.displayName || 'Unknown Geek'}
                              
                              {/* Emojis for streak loss or bottom rank */}
                              {(member.streak === 0 && (member.longestStreak || 0) > 0) && (
                                <span title="Streak Lost! 🤡" className="cursor-help">🤡</span>
                              )}
                              {member.rank === leaderboardData.length && leaderboardData.length > 1 && (
                                <span title="Bottom of the pack 🫠" className="cursor-help">🫠</span>
                              )}
                            </p>
                            <p className="text-[10px] text-gray-400 font-medium truncate uppercase tracking-widest leading-none mt-0.5">
                              @{member.leetcodeUsername}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Points / Score */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-base font-black text-yellow-600 dark:text-yellow-500 leading-none">
                          {Math.round(member.currentScore).toLocaleString()}
                        </span>
                      </td>

                      {/* Solved Count */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-base font-black text-gray-900 dark:text-white leading-none">
                          {member.rawSolved}
                        </span>
                      </td>

                      {/* Difficulty Breakdown (Only for Overall) */}
                      {activeTab === 'overall' && (
                        <>
                          <td className="px-2 py-4 text-center">
                            <span className="text-xs font-bold text-green-500/80">
                              {member.easySolved}
                            </span>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className="text-xs font-bold text-yellow-500/80">
                              {member.mediumSolved}
                            </span>
                          </td>
                          <td className="px-2 py-4 text-center">
                            <span className="text-xs font-bold text-red-500/80">
                              {member.hardSolved}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Streak Indicator */}
                      <td className="px-4 py-4 text-center">
                        {member.streak > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest">
                            <FaFire size={10} /> {member.streak}d
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-700 font-mono text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3. Progress Graph (Below Table) */}
        {!isMobile && (
          <div className="bg-white dark:bg-leet-card rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-leet-border h-[600px] flex flex-col relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-center mb-8 z-10 flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-black dark:text-white flex items-center gap-2 uppercase tracking-tight">
                  <FaChartLine className="text-brand text-2xl" /> 
                  Progress Trajectory
                </h3>
                <p className="text-xs text-gray-500 mt-2 font-medium flex items-center gap-2 tracking-wide">
                  <FaCalendarAlt size={10} className="text-brand" />
                  Showing results from January 1, 2026.
                </p>
              </div>

              <button
                onClick={() => setViewMode(viewMode === 'all' ? 'me' : 'all')}
                className={clsx(
                  "flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                  viewMode === 'me'
                    ? "bg-brand text-white border-brand shadow-lg shadow-brand/20"
                    : "bg-white dark:bg-leet-card text-gray-500 border-gray-200 dark:border-leet-border hover:border-gray-300 dark:hover:border-leet-sub"
                )}
              >
                {viewMode === 'me' ? <><FaUser size={10} /> My Progress Only</> : <><FaUsers size={12} /> Show Everyone</>}
              </button>
            </div>
            
            {/* Chart Area */}
            <div className="flex-1 relative w-full h-full min-h-0 z-10">
              <Line data={chartData} options={chartOptions} />
            </div>

            {/* Custom Legend Grid */}
            <div className="mt-8 z-10 border-t border-gray-100 dark:border-leet-border pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                {leaderboardData.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggleStudent(m.id)}
                    className={clsx(
                      "flex items-center gap-2 p-1.5 rounded-xl border text-[10px] font-bold transition-all truncate",
                      hiddenStudents.has(m.id) 
                        ? "opacity-30 border-gray-100 dark:border-transparent grayscale" 
                        : "opacity-100 border-transparent bg-gray-50 dark:bg-leet-input hover:scale-105 active:scale-95 shadow-sm"
                    )}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: m.color.main }}
                    />
                    <div className="w-4 h-4 rounded-md overflow-hidden">
                      <UserAvatar user={m} size="w-full h-full" />
                    </div>
                    <span className="truncate dark:text-gray-300">
                      {m.displayName || m.leetcodeUsername}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Mobile-only fallback message */}
      <div className="lg:hidden bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-center">
        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
          <FaChartLine /> Visual progress graph is available on desktop view.
        </p>
      </div>
    </div>
  );
};

export default EnhancedLeaderboard;
