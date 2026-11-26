/**
 * MindDiary Demo Data Seeder
 * Generates a realistic 30-day demo profile for evaluation and live walkthroughs.
 * 
 * Usage:
 *   node server/scripts/seedDemo.js
 * 
 * Environment variables:
 *   MONGODB_URI: MongoDB connection string
 *   DEMO_PASSWORD: Password for demo user (defaults to DemoSafe123!)
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const {
  User,
  DiaryEntry,
  CheckIn,
  HabitLog,
  GratitudeEntry,
  SelfCheck,
  Exam,
  StudySession,
  SmallWin
} = require('../config/models');

const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@minddiary.app';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'DemoSafe123!';
const DEMO_NAME = 'Aarav Sharma';

async function seedDemoData(targetUri) {
  const alreadyConnected = mongoose.connection.readyState === 1;
  if (!alreadyConnected) {
    const uri = targetUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/mydiary';
    console.log(`\n🌱 Connecting to MongoDB: ${uri.replace(/\/\/[^@]+@/, '//***@')} ...`);

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected. Preparing demo data clean slate...');
  }

  // 1. Remove existing demo user and prior demo data
  const existingUser = await User.findOne({ email: DEMO_EMAIL });
  if (existingUser) {
    console.log(`🧹 Removing existing demo data for ${DEMO_EMAIL}...`);
    const uid = existingUser._id;
    await Promise.all([
      DiaryEntry.deleteMany({ user: uid }),
      CheckIn.deleteMany({ user: uid }),
      HabitLog.deleteMany({ user: uid }),
      GratitudeEntry.deleteMany({ user: uid }),
      SelfCheck.deleteMany({ user: uid }),
      Exam.deleteMany({ user: uid }),
      StudySession.deleteMany({ user: uid }),
      SmallWin.deleteMany({ user: uid }),
      User.deleteOne({ _id: uid })
    ]);
  }

  // 2. Create demo user
  const user = await User.create({
    name: DEMO_NAME,
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    isEmailVerified: true,
    allowAIFeatures: true,
    country: 'IN',
    language: 'en',
    theme: 'light',
    trustedContact: {
      name: 'Family Support',
      phone: '+91 98765 43210',
      relation: 'Parent'
    }
  });

  console.log(`👤 Created Demo User: ${user.name} (${user.email})`);

  const now = new Date();
  const checkIns = [];
  const habits = [];
  const gratitudeEntries = [];
  const entries = [];
  const smallWins = [];
  const studySessions = [];

  // Realistic sample diary reflections
  const reflections = [
    {
      title: 'First Morning in the New Semester',
      mood: 'excited',
      tags: ['Academics', 'Growth', 'Morning'],
      content: '<p>Woke up early before the sunrise. Packed my bag, brewed fresh chai, and reviewed my syllabus. There is a sense of renewed focus for the semester ahead.</p>'
    },
    {
      title: 'Finding Calm in the Library Garden',
      mood: 'happy',
      tags: ['Peace', 'Campus', 'Nature'],
      content: '<p>Took a short break between lab sessions to sit beneath the neem tree by the library. The quiet breeze helped clear my mind after hours of debugging code.</p>'
    },
    {
      title: 'A Demanding Algorithm Milestone',
      mood: 'anxious',
      tags: ['Engineering', 'Perseverance', 'Study'],
      content: '<p>Spent the evening grappling with dynamic programming problems. Got stuck on state transitions for hours, but a walk around the block helped me spot the edge case.</p>'
    },
    {
      title: 'Weekend Cooking and Listening to Music',
      mood: 'happy',
      tags: ['Cooking', 'Relaxation', 'Weekend'],
      content: '<p>Prepared homemade vegetable pulao while listening to acoustic guitar playlists. Cooking without rush is such an effective grounding ritual after a busy week.</p>'
    },
    {
      title: 'Group Presentation Dry Run',
      mood: 'neutral',
      tags: ['Teamwork', 'Presentation', 'College'],
      content: '<p>Met with my project team in seminar hall 3. We timed our slides and split up the speaking sections. Still need to polish the conclusion slides, but the flow is cohesive.</p>'
    },
    {
      title: 'Evening Run by the Lake',
      mood: 'happy',
      tags: ['Exercise', 'Health', 'Sunset'],
      content: '<p>Completed a 4km jog as the sun dipped behind the campus trees. My legs felt tired at first, but the cool evening air and steady rhythm felt invigorating.</p>'
    },
    {
      title: 'Midterm Preparation Routine',
      mood: 'neutral',
      tags: ['Study', 'Focus', 'Habits'],
      content: '<p>Organized my revision schedule into 25-minute Pomodoro intervals. Sticking to small achievable blocks makes the syllabus feel manageable instead of overwhelming.</p>'
    },
    {
      title: 'Reflecting on Small Daily Wins',
      mood: 'happy',
      tags: ['Gratitude', 'Mindfulness', 'Evening'],
      content: '<p>Even on days where progress feels gradual, little steps count. Read 20 pages of literature, stayed hydrated, and went to bed without looking at screens late at night.</p>'
    }
  ];

  const gratitudeSnippets = [
    ['Hot tea on a chilly morning', 'A supportive message from an old friend', 'Quiet campus library spot'],
    ['Getting through a difficult test', 'A healthy homemade meal', 'A good night of restful sleep'],
    ['A brisk walk in the park', 'Laughing with classmates over lunch', 'Progress on my coding project'],
    ['Clear autumn skies', 'Listening to my favorite podcast', 'Having time to read before bed'],
    ['Fresh air during morning stretches', 'Finding a clean solution to a bug', 'Peace of mind']
  ];

  // 3. Populate 30 days of check-ins, habits, and periodic entries
  for (let i = 29; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - i);
    const dateStr = targetDate.toISOString().split('T')[0];

    // Realistic fluctuating scores (mood 3-5, stress 1-3, sleep 6.5-8.5)
    const baseMood = (i % 7 === 0 || i % 7 === 1) ? 4 : (i % 5 === 0 ? 3 : 4);
    const moodScore = Math.min(5, Math.max(2, baseMood + (i % 3 === 0 ? 1 : 0)));
    const stressLevel = moodScore >= 4 ? 2 : 3;
    const sleepHours = 6.5 + (i % 4) * 0.5;

    checkIns.push({
      user: user._id,
      date: dateStr,
      moodScore,
      stressLevel,
      sleepHours,
      note: i % 2 === 0 ? 'Consistent day of focused work and steady pace.' : 'Took breaks when needed and stayed mindful.'
    });

    habits.push({
      user: user._id,
      date: dateStr,
      habits: {
        meditation: i % 3 !== 0,
        exercise: i % 2 === 0,
        hydration: true,
        reading: i % 4 !== 0,
        sleepOnTime: sleepHours >= 7.0
      }
    });

    // Spread 8 diary entries across the month
    if (i % 4 === 0) {
      const ref = reflections[(i / 4) % reflections.length];
      entries.push({
        user: user._id,
        title: ref.title,
        content: ref.content,
        mood: ref.mood,
        tags: ref.tags,
        entryDate: targetDate,
        isFavorite: i % 8 === 0
      });
    }

    // Spread gratitude logs
    if (i % 6 === 0) {
      const items = gratitudeSnippets[(i / 6) % gratitudeSnippets.length];
      gratitudeEntries.push({
        user: user._id,
        items,
        createdAt: targetDate
      });
    }

    // Study sessions (every 2-3 days)
    if (i % 2 === 0) {
      studySessions.push({
        user: user._id,
        durationMinutes: 50,
        technique: 'Pomodoro 25/5 (2 cycles)',
        date: targetDate
      });
    }

    // Small wins for the most recent 7 days
    if (i < 7) {
      smallWins.push({
        user: user._id,
        dateKey: dateStr,
        tasks: [
          { text: 'Review 1 chapter of system architecture', completed: true },
          { text: '15-minute mindfulness breathing pause', completed: true },
          { text: 'Drink 2.5L water and stretch', completed: i !== 1 }
        ]
      });
    }
  }

  // 4. Clinical validation Self-Checks (PHQ-9 & GAD-7)
  const phq9 = {
    user: user._id,
    type: 'PHQ-9',
    score: 4,
    severity: 'Minimal depression',
    answers: ['0', '1', '0', '1', '0', '0', '1', '1', '0'],
    date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  };

  const gad7 = {
    user: user._id,
    type: 'GAD-7',
    score: 3,
    severity: 'Minimal anxiety',
    answers: ['0', '1', '0', '1', '0', '1', '0'],
    date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
  };

  // 5. Upcoming Exams
  const exam1 = {
    user: user._id,
    subject: 'Data Structures & Algorithms',
    date: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
    notes: 'Focus on Graph traversals (DFS/BFS) and amortized tree analysis.'
  };

  const exam2 = {
    user: user._id,
    subject: 'Computer Networks',
    date: new Date(now.getTime() + 19 * 24 * 60 * 60 * 1000),
    notes: 'Revise TCP congestion control and subnetting formulas.'
  };

  // 6. Bulk Insert
  await Promise.all([
    CheckIn.insertMany(checkIns),
    HabitLog.insertMany(habits),
    DiaryEntry.insertMany(entries),
    GratitudeEntry.insertMany(gratitudeEntries),
    StudySession.insertMany(studySessions),
    SmallWin.insertMany(smallWins),
    SelfCheck.create(phq9),
    SelfCheck.create(gad7),
    Exam.create(exam1),
    Exam.create(exam2)
  ]);

  // Update user stats
  await User.findByIdAndUpdate(user._id, {
    totalEntries: entries.length,
    currentStreak: 12,
    longestStreak: 24
  });

  console.log('\n======================================================');
  console.log('🎉 DEMO DATA SEEDED SUCCESSFULLY');
  console.log('======================================================');
  console.log(`Email:      ${DEMO_EMAIL}`);
  console.log(`Password:   ${DEMO_PASSWORD}`);
  console.log(`Check-Ins:  ${checkIns.length} days`);
  console.log(`Habits:     ${habits.length} days`);
  console.log(`Entries:    ${entries.length} reflections`);
  console.log(`Gratitudes: ${gratitudeEntries.length} entries`);
  console.log(`Screenings: 1x PHQ-9 (score: 4), 1x GAD-7 (score: 3)`);
  console.log(`Student:    2 exams, ${studySessions.length} study sessions, ${smallWins.length} daily win logs`);
  console.log('======================================================\n');

  if (!alreadyConnected) {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seedDemoData().catch((err) => {
    console.error('❌ Failed to seed demo data:', err);
    process.exit(1);
  });
}

module.exports = { seedDemoData };
