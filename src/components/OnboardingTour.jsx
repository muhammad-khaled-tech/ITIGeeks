import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '../context/AuthContext';

const OnboardingTour = () => {
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        const hasSeenTour = localStorage.getItem('hasSeenTour');
        if (hasSeenTour) return;

        const driverObj = driver({
            showProgress: true,
            steps: [
                {
                    element: '#navbar-profile',
                    popover: {
                        title: 'Profile & Settings',
                        description: 'Start here! Add your LeetCode username to sync your progress.',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#navbar-sync',
                    popover: {
                        title: 'Sync Progress',
                        description: 'Click this button anytime to fetch your latest solved problems from LeetCode.',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#navbar-assignments',
                    popover: {
                        title: 'Assignments',
                        description: 'Check here for mandatory tasks and deadlines assigned by your supervisor.',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#navbar-contests',
                    popover: {
                        title: 'Contests',
                        description: 'Join live coding battles and climb the leaderboard!',
                        side: "bottom",
                        align: 'start'
                    }
                }
            ],
            onDestroyed: () => {
                localStorage.setItem('hasSeenTour', 'true');
            }
        });

        // Small delay to ensure UI is rendered
        setTimeout(() => {
            driverObj.drive();
        }, 1500);

    }, [currentUser]);

    return null; // This component doesn't render anything itself
};

export default OnboardingTour;
