import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();
const PASSWORD = 'Password123';

async function main() {
  console.log('Seeding database (safe mode - never deletes existing data)...');
  const passwordHash = await hashPassword(PASSWORD);

  // ==================== USERS (upsert - never deletes) ====================
  console.log('Upserting users...');
  const userDefs = [
    { email: 'admin@campus.edu', username: 'admin', fullName: 'Admin User', role: 'ADMIN' as const, bio: 'Platform administrator', department: 'Computer Science', level: 400, skills: ['Management', 'Leadership'], interests: ['Technology', 'Education'] },
    { email: 'ada@campus.edu', username: 'ada_eze', fullName: 'Ada Eze', role: 'STUDENT' as const, bio: 'Computer Science student who loves building things', department: 'Computer Science', level: 300, skills: ['JavaScript', 'Python', 'React', 'Node.js'], interests: ['AI', 'Web Dev', 'Music'] },
    { email: 'chidi@campus.edu', username: 'chidi_okafor', fullName: 'Chidi Okafor', role: 'STUDENT' as const, bio: 'Electrical Engineering student | Football enthusiast', department: 'Electrical Engineering', level: 200, skills: ['Circuit Design', 'MATLAB', 'Arduino'], interests: ['Football', 'Robotics', 'Gaming'] },
    { email: 'fatima@campus.edu', username: 'fatima_ali', fullName: 'Fatima Ali', role: 'STUDENT' as const, bio: 'Medical student | Future surgeon', department: 'Medicine', level: 400, skills: ['Anatomy', 'Research', 'Public Speaking'], interests: ['Healthcare', 'Volunteering', 'Reading'] },
    { email: 'emeka@campus.edu', username: 'emeka_nwosu', fullName: 'Emeka Nwosu', role: 'STUDENT' as const, bio: 'Business Administration | Campus entrepreneur', department: 'Business Administration', level: 300, skills: ['Marketing', 'Finance', 'Public Relations'], interests: ['Entrepreneurship', 'Music', 'Travel'] },
    { email: 'blessing@campus.edu', username: 'blessing_ume', fullName: 'Blessing Ume', role: 'STUDENT' as const, bio: 'Law student | Aspiring human rights lawyer', department: 'Law', level: 200, skills: ['Legal Research', 'Debate', 'Writing'], interests: ['Human Rights', 'Drama', 'Cooking'] },
    { email: 'ahmed@campus.edu', username: 'ahmed_bello', fullName: 'Ahmed Bello', role: 'STUDENT' as const, bio: 'Mass Communication | Campus radio host', department: 'Mass Communication', level: 300, skills: ['Broadcasting', 'Video Editing', 'Photography'], interests: ['Journalism', 'Photography', 'Football'] },
    { email: 'grace@campus.edu', username: 'grace_okediji', fullName: 'Grace Okediji', role: 'STUDENT' as const, bio: 'Architecture student | Design is my passion', department: 'Architecture', level: 400, skills: ['AutoCAD', 'Revit', 'SketchUp', 'Photoshop'], interests: ['Sustainable Design', 'Art', 'Travel'] },
    { email: 'daniel@campus.edu', username: 'daniel_abubakar', fullName: 'Daniel Abubakar', role: 'STUDENT' as const, bio: 'Mathematics student | Data science enthusiast', department: 'Mathematics', level: 200, skills: ['Statistics', 'Python', 'R', 'Excel'], interests: ['Data Science', 'Chess', 'Cycling'] },
    { email: 'sarah@campus.edu', username: 'sarah_mensah', fullName: 'Sarah Mensah', role: 'STUDENT' as const, bio: 'Pharmacy student | Beauty with brains', department: 'Pharmacy', level: 300, skills: ['Pharmacology', 'Research', 'Patient Care'], interests: ['Skincare', 'Fitness', 'Podcasts'] },
  ];

  const users: Record<string, any> = {};
  for (const def of userDefs) {
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: {},
      create: {
        email: def.email,
        username: def.username,
        fullName: def.fullName,
        passwordHash,
        isVerified: true,
        role: def.role,
        bio: def.bio,
        department: def.department,
        level: def.level,
        skills: def.skills,
        interests: def.interests,
      },
    });
    users[def.username] = user;
  }
  const { admin, ada_eze: ada, chidi_okafor: chidi, fatima_ali: fatima, emeka_nwosu: emeka, blessing_ume: blessing, ahmed_bello: ahmed, grace_okediji: grace, daniel_abubakar: daniel, sarah_mensah: sarah } = users;
  console.log(`Upserted ${Object.keys(users).length} users`);

  // ==================== FOLLOWS (skip if exists) ====================
  const followCount = await prisma.follow.count();
  if (followCount === 0) {
    console.log('Creating follows...');
    await prisma.follow.createMany({
      data: [
        { followerId: ada.id, followingId: chidi.id },
        { followerId: ada.id, followingId: fatima.id },
        { followerId: ada.id, followingId: emeka.id },
        { followerId: chidi.id, followingId: ada.id },
        { followerId: chidi.id, followingId: ahmed.id },
        { followerId: fatima.id, followingId: ada.id },
        { followerId: fatima.id, followingId: grace.id },
        { followerId: emeka.id, followingId: blessing.id },
        { followerId: emeka.id, followingId: sarah.id },
        { followerId: blessing.id, followingId: ada.id },
        { followerId: blessing.id, followingId: daniel.id },
        { followerId: ahmed.id, followingId: chidi.id },
        { followerId: ahmed.id, followingId: fatima.id },
        { followerId: grace.id, followingId: ada.id },
        { followerId: grace.id, followingId: emeka.id },
        { followerId: daniel.id, followingId: ada.id },
        { followerId: daniel.id, followingId: sarah.id },
        { followerId: sarah.id, followingId: fatima.id },
        { followerId: sarah.id, followingId: grace.id },
      ],
    });
    console.log('Created 19 follows');
  } else {
    console.log(`Follows already exist (${followCount}), skipping...`);
  }

  // ==================== POSTS (skip if exists) ====================
  const postCount = await prisma.post.count();
  if (postCount === 0) {
    console.log('Creating posts...');
    const posts = await Promise.all([
      prisma.post.create({ data: { authorId: ada.id, content: 'Just deployed my first full-stack project! It\'s a campus marketplace platform built with React and Node.js. Check it out and let me know what you think! #WebDev #CampusLife', type: 'TEXT', tags: ['WebDev', 'CampusLife'] } }),
      prisma.post.create({ data: { authorId: chidi.id, content: 'Who else is ready for midterms next week? I\'ve been studying day and night. Anyone want to form a study group for Signals & Systems?', type: 'TEXT', tags: ['MidtermPrep', 'StudyGroup'] } }),
      prisma.post.create({ data: { authorId: fatima.id, content: 'Just finished my 12-hour clinical rotation at the teaching hospital. Exhausting but worth it! Every day brings me closer to my dream of becoming a surgeon.', type: 'TEXT', tags: ['MedLife', 'ClinicalRotation'] } }),
      prisma.post.create({ data: { authorId: emeka.id, content: 'Exciting news! My small business just hit 1000 customers! Started this from my dorm room last year. If you have a business idea, just START.', type: 'TEXT', tags: ['Entrepreneurship', 'CampusBusiness'] } }),
      prisma.post.create({ data: { authorId: blessing.id, content: 'Moot court competition tomorrow! Our team has been preparing for weeks. Wish us luck as we argue this human rights case!', type: 'TEXT', tags: ['MootCourt', 'LawSchool'] } }),
      prisma.post.create({ data: { authorId: ahmed.id, content: 'New episode of our campus podcast is out! This week we talked about mental health awareness among students. #CampusRadio #MentalHealth', type: 'TEXT', tags: ['Podcast', 'MentalHealth'] } }),
      prisma.post.create({ data: { authorId: grace.id, content: 'My thesis project on sustainable housing for tropical climates is finally coming together. Three months of research and design.', type: 'TEXT', tags: ['Architecture', 'ThesisProject'] } }),
      prisma.post.create({ data: { authorId: daniel.id, content: 'Pro tip for math students: Don\'t just memorize formulas. Understand the derivation behind them. It makes problem-solving 10x easier.', type: 'TEXT', tags: ['StudyTips', 'Mathematics'] } }),
      prisma.post.create({ data: { authorId: sarah.id, content: 'Pharmacy school is no joke. But seeing patients understand their medication regimen makes it all worthwhile. Keep pushing, future pharmacists!', type: 'TEXT', tags: ['PharmacyLife', 'StudyMotivation'] } }),
      prisma.post.create({ data: { authorId: ada.id, content: 'Looking for a roommate for next semester! I have a 2-bedroom apartment near the school gate. Rent is affordable. DM me if interested!', type: 'TEXT', tags: ['Roommate', 'Housing'] } }),
      prisma.post.create({ data: { authorId: chidi.id, content: 'Our football team won the inter-departmental tournament! 3-1 in the final. What a game!', type: 'TEXT', tags: ['Football', 'Champions'] } }),
      prisma.post.create({ data: { authorId: emeka.id, content: 'Hosting a free entrepreneurship workshop this Saturday. Learn how to start your business with zero capital. Tag someone who needs to see this!', type: 'TEXT', tags: ['Workshop', 'FreeEvent'] } }),
    ]);

    // Comments
    await prisma.comment.createMany({
      data: [
        { authorId: chidi.id, postId: posts[0].id, content: 'This is amazing! Would love to contribute. Can you share the repo link?' },
        { authorId: emeka.id, postId: posts[0].id, content: 'Congrats Ada! The UI looks really clean. Great work!' },
        { authorId: ada.id, postId: posts[1].id, content: 'Count me in! I also need help with Signals & Systems. Let\'s meet at the library tomorrow?' },
        { authorId: daniel.id, postId: posts[1].id, content: 'I can help with the math parts. Let me know when you\'re free!' },
        { authorId: ada.id, postId: posts[2].id, content: 'You\'re going to be an incredible surgeon Fatima! Keep going' },
        { authorId: emeka.id, postId: posts[3].id, content: 'This is so inspiring! What\'s the name of your business?' },
        { authorId: blessing.id, postId: posts[5].id, content: 'Great topic! Mental health matters. Thanks for bringing awareness to this.' },
        { authorId: sarah.id, postId: posts[7].id, content: 'This is solid advice! I\'m sharing this with my study group.' },
        { authorId: grace.id, postId: posts[9].id, content: 'Is it close to campus? I\'m interested!' },
        { authorId: ahmed.id, postId: posts[11].id, content: 'I\'ll cover this for the campus news! Great initiative Emeka.' },
      ],
    });

    // Likes
    const allUsers = Object.values(users);
    const likeData: { userId: string; postId: string }[] = [];
    for (const post of posts) {
      const numLikes = Math.floor(Math.random() * 6) + 2;
      const shuffled = [...allUsers].sort(() => 0.5 - Math.random());
      for (let i = 0; i < Math.min(numLikes, shuffled.length); i++) {
        likeData.push({ userId: shuffled[i].id, postId: post.id });
      }
    }
    const uniqueLikes = likeData.filter(
      (like, index, self) => index === self.findIndex((l) => l.userId === like.userId && l.postId === like.postId)
    );
    await prisma.like.createMany({ data: uniqueLikes });
    console.log(`Created ${posts.length} posts, comments, and likes`);
  } else {
    console.log(`Posts already exist (${postCount}), skipping...`);
  }

  // ==================== MARKETPLACE (skip if exists) ====================
  const marketplaceCount = await prisma.marketplaceItem.count();
  if (marketplaceCount === 0) {
    console.log('Creating marketplace items...');
    await Promise.all([
      prisma.marketplaceItem.create({ data: { title: 'MacBook Pro 2024', description: 'Like new MacBook Pro with M3 chip, 16GB RAM, 512GB SSD.', images: [], price: 8500, currency: 'GHS', category: 'ELECTRONICS', condition: 'LIKE_NEW', sellerId: ada.id, location: 'Main Campus' } }),
      prisma.marketplaceItem.create({ data: { title: 'Engineering Mathematics Textbook', description: 'Advanced Engineering Mathematics by Kreyszig, 10th edition.', images: [], price: 150, currency: 'GHS', category: 'BOOKS', condition: 'USED', sellerId: daniel.id, location: 'Science Block' } }),
      prisma.marketplaceItem.create({ data: { title: 'iPhone 15 Pro Max', description: 'Brand new iPhone 15 Pro Max, 256GB, Natural Titanium.', images: [], price: 6500, currency: 'GHS', category: 'ELECTRONICS', condition: 'NEW', sellerId: emeka.id, location: 'Business Faculty' } }),
      prisma.marketplaceItem.create({ data: { title: 'Desk Fan - 12 inch', description: 'Lasko 12-inch desk fan. Works perfectly.', images: [], price: 80, currency: 'GHS', category: 'HOSTEL_ITEMS', condition: 'USED', sellerId: blessing.id, location: 'Hall B' } }),
      prisma.marketplaceItem.create({ data: { title: 'Nike Air Max Sneakers - Size 42', description: 'White Nike Air Max sneakers, size 42. Worn twice.', images: [], price: 350, currency: 'GHS', category: 'CLOTHING', condition: 'LIKE_NEW', sellerId: ahmed.id, location: 'Main Campus' } }),
      prisma.marketplaceItem.create({ data: { title: 'Scientific Calculator - Casio FX-991', description: 'Casio FX-991EX ClassWiz scientific calculator.', images: [], price: 120, currency: 'GHS', category: 'ELECTRONICS', condition: 'USED', sellerId: chidi.id, location: 'Engineering Block' } }),
      prisma.marketplaceItem.create({ data: { title: 'Private Tutoring - Mathematics', description: 'One-on-one math tutoring. GHS 50/hour.', images: [], price: 50, currency: 'GHS', category: 'SERVICES', condition: 'NEW', sellerId: daniel.id, location: 'Online / Campus' } }),
      prisma.marketplaceItem.create({ data: { title: 'HP Laptop - Core i7, 16GB RAM', description: 'HP Pavilion laptop, Core i7 12th gen, 16GB RAM, 512GB SSD.', images: [], price: 3500, currency: 'GHS', category: 'ELECTRONICS', condition: 'USED', sellerId: grace.id, location: 'Architecture Block' } }),
    ]);
    console.log('Created 8 marketplace items');
  } else {
    console.log(`Marketplace items already exist (${marketplaceCount}), skipping...`);
  }

  // ==================== NOTES (skip if exists) ====================
  const noteCount = await prisma.note.count();
  if (noteCount === 0) {
    console.log('Creating notes...');
    await Promise.all([
      prisma.note.create({ data: { title: 'Data Structures Complete Notes', description: 'Comprehensive notes covering arrays, linked lists, trees, graphs.', fileUrl: '/uploads/notes/data-structures.pdf', fileType: 'PDF', course: 'CSC 201', department: 'Computer Science', level: 200, semester: 'First Semester', uploaderId: ada.id, tags: ['Data Structures', 'Programming'] } }),
      prisma.note.create({ data: { title: 'Calculus II Past Questions (2020-2024)', description: 'Past exam questions with detailed solutions.', fileUrl: '/uploads/notes/calculus-past-questions.pdf', fileType: 'PDF', course: 'MTH 202', department: 'Mathematics', level: 200, semester: 'Second Semester', uploaderId: daniel.id, tags: ['Calculus', 'Past Questions'] } }),
      prisma.note.create({ data: { title: 'Introduction to Anatomy - Lecture Slides', description: 'Complete lecture slides for Introduction to Anatomy.', fileUrl: '/uploads/notes/anatomy-slides.ppt', fileType: 'PPT', course: 'BIO 101', department: 'Medicine', level: 100, semester: 'First Semester', uploaderId: fatima.id, tags: ['Anatomy', 'Biology'] } }),
      prisma.note.create({ data: { title: 'Business Law Study Guide', description: 'Comprehensive study guide for Business Law.', fileUrl: '/uploads/notes/business-law.pdf', fileType: 'PDF', course: 'BUS 301', department: 'Business Administration', level: 300, semester: 'First Semester', uploaderId: emeka.id, tags: ['Business Law', 'Study Guide'] } }),
      prisma.note.create({ data: { title: 'Signals and Systems Formula Sheet', description: 'Quick reference formula sheet.', fileUrl: '/uploads/notes/signals-formulas.pdf', fileType: 'PDF', course: 'ECE 301', department: 'Electrical Engineering', level: 300, semester: 'First Semester', uploaderId: chidi.id, tags: ['Signals', 'Systems', 'Formulas'] } }),
      prisma.note.create({ data: { title: 'Constitutional Law Notes', description: 'Detailed notes on Constitutional Law.', fileUrl: '/uploads/notes/constitutional-law.pdf', fileType: 'PDF', course: 'LAW 201', department: 'Law', level: 200, semester: 'Second Semester', uploaderId: blessing.id, tags: ['Constitutional Law', 'Law'] } }),
      prisma.note.create({ data: { title: 'Mass Media and Society - Handout', description: 'Complete handout for Mass Media and Society.', fileUrl: '/uploads/notes/mass-media.docx', fileType: 'DOCX', course: 'COM 201', department: 'Mass Communication', level: 200, semester: 'First Semester', uploaderId: ahmed.id, tags: ['Mass Media', 'Communication'] } }),
      prisma.note.create({ data: { title: 'Pharmacology Drug List', description: 'Complete drug list for Pharmacology I.', fileUrl: '/uploads/notes/pharmacology-drugs.pdf', fileType: 'PDF', course: 'PHA 301', department: 'Pharmacy', level: 300, semester: 'First Semester', uploaderId: sarah.id, tags: ['Pharmacology', 'Drugs'] } }),
      prisma.note.create({ data: { title: 'Architecture Design Principles', description: 'Notes on fundamental design principles.', fileUrl: '/uploads/notes/design-principles.ppt', fileType: 'PPT', course: 'ARC 301', department: 'Architecture', level: 300, semester: 'First Semester', uploaderId: grace.id, tags: ['Design', 'Architecture'] } }),
    ]);
    console.log('Created 9 notes');
  } else {
    console.log(`Notes already exist (${noteCount}), skipping...`);
  }

  // ==================== STUDY GROUPS (skip if exists) ====================
  const groupCount = await prisma.studyGroup.count();
  if (groupCount === 0) {
    console.log('Creating study groups...');
    await prisma.studyGroup.create({ data: { name: 'CS Problem Solvers', description: 'For CS students to discuss algorithms and coding challenges.', course: 'CSC 201', department: 'Computer Science', level: 200, creatorId: ada.id, isPublic: true, members: { create: [{ userId: ada.id, role: 'ADMIN' }, { userId: daniel.id, role: 'MEMBER' }, { userId: chidi.id, role: 'MEMBER' }] } } });
    await prisma.studyGroup.create({ data: { name: 'Med School Warriors', description: 'Support group for medical students.', department: 'Medicine', creatorId: fatima.id, isPublic: true, members: { create: [{ userId: fatima.id, role: 'ADMIN' }, { userId: sarah.id, role: 'MEMBER' }] } } });
    await prisma.studyGroup.create({ data: { name: 'Engineering Maths Hub', description: 'For engineering students struggling with mathematics.', course: 'MTH 201', department: 'Engineering', creatorId: chidi.id, isPublic: true, members: { create: [{ userId: chidi.id, role: 'ADMIN' }, { userId: daniel.id, role: 'MODERATOR' }, { userId: ada.id, role: 'MEMBER' }] } } });
    await prisma.studyGroup.create({ data: { name: 'Law Review Club', description: 'Weekly discussions on landmark cases and moot court prep.', department: 'Law', creatorId: blessing.id, isPublic: true, members: { create: [{ userId: blessing.id, role: 'ADMIN' }, { userId: ahmed.id, role: 'MEMBER' }] } } });
    console.log('Created 4 study groups');
  } else {
    console.log(`Study groups already exist (${groupCount}), skipping...`);
  }

  // ==================== HOSTELS (skip if exists) ====================
  const hostelCount = await prisma.hostel.count();
  if (hostelCount === 0) {
    console.log('Creating hostels...');
    await Promise.all([
      prisma.hostel.create({ data: { name: 'Casely Hayford Hall (Casford)', description: 'The premier all-male hall at UCC. Legendary for vibrant culture and sports dominance.', images: [], location: 'Northern Campus (Science)', pricePerMonth: 150, currency: 'GHS', roomType: 'SHARED', facilities: ['WiFi', 'Water', '24/7 Power', 'Study Room', 'JCR', 'Sports Courts'], contactPhone: '+233-332-132-456', contactEmail: 'casford@ucc.edu.gh', latitude: 5.1150, longitude: -1.2900 } }),
      prisma.hostel.create({ data: { name: 'Kwame Nkrumah Hall', description: 'Mixed-gender hall with modern facilities near the Science Faculty.', images: [], location: 'Northern Campus', pricePerMonth: 160, currency: 'GHS', roomType: 'SHARED', facilities: ['WiFi', 'Water', '24/7 Power', 'Library', 'Shops', 'Cafeteria'], contactPhone: '+233-332-132-457', contactEmail: 'nkrumah@ucc.edu.gh', latitude: 5.1180, longitude: -1.2920 } }),
      prisma.hostel.create({ data: { name: 'Valco Hall', description: 'The Industrial Hall with focus on student entrepreneurship.', images: [], location: 'Northern Campus', pricePerMonth: 140, currency: 'GHS', roomType: 'SHARED', facilities: ['WiFi', 'Water', '24/7 Power', 'Study Room', 'Supermarket', 'Laundry'], contactPhone: '+233-332-132-458', contactEmail: 'valco@ucc.edu.gh', latitude: 5.1170, longitude: -1.2880 } }),
      prisma.hostel.create({ data: { name: 'Atlantic Hall (ATL)', description: 'Premier mixed hall with ocean views on Southern Campus.', images: [], location: 'Southern Campus (Old Site)', pricePerMonth: 155, currency: 'GHS', roomType: 'SHARED', facilities: ['WiFi', 'Water', '24/7 Power', 'Library', 'Ocean View', 'Sports Courts'], contactPhone: '+233-332-132-459', contactEmail: 'atl@ucc.edu.gh', latitude: 5.1050, longitude: -1.2800 } }),
      prisma.hostel.create({ data: { name: 'Adehye Hall', description: 'The royal female-only hall with on-site salon and gardens.', images: [], location: 'Southern Campus (Old Site)', pricePerMonth: 150, currency: 'GHS', roomType: 'SHARED', facilities: ['WiFi', 'Water', '24/7 Power', 'Salon', 'Gardens', 'Security'], contactPhone: '+233-332-132-460', contactEmail: 'adehye@ucc.edu.gh', latitude: 5.1030, longitude: -1.2780 } }),
      prisma.hostel.create({ data: { name: 'Oguaa Hall', description: 'One of the oldest halls, rich in culture with large common rooms.', images: [], location: 'Southern Campus (Old Site)', pricePerMonth: 130, currency: 'GHS', roomType: 'SHARED', facilities: ['WiFi', 'Water', '24/7 Power', 'JCR', 'Shops', 'Sports Courts'], contactPhone: '+233-332-132-461', contactEmail: 'oguaa@ucc.edu.gh', latitude: 5.1020, longitude: -1.2820 } }),
      prisma.hostel.create({ data: { name: 'SRC Hostel', description: 'Modern self-contained hostel with gym and shuttle service.', images: [], location: 'Akotokyir', pricePerMonth: 45, currency: 'USD', roomType: 'SELF_CONTAINED', facilities: ['WiFi', 'Water', '24/7 Power', 'Gym', 'Shuttle Service', 'Security'], contactPhone: '+233-332-132-462', contactEmail: 'srchostel@ucc.edu.gh', latitude: 5.1220, longitude: -1.2980 } }),
      prisma.hostel.create({ data: { name: 'Superannuation Hostel', description: 'Premium university-managed hostel with en-suite rooms.', images: [], location: 'Akotokyir', pricePerMonth: 50, currency: 'USD', roomType: 'SELF_CONTAINED', facilities: ['WiFi', 'Water', '24/7 Power', 'AC', 'Laundry', 'Study Room'], contactPhone: '+233-332-132-463', contactEmail: 'superannuation@ucc.edu.gh', latitude: 5.1240, longitude: -1.2960 } }),
      prisma.hostel.create({ data: { name: 'Ewusiwa Hostel', description: 'Popular private hostel in Apewosika with high-speed Wi-Fi.', images: [], location: 'Apewosika', pricePerMonth: 48, currency: 'USD', roomType: 'SELF_CONTAINED', facilities: ['WiFi', 'Water', 'Security', 'Parking'], contactPhone: '+233-244-123-456', contactEmail: 'ewusiwahostel@gmail.com', latitude: 5.1200, longitude: -1.2850 } }),
      prisma.hostel.create({ data: { name: 'The Nest Hostel', description: 'Serene private hostel in Kwaprow with CCTV security.', images: [], location: 'Kwaprow', pricePerMonth: 46, currency: 'USD', roomType: 'SELF_CONTAINED', facilities: ['WiFi', 'Water', 'Security', 'CCTV', 'Kitchenette'], contactPhone: '+233-243-789-012', contactEmail: 'thenestkwaprow@gmail.com', latitude: 5.1260, longitude: -1.2890 } }),
    ]);
    console.log('Created 10 hostels');
  } else {
    console.log(`Hostels already exist (${hostelCount}), skipping...`);
  }

  // ==================== JOBS (skip if exists) ====================
  const jobCount = await prisma.job.count();
  if (jobCount === 0) {
    console.log('Creating jobs...');
    await Promise.all([
      prisma.job.create({ data: { title: 'Frontend Developer Intern', company: 'TechStart Ghana', description: 'Build innovative web applications with React and TypeScript.', requirements: ['HTML/CSS', 'JavaScript basics', 'React (bonus)', 'Git basics'], salary: 'GH800/month', jobType: 'INTERNSHIP', location: 'Accra (Hybrid)', isRemote: true, deadline: new Date('2026-08-30'), contactEmail: 'jobs@techstart.com' } }),
      prisma.job.create({ data: { title: 'Data Entry Clerk', company: 'GreenField Enterprises', description: 'Part-time data entry. Flexible hours for students.', requirements: ['Fast typing', 'Attention to detail', 'Microsoft Excel'], salary: 'GH300/month', jobType: 'PART_TIME', location: 'On Campus', isRemote: false, deadline: new Date('2026-07-15'), contactEmail: 'hr@greenfield.com' } }),
      prisma.job.create({ data: { title: 'Campus Brand Ambassador', company: 'StudyBuddy App', description: 'Represent StudyBuddy on campus. Earn commissions.', requirements: ['Excellent communication', 'Social media savvy', 'Leadership skills'], salary: 'Commission-based', jobType: 'PART_TIME', location: 'On Campus', isRemote: false, deadline: new Date('2026-09-01'), contactEmail: 'ambassador@studybuddy.com' } }),
      prisma.job.create({ data: { title: 'Software Engineering Intern', company: 'FinTech Solutions', description: 'Summer internship in backend team with Node.js and AWS.', requirements: ['Node.js', 'SQL basics', 'REST APIs', 'Problem-solving skills'], salary: 'GH1,200/month', jobType: 'INTERNSHIP', location: 'Kumasi', isRemote: false, deadline: new Date('2026-07-31'), contactEmail: 'internships@fintech.com' } }),
      prisma.job.create({ data: { title: 'Freelance Graphic Designer', company: 'CreativeHub', description: 'Create social media graphics and marketing materials.', requirements: ['Adobe Photoshop', 'Adobe Illustrator', 'Portfolio'], salary: 'GH150 - GH500 per project', jobType: 'FREELANCE', location: 'Remote', isRemote: true, deadline: new Date('2026-12-31'), contactEmail: 'design@creativehub.com' } }),
    ]);
    console.log('Created 5 jobs');
  } else {
    console.log(`Jobs already exist (${jobCount}), skipping...`);
  }

  // ==================== EVENTS (skip if exists) ====================
  const eventCount = await prisma.event.count();
  if (eventCount === 0) {
    console.log('Creating events...');
    await prisma.event.create({ data: { title: 'Tech Conference 2026', description: 'Annual tech conference with industry leaders and workshops.', venue: 'University Auditorium', date: new Date('2026-07-20T09:00:00Z'), organizerId: ada.id, category: 'TECH', maxAttendees: 500, registrations: { create: [{ userId: ada.id }, { userId: chidi.id }, { userId: daniel.id }, { userId: emeka.id }] } } });
    await prisma.event.create({ data: { title: 'Career Fair 2026', description: 'Meet recruiters from top companies. Bring your CV!', venue: 'Student Center', date: new Date('2026-08-10T10:00:00Z'), organizerId: emeka.id, category: 'CAREER', maxAttendees: 300, registrations: { create: [{ userId: emeka.id }, { userId: blessing.id }, { userId: ahmed.id }] } } });
    await prisma.event.create({ data: { title: 'Inter-Football Tournament', description: 'Annual inter-departmental football competition.', venue: 'Sports Complex', date: new Date('2026-06-25T15:00:00Z'), organizerId: chidi.id, category: 'SPORTS', maxAttendees: 1000, registrations: { create: [{ userId: chidi.id }, { userId: ahmed.id }] } } });
    await prisma.event.create({ data: { title: 'Cultural Night', description: 'Celebrate diverse cultures with music, dance, and food.', venue: 'Open Air Theatre', date: new Date('2026-07-05T18:00:00Z'), organizerId: ahmed.id, category: 'CULTURAL', maxAttendees: 800, registrations: { create: [{ userId: ahmed.id }, { userId: blessing.id }, { userId: sarah.id }, { userId: grace.id }] } } });
    await prisma.event.create({ data: { title: 'Entrepreneurship Workshop', description: 'Free workshop on starting your business with zero capital.', venue: 'Business Faculty Hall', date: new Date('2026-06-28T14:00:00Z'), organizerId: emeka.id, category: 'CAREER', maxAttendees: 100, registrations: { create: [{ userId: emeka.id }, { userId: ada.id }, { userId: blessing.id }] } } });
    console.log('Created 5 events');
  } else {
    console.log(`Events already exist (${eventCount}), skipping...`);
  }

  // ==================== STORIES (skip if exists) ====================
  const storyCount = await prisma.story.count();
  if (storyCount === 0) {
    console.log('Creating stories...');
    const now = Date.now();
    await prisma.story.createMany({
      data: [
        { imageUrl: 'https://picsum.photos/seed/story1/400/700', content: 'Study session in progress!', authorId: ada.id, expiresAt: new Date(now + 24 * 60 * 60 * 1000) },
        { imageUrl: 'https://picsum.photos/seed/story2/400/700', content: 'Game day!', authorId: chidi.id, expiresAt: new Date(now + 24 * 60 * 60 * 1000) },
        { imageUrl: 'https://picsum.photos/seed/story3/400/700', content: 'Clinical rotation done for today', authorId: fatima.id, expiresAt: new Date(now + 24 * 60 * 60 * 1000) },
        { imageUrl: 'https://picsum.photos/seed/story4/400/700', content: 'New design concept', authorId: grace.id, expiresAt: new Date(now + 24 * 60 * 60 * 1000) },
      ],
    });
    console.log('Created 4 stories');
  } else {
    console.log(`Stories already exist (${storyCount}), skipping...`);
  }

  // ==================== NOTIFICATIONS (skip if exists) ====================
  const notifCount = await prisma.notification.count();
  if (notifCount === 0) {
    console.log('Creating notifications...');
    await prisma.notification.createMany({
      data: [
        { userId: ada.id, type: 'LIKE', content: 'Chidi Okafor liked your post', senderId: chidi.id },
        { userId: ada.id, type: 'COMMENT', content: 'Emeka Nwosu commented on your post', senderId: emeka.id },
        { userId: ada.id, type: 'FOLLOW', content: 'Blessing Ume started following you', senderId: blessing.id },
        { userId: chidi.id, type: 'LIKE', content: 'Ada Eze liked your post', senderId: ada.id },
        { userId: chidi.id, type: 'FOLLOW', content: 'Ahmed Bello started following you', senderId: ahmed.id },
        { userId: fatima.id, type: 'LIKE', content: 'Ada Eze liked your post', senderId: ada.id },
        { userId: fatima.id, type: 'EVENT', content: 'Tech Conference 2026 is happening soon!', senderId: ada.id },
        { userId: emeka.id, type: 'COMMENT', content: 'Ahmed Bello commented on your post', senderId: ahmed.id },
        { userId: blessing.id, type: 'MESSAGE', content: 'You have a new message from Emeka', senderId: emeka.id },
        { userId: grace.id, type: 'LIKE', content: 'Ada Eze liked your post', senderId: ada.id },
      ],
    });
    console.log('Created 10 notifications');
  } else {
    console.log(`Notifications already exist (${notifCount}), skipping...`);
  }

  // ==================== CONVERSATIONS (skip if exists) ====================
  const convCount = await prisma.conversation.count();
  if (convCount === 0) {
    console.log('Creating conversations and messages...');
    const conversation1 = await prisma.conversation.create({ data: { isGroup: false, members: { create: [{ userId: ada.id }, { userId: chidi.id }] } } });
    const conversation2 = await prisma.conversation.create({ data: { isGroup: false, members: { create: [{ userId: fatima.id }, { userId: sarah.id }] } } });
    const conversation3 = await prisma.conversation.create({ data: { isGroup: true, name: 'CS Study Group', members: { create: [{ userId: ada.id }, { userId: chidi.id }, { userId: daniel.id }] } } });
    await prisma.message.createMany({
      data: [
        { conversationId: conversation1.id, senderId: ada.id, content: 'Hey Chidi! Did you finish the assignment?' },
        { conversationId: conversation1.id, senderId: chidi.id, content: 'Almost done! Just struggling with question 3.' },
        { conversationId: conversation1.id, senderId: ada.id, content: 'I can help. Let\'s meet at the library at 3pm?' },
        { conversationId: conversation1.id, senderId: chidi.id, content: 'Sounds good! See you there' },
        { conversationId: conversation2.id, senderId: fatima.id, content: 'Hey Sarah! Do you have the pharmacology notes from last week?' },
        { conversationId: conversation2.id, senderId: sarah.id, content: 'Yes! I\'ll send them now.' },
        { conversationId: conversation2.id, senderId: sarah.id, content: 'Here you go' },
        { conversationId: conversation3.id, senderId: ada.id, content: 'Welcome to the CS Study Group!' },
        { conversationId: conversation3.id, senderId: daniel.id, content: 'Excited to be here! When\'s our first session?' },
        { conversationId: conversation3.id, senderId: chidi.id, content: 'How about tomorrow at 2pm in the CS lab?' },
      ],
    });
    console.log('Created conversations and messages');
  } else {
    console.log(`Conversations already exist (${convCount}), skipping...`);
  }

  console.log('\nSeeding complete (safe mode)! No existing data was deleted.');
  console.log('\n--- Login credentials ---');
  console.log('Admin:    admin@campus.edu    / Password123');
  console.log('Ada:      ada@campus.edu      / Password123');
  console.log('Chidi:    chidi@campus.edu    / Password123');
  console.log('Fatima:   fatima@campus.edu   / Password123');
  console.log('Emeka:    emeka@campus.edu    / Password123');
  console.log('Blessing: blessing@campus.edu / Password123');
  console.log('Ahmed:    ahmed@campus.edu    / Password123');
  console.log('Grace:    grace@campus.edu    / Password123');
  console.log('Daniel:   daniel@campus.edu   / Password123');
  console.log('Sarah:    sarah@campus.edu    / Password123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
