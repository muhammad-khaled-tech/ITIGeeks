
import React from 'react';
import { Html, Head, Body, Container, Section, Text, Heading, Link, Hr, Img } from '@react-email/components';

export const WeeklyReportEmail = ({ 
    studentName, 
    weekNumber, 
    champion, 
    kooz, 
    rank, 
    problemsSolved, 
    streak, 
    leaderboard = [] 
}) => {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={h1}>🏆 ITI Geeks Weekly Report</Heading>
                        <Text style={subtitle}>Week #{weekNumber} | {new Date().toLocaleDateString()}</Text>
                    </Section>

                    {/* Champion Section */}
                    <Section style={championSection}>
                         <Text style={championEmoji}>👑</Text>
                         <Heading style={h2}>Top G of the Week</Heading>
                         <Text style={championName}>{champion.name}</Text>
                         <Text style={stats}>{champion.solved} Problems Solved</Text>
                    </Section>

                    <Hr style={hr} />

                    {/* Personal Stats */}
                    <Section style={personalSection}>
                        <Heading style={h3}>🎯 Your Performance: {studentName}</Heading>
                        <Text style={paragraph}>
                            You ranked <strong>#{rank}</strong> this week!
                        </Text>
                        <Text style={paragraph}>
                            ✅ Solved: {problemsSolved} <br/>
                            🔥 Streak: {streak} days
                        </Text>
                    </Section>

                    {/* El Kooz Section (Fun) */}
                    {kooz && (
                        <Section style={koozSection}>
                            <Heading style={koozHeader}>🥴 El Kooz of the Week</Heading>
                            <Text style={paragraph}>
                                <strong>{kooz.name}</strong> needs some coffee! ☕
                            </Text>
                            <Text style={small}>Solved {kooz.solved} problems... wake up!</Text>
                        </Section>
                    )}

                    <Hr style={hr} />

                    {/* Leaderboard Table */}
                    <Section>
                        <Heading style={h3}>📊 Top 5 Performers</Heading>
                         {leaderboard.slice(0, 5).map((user, index) => (
                             <Text key={index} style={row}>
                                 {index + 1}. {user.name} - {user.solved} solved
                             </Text>
                         ))}
                    </Section>

                    <Section style={footer}>
                        <Link href="https://itigeeks.vercel.app" style={link}>View Full Dashboard</Link>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

// Styles
const main = { backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px' };
const header = { padding: '32px', textAlign: 'center', backgroundColor: '#4f46e5', color: '#fff' };
const h1 = { fontSize: '24px', margin: '0', fontWeight: 'bold' };
const subtitle = { fontSize: '14px', margin: '8px 0 0', opacity: '0.9' };
const championSection = { padding: '32px', textAlign: 'center', backgroundColor: '#fff9c4' };
const championEmoji = { fontSize: '48px', margin: '0' };
const h2 = { fontSize: '20px', color: '#b45309', margin: '8px 0' };
const championName = { fontSize: '32px', fontWeight: 'bold', margin: '0' };
const stats = { fontSize: '16px', color: '#555' };
const personalSection = { padding: '0 32px' };
const h3 = { fontSize: '18px', fontWeight: 'bold', color: '#333' };
const paragraph = { fontSize: '16px', lineHeight: '24px', color: '#525f7f' };
const koozSection = { margin: '20px 32px', padding: '16px', backgroundColor: '#ffebee', borderRadius: '8px', textAlign: 'center' };
const koozHeader = { fontSize: '18px', color: '#c62828', margin: '0' };
const small = { fontSize: '14px', color: '#7f8c8d' };
const row = { fontSize: '14px', padding: '8px 0', borderBottom: '1px solid #eee' };
const footer = { padding: '32px', textAlign: 'center' };
const link = { color: '#4f46e5', textDecoration: 'underline' };
const hr = { borderColor: '#e6ebf1', margin: '20px 0' };
