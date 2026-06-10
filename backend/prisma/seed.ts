import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

const PASSWORD = 'Password123';

async function main() {
  console.log('Seeding database...');

  const passwordHash = await hashPassword(PASSWORD);

  console.log('Clearing existing database records...');
  await prisma.hostelReview.deleteMany({});
  await prisma.hostel.deleteMany({});
  await prisma.noteRating.deleteMany({});
  await prisma.noteBookmark.deleteMany({});
  await prisma.noteDownload.deleteMany({});
  await prisma.noteComment.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.jobApplication.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.groupMessage.deleteMany({});
  await prisma.groupFile.deleteMany({});
  await prisma.groupEvent.deleteMany({});
  await prisma.groupAnnouncement.deleteMany({});
  await prisma.studyGroup.deleteMany({});
  await prisma.savedPost.deleteMany({});
  await prisma.commentLike.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.storyView.deleteMany({});
  await prisma.story.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.messageRead.deleteMany({});
  await prisma.messageReaction.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversationMember.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.adminAction.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.user.deleteMany({});

  // ==================== USERS ====================
  console.log('Creating users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@campus.edu',
        username: 'admin',
        fullName: 'Admin User',
        passwordHash,
        isVerified: true,
        role: 'ADMIN',
        bio: 'Platform administrator',
        department: 'Computer Science',
        level: 400,
        skills: ['Management', 'Leadership'],
        interests: ['Technology', 'Education'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'ada@campus.edu',
        username: 'ada_eze',
        fullName: 'Ada Eze',
        passwordHash,
        isVerified: true,
        bio: 'Computer Science student who loves building things 🚀',
        department: 'Computer Science',
        level: 300,
        skills: ['JavaScript', 'Python', 'React', 'Node.js'],
        interests: ['AI', 'Web Dev', 'Music'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'chidi@campus.edu',
        username: 'chidi_okafor',
        fullName: 'Chidi Okafor',
        passwordHash,
        isVerified: true,
        bio: 'Electrical Engineering student | Football enthusiast ⚽',
        department: 'Electrical Engineering',
        level: 200,
        skills: ['Circuit Design', 'MATLAB', 'Arduino'],
        interests: ['Football', 'Robotics', 'Gaming'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'fatima@campus.edu',
        username: 'fatima_ali',
        fullName: 'Fatima Ali',
        passwordHash,
        isVerified: true,
        bio: 'Medical student | Future surgeon 🏥',
        department: 'Medicine',
        level: 400,
        skills: ['Anatomy', 'Research', 'Public Speaking'],
        interests: ['Healthcare', 'Volunteering', 'Reading'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'emeka@campus.edu',
        username: 'emeka_nwosu',
        fullName: 'Emeka Nwosu',
        passwordHash,
        isVerified: true,
        bio: 'Business Administration | Campus entrepreneur 💼',
        department: 'Business Administration',
        level: 300,
        skills: ['Marketing', 'Finance', 'Public Relations'],
        interests: ['Entrepreneurship', 'Music', 'Travel'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'blessing@campus.edu',
        username: 'blessing_ume',
        fullName: 'Blessing Ume',
        passwordHash,
        isVerified: true,
        bio: 'Law student | Aspiring human rights lawyer ⚖️',
        department: 'Law',
        level: 200,
        skills: ['Legal Research', 'Debate', 'Writing'],
        interests: ['Human Rights', 'Drama', 'Cooking'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'ahmed@campus.edu',
        username: 'ahmed_bello',
        fullName: 'Ahmed Bello',
        passwordHash,
        isVerified: true,
        bio: 'Mass Communication | Campus radio host 🎙️',
        department: 'Mass Communication',
        level: 300,
        skills: ['Broadcasting', 'Video Editing', 'Photography'],
        interests: ['Journalism', 'Photography', 'Football'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'grace@campus.edu',
        username: 'grace_okediji',
        fullName: 'Grace Okediji',
        passwordHash,
        isVerified: true,
        bio: 'Architecture student | Design is my passion 🏛️',
        department: 'Architecture',
        level: 400,
        skills: ['AutoCAD', 'Revit', 'SketchUp', 'Photoshop'],
        interests: ['Sustainable Design', 'Art', 'Travel'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'daniel@campus.edu',
        username: 'daniel_abubakar',
        fullName: 'Daniel Abubakar',
        passwordHash,
        isVerified: true,
        bio: 'Mathematics student | Data science enthusiast 📊',
        department: 'Mathematics',
        level: 200,
        skills: ['Statistics', 'Python', 'R', 'Excel'],
        interests: ['Data Science', 'Chess', 'Cycling'],
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah@campus.edu',
        username: 'sarah_mensah',
        fullName: 'Sarah Mensah',
        passwordHash,
        isVerified: true,
        bio: 'Pharmacy student | Beauty with brains 💊',
        department: 'Pharmacy',
        level: 300,
        skills: ['Pharmacology', 'Research', 'Patient Care'],
        interests: ['Skincare', 'Fitness', 'Podcasts'],
      },
    }),
  ]);

  const [admin, ada, chidi, fatima, emeka, blessing, ahmed, grace, daniel, sarah] = users;
  console.log(`Created ${users.length} users`);

  // ==================== FOLLOWS ====================
  console.log('Creating follows...');
  const followData = [
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
  ];
  await prisma.follow.createMany({ data: followData });
  console.log(`Created ${followData.length} follows`);

  // ==================== POSTS ====================
  console.log('Creating posts...');
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        authorId: ada.id,
        content: 'Just deployed my first full-stack project! 🎉 It\'s a campus marketplace platform built with React and Node.js. Check it out and let me know what you think! #WebDev #CampusLife',
        type: 'TEXT',
        tags: ['WebDev', 'CampusLife'],
      },
    }),
    prisma.post.create({
      data: {
        authorId: chidi.id,
        content: 'Who else is ready for midterms next week? 😩 I\'ve been studying day and night. Anyone want to form a study group for Signals & Systems?',
        type: 'TEXT',
        tags: ['MidtermPrep', 'StudyGroup'],
      },
    }),
    prisma.post.create({
      data: {
        authorId: fatima.id,
        content: 'Just finished my 12-hour clinical rotation at the teaching hospital. Exhausting but worth it! Every day brings me closer to my dream of becoming a surgeon. 💪',
        type: 'TEXT',
        tags: ['MedLife', 'ClinicalRotation'],
      },
    }),
    prisma.post.create({
      data: {
        authorId: emeka.id,
        content: '📢 Exciting news! My small business just hit 1000 customers! Started this from my dorm room last year. If you have a business idea, just START. Don\'t wait for perfection.',
        type: 'TEXT',
        tags: ['Entrepreneurship', 'CampusBusiness'],
      },
    }),
    prisma.post.create({
      data: {
        authorId: blessing.id,
        content: 'Moot court competition tomorrow! 🏛️ Our team has been preparing for weeks. Wish us luck as we argue this human rights case!',
        type: 'TEXT',
        tags: ['MootCourt', 'LawSchool'],
      },
    }),
    prisma.post.create({
      data: {
        authorId: ahmed.id,
        content: '🎙️ New episode of our campus podcast is out! This week we talked about mental health awareness among students. Link in bio. #CampusRadio #MentalHealth',
        type: 'TEXT',
        tags: ['Podcast', 'MentalHealth'],
      },
    }),
    prisma.post.create({
      data: {
        authorId: grace.id,
        content: 'My thesis project on sustainable housing for tropical climates is finally coming together. Three months of research and design. Can\'t wait to present it! 🏗️',
        type: 'TEXT',
        tags: ['Architecture', 'ThesisProject'],
      },
    }),
    prisma.post.create({
      data: {
        authorId: daniel.id,
        content: 'Pro tip for math students: Don\'t just memorize formulas. Understand the derivation behind them. It makes problem-solving 10x easier. 📐',
        type: 'TEXT',
        tags: ['StudyTips', 'Mathematics'],
      },
    }),
    prisma.post.create({
      data: {
        authorId: sarah.id,
        content: 'Pharmacy school is no joke 😅 But seeing patients understand their medication regimen makes it all worthwhile. Keep pushing, future pharmacists! 💊',
        type: 'TEXT',
        tags: ['PharmacyLife', 'StudyMotivation'],
      },
    }),
    prisma.post.create({
      data: {
        authorId: ada.id,
        content: 'Looking for a roommate for next semester! I have a 2-bedroom apartment near the school gate. Rent is affordable. DM me if interested! 🏠',
        type: 'TEXT',
        tags: ['Roommate', 'Housing'],
      },
    }),
    prisma.post.create({
      data: {
        authorId: chidi.id,
        content: 'Our football team won the inter-departmental tournament! ⚽🏆 3-1 in the final. What a game!',
        type: 'TEXT',
        tags: ['Football', 'Champions'],
      },
    }),
    prisma.post.create({
      data: {
        authorId: emeka.id,
        content: 'Hosting a free entrepreneurship workshop this Saturday. Learn how to start your business with zero capital. Tag someone who needs to see this! 🚀',
        type: 'TEXT',
        tags: ['Workshop', 'FreeEvent'],
      },
    }),
  ]);
  console.log(`Created ${posts.length} posts`);

  // ==================== COMMENTS ====================
  console.log('Creating comments...');
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        authorId: chidi.id,
        postId: posts[0].id,
        content: 'This is amazing! Would love to contribute. Can you share the repo link?',
      },
    }),
    prisma.comment.create({
      data: {
        authorId: emeka.id,
        postId: posts[0].id,
        content: 'Congrats Ada! The UI looks really clean. Great work! 🔥',
      },
    }),
    prisma.comment.create({
      data: {
        authorId: ada.id,
        postId: posts[1].id,
        content: 'Count me in! I also need help with Signals & Systems. Let\'s meet at the library tomorrow?',
      },
    }),
    prisma.comment.create({
      data: {
        authorId: daniel.id,
        postId: posts[1].id,
        content: 'I can help with the math parts. Let me know when you\'re free!',
      },
    }),
    prisma.comment.create({
      data: {
        authorId: ada.id,
        postId: posts[2].id,
        content: 'You\'re going to be an incredible surgeon Fatima! Keep going 💪',
      },
    }),
    prisma.comment.create({
      data: {
        authorId: emeka.id,
        postId: posts[3].id,
        content: 'This is so inspiring! What\'s the name of your business?',
      },
    }),
    prisma.comment.create({
      data: {
        authorId: blessing.id,
        postId: posts[5].id,
        content: 'Great topic! Mental health matters. Thanks for bringing awareness to this.',
      },
    }),
    prisma.comment.create({
      data: {
        authorId: sarah.id,
        postId: posts[7].id,
        content: 'This is solid advice! I\'m sharing this with my study group.',
      },
    }),
    prisma.comment.create({
      data: {
        authorId: grace.id,
        postId: posts[9].id,
        content: 'Is it close to campus? I\'m interested!',
      },
    }),
    prisma.comment.create({
      data: {
        authorId: ahmed.id,
        postId: posts[11].id,
        content: 'I\'ll cover this for the campus news! Great initiative Emeka.',
      },
    }),
  ]);
  console.log(`Created ${comments.length} comments`);

  // ==================== LIKES ====================
  console.log('Creating likes...');
  const likeData: { userId: string; postId: string }[] = [];
  for (const post of posts) {
    const numLikes = Math.floor(Math.random() * 6) + 2;
    const shuffled = [...users].sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(numLikes, shuffled.length); i++) {
      likeData.push({ userId: shuffled[i].id, postId: post.id });
    }
  }
  const uniqueLikes = likeData.filter(
    (like, index, self) =>
      index === self.findIndex((l) => l.userId === like.userId && l.postId === like.postId)
  );
  await prisma.like.createMany({ data: uniqueLikes });
  console.log(`Created ${uniqueLikes.length} likes`);

  // ==================== MARKETPLACE ITEMS ====================
  console.log('Creating marketplace items...');
  const marketplaceItems = await Promise.all([
    prisma.marketplaceItem.create({
      data: {
        title: 'MacBook Pro 2024',
        description: 'Like new MacBook Pro with M3 chip, 16GB RAM, 512GB SSD. Comes with original charger and box. Selling because I switched to a desktop setup.',
        images: [],
        price: 1200000,
        currency: 'NGN',
        category: 'ELECTRONICS',
        condition: 'LIKE_NEW',
        sellerId: ada.id,
        location: 'Main Campus',
      },
    }),
    prisma.marketplaceItem.create({
      data: {
        title: 'Engineering Mathematics Textbook',
        description: 'Advanced Engineering Mathematics by Kreyszig, 10th edition. Used for one semester, in excellent condition. Some highlighting on chapters 1-5.',
        images: [],
        price: 15000,
        currency: 'NGN',
        category: 'BOOKS',
        condition: 'USED',
        sellerId: daniel.id,
        location: 'Science Block',
      },
    }),
    prisma.marketplaceItem.create({
      data: {
        title: 'iPhone 15 Pro Max',
        description: 'Brand new iPhone 15 Pro Max, 256GB, Natural Titanium. Still sealed in box. Bought as a gift but already have one.',
        images: [],
        price: 850000,
        currency: 'NGN',
        category: 'ELECTRONICS',
        condition: 'NEW',
        sellerId: emeka.id,
        location: 'Business Faculty',
      },
    }),
    prisma.marketplaceItem.create({
      data: {
        title: 'Desk Fan - 12 inch',
        description: 'Lasko 12-inch desk fan. Works perfectly, great for hot宿舍 days. Moving out and need to sell.',
        images: [],
        price: 8000,
        currency: 'NGN',
        category: 'HOSTEL_ITEMS',
        condition: 'USED',
        sellerId: blessing.id,
        location: 'Hall B',
      },
    }),
    prisma.marketplaceItem.create({
      data: {
        title: 'Nike Air Max Sneakers - Size 42',
        description: 'White Nike Air Max sneakers, size 42. Worn twice, basically new. Too small for me.',
        images: [],
        price: 35000,
        currency: 'NGN',
        category: 'CLOTHING',
        condition: 'LIKE_NEW',
        sellerId: ahmed.id,
        location: 'Main Campus',
      },
    }),
    prisma.marketplaceItem.create({
      data: {
        title: 'Scientific Calculator - Casio FX-991',
        description: 'Casio FX-991EX ClassWiz scientific calculator. Essential for engineering and math students. Works perfectly.',
        images: [],
        price: 12000,
        currency: 'NGN',
        category: 'ELECTRONICS',
        condition: 'USED',
        sellerId: chidi.id,
        location: 'Engineering Block',
      },
    }),
    prisma.marketplaceItem.create({
      data: {
        title: 'Private Tutoring - Mathematics',
        description: 'Offering one-on-one math tutoring for calculus, algebra, and statistics. Patient and experienced. N2000/hour.',
        images: [],
        price: 2000,
        currency: 'NGN',
        category: 'SERVICES',
        condition: 'NEW',
        sellerId: daniel.id,
        location: 'Online / Campus',
      },
    }),
    prisma.marketplaceItem.create({
      data: {
        title: 'HP Laptop - Core i7, 16GB RAM',
        description: 'HP Pavilion laptop, Core i7 12th gen, 16GB RAM, 512GB SSD, 15.6" FHD display. Great for programming and design work.',
        images: [],
        price: 450000,
        currency: 'NGN',
        category: 'ELECTRONICS',
        condition: 'USED',
        sellerId: grace.id,
        location: 'Architecture Block',
      },
    }),
  ]);
  console.log(`Created ${marketplaceItems.length} marketplace items`);

  // ==================== NOTES ====================
  console.log('Creating notes...');
  const notes = await Promise.all([
    prisma.note.create({
      data: {
        title: 'Data Structures Complete Notes',
        description: 'Comprehensive notes covering arrays, linked lists, trees, graphs, and hash tables with examples in C++.',
        fileUrl: '/uploads/notes/data-structures.pdf',
        fileType: 'PDF',
        course: 'CSC 201',
        department: 'Computer Science',
        level: 200,
        semester: 'First Semester',
        uploaderId: ada.id,
        tags: ['Data Structures', 'Programming', 'CSC201'],
      },
    }),
    prisma.note.create({
      data: {
        title: 'Calculus II Past Questions (2020-2024)',
        description: 'Collection of past exam questions for Calculus II with detailed solutions. Covers integration techniques, series, and sequences.',
        fileUrl: '/uploads/notes/calculus-past-questions.pdf',
        fileType: 'PDF',
        course: 'MTH 202',
        department: 'Mathematics',
        level: 200,
        semester: 'Second Semester',
        uploaderId: daniel.id,
        tags: ['Calculus', 'Past Questions', 'MTH202'],
      },
    }),
    prisma.note.create({
      data: {
        title: 'Introduction to Anatomy - Lecture Slides',
        description: 'Complete lecture slides for Introduction to Anatomy. Covers skeletal, muscular, and circulatory systems.',
        fileUrl: '/uploads/notes/anatomy-slides.ppt',
        fileType: 'PPT',
        course: 'BIO 101',
        department: 'Medicine',
        level: 100,
        semester: 'First Semester',
        uploaderId: fatima.id,
        tags: ['Anatomy', 'Biology', 'BIO101'],
      },
    }),
    prisma.note.create({
      data: {
        title: 'Business Law Study Guide',
        description: 'Comprehensive study guide for Business Law. Covers contract law, company law, and commercial transactions.',
        fileUrl: '/uploads/notes/business-law.pdf',
        fileType: 'PDF',
        course: 'BUS 301',
        department: 'Business Administration',
        level: 300,
        semester: 'First Semester',
        uploaderId: emeka.id,
        tags: ['Business Law', 'Study Guide', 'BUS301'],
      },
    }),
    prisma.note.create({
      data: {
        title: 'Signals and Systems Formula Sheet',
        description: 'Quick reference formula sheet for Signals and Systems. Includes Fourier Transform, Laplace Transform, and Z-Transform formulas.',
        fileUrl: '/uploads/notes/signals-formulas.pdf',
        fileType: 'PDF',
        course: 'ECE 301',
        department: 'Electrical Engineering',
        level: 300,
        semester: 'First Semester',
        uploaderId: chidi.id,
        tags: ['Signals', 'Systems', 'Formulas', 'ECE301'],
      },
    }),
    prisma.note.create({
      data: {
        title: 'Constitutional Law Notes',
        description: 'Detailed notes on Nigerian Constitutional Law. Covers fundamental rights, separation of powers, and federalism.',
        fileUrl: '/uploads/notes/constitutional-law.pdf',
        fileType: 'PDF',
        course: 'LAW 201',
        department: 'Law',
        level: 200,
        semester: 'Second Semester',
        uploaderId: blessing.id,
        tags: ['Constitutional Law', 'Nigerian Law', 'LAW201'],
      },
    }),
    prisma.note.create({
      data: {
        title: 'Mass Media and Society - Handout',
        description: 'Complete handout for Mass Media and Society course. Covers media theories, journalism ethics, and media in Nigeria.',
        fileUrl: '/uploads/notes/mass-media.docx',
        fileType: 'DOCX',
        course: 'COM 201',
        department: 'Mass Communication',
        level: 200,
        semester: 'First Semester',
        uploaderId: ahmed.id,
        tags: ['Mass Media', 'Communication', 'COM201'],
      },
    }),
    prisma.note.create({
      data: {
        title: 'Pharmacology Drug List',
        description: 'Complete drug list for Pharmacology I. Includes drug names, mechanisms, side effects, and interactions.',
        fileUrl: '/uploads/notes/pharmacology-drugs.pdf',
        fileType: 'PDF',
        course: 'PHA 301',
        department: 'Pharmacy',
        level: 300,
        semester: 'First Semester',
        uploaderId: sarah.id,
        tags: ['Pharmacology', 'Drugs', 'PHA301'],
      },
    }),
    prisma.note.create({
      data: {
        title: 'Architecture Design Principles',
        description: 'Notes on fundamental design principles in architecture. Covers proportion, rhythm, balance, and sustainability.',
        fileUrl: '/uploads/notes/design-principles.ppt',
        fileType: 'PPT',
        course: 'ARC 301',
        department: 'Architecture',
        level: 300,
        semester: 'First Semester',
        uploaderId: grace.id,
        tags: ['Design', 'Architecture', 'ARC301'],
      },
    }),
  ]);
  console.log(`Created ${notes.length} notes`);

  // ==================== STUDY GROUPS ====================
  console.log('Creating study groups...');
  const groups = await Promise.all([
    prisma.studyGroup.create({
      data: {
        name: 'CS Problem Solvers',
        description: 'A group for computer science students to discuss algorithms, data structures, and coding challenges.',
        course: 'CSC 201',
        department: 'Computer Science',
        level: 200,
        creatorId: ada.id,
        isPublic: true,
        members: {
          create: [
            { userId: ada.id, role: 'ADMIN' },
            { userId: daniel.id, role: 'MEMBER' },
            { userId: chidi.id, role: 'MEMBER' },
          ],
        },
      },
    }),
    prisma.studyGroup.create({
      data: {
        name: 'Med School Warriors',
        description: 'Support group for medical students. Share notes, study tips, and encouragement!',
        department: 'Medicine',
        creatorId: fatima.id,
        isPublic: true,
        members: {
          create: [
            { userId: fatima.id, role: 'ADMIN' },
            { userId: sarah.id, role: 'MEMBER' },
          ],
        },
      },
    }),
    prisma.studyGroup.create({
      data: {
        name: 'Engineering Maths Hub',
        description: 'For all engineering students struggling with mathematics. We solve problems together!',
        course: 'MTH 201',
        department: 'Engineering',
        creatorId: chidi.id,
        isPublic: true,
        members: {
          create: [
            { userId: chidi.id, role: 'ADMIN' },
            { userId: daniel.id, role: 'MODERATOR' },
            { userId: ada.id, role: 'MEMBER' },
          ],
        },
      },
    }),
    prisma.studyGroup.create({
      data: {
        name: 'Law Review Club',
        description: 'Weekly discussions on landmark cases, legal updates, and moot court preparation.',
        department: 'Law',
        creatorId: blessing.id,
        isPublic: true,
        members: {
          create: [
            { userId: blessing.id, role: 'ADMIN' },
            { userId: ahmed.id, role: 'MEMBER' },
          ],
        },
      },
    }),
  ]);
  console.log(`Created ${groups.length} study groups`);

  // ==================== HOSTELS ====================
  console.log('Creating hostels...');
  const hostels = await Promise.all([
    prisma.hostel.create({
      data: {
        name: 'Casely Hayford Hall (Casford)',
        description: 'The premier and only all-male hall of residence at the University of Cape Coast. Casford is legendary for its vibrant culture, sports dominance, and strong sense of brotherhood. Features an active JCR, a sports arena, and an on-site study room.',
        images: [],
        location: 'Northern Campus (Science)',
        pricePerMonth: 150,
        currency: 'GHS',
        roomType: 'SHARED',
        facilities: ['WiFi', 'Water', '24/7 Power', 'Study Room', 'JCR', 'Sports Courts'],
        contactPhone: '+233-332-132-456',
        contactEmail: 'casford@ucc.edu.gh',
        latitude: 5.1150,
        longitude: -1.2900,
      },
    }),
    prisma.hostel.create({
      data: {
        name: 'Kwame Nkrumah Hall',
        description: 'Named after Ghana\'s first president, this mixed-gender hall boasts modern study facilities, vibrant debates, and an active sports culture. Conveniently located near the Science Faculty.',
        images: [],
        location: 'Northern Campus',
        pricePerMonth: 160,
        currency: 'GHS',
        roomType: 'SHARED',
        facilities: ['WiFi', 'Water', '24/7 Power', 'Library', 'Shops', 'Cafeteria'],
        contactPhone: '+233-332-132-457',
        contactEmail: 'nkrumah@ucc.edu.gh',
        latitude: 5.1180,
        longitude: -1.2920,
      },
    }),
    prisma.hostel.create({
      data: {
        name: 'Valco Hall',
        description: 'Valco Hall, the Industrial Hall, offers mixed-gender accommodation with a focus on student entrepreneurship. It features a private study library, supermarket access, and is close to shuttle terminals.',
        images: [],
        location: 'Northern Campus',
        pricePerMonth: 140,
        currency: 'GHS',
        roomType: 'SHARED',
        facilities: ['WiFi', 'Water', '24/7 Power', 'Study Room', 'Supermarket', 'Laundry'],
        contactPhone: '+233-332-132-458',
        contactEmail: 'valco@ucc.edu.gh',
        latitude: 5.1170,
        longitude: -1.2880,
      },
    }),
    prisma.hostel.create({
      data: {
        name: 'Atlantic Hall (ATL)',
        description: 'Atlantic Hall (Mariners) is a premier mixed hall located on the Southern Campus with beautiful ocean views. Famous for marine-themed activities, spacious rooms, and an air-conditioned study hall.',
        images: [],
        location: 'Southern Campus (Old Site)',
        pricePerMonth: 155,
        currency: 'GHS',
        roomType: 'SHARED',
        facilities: ['WiFi', 'Water', '24/7 Power', 'Library', 'Ocean View', 'Sports Courts'],
        contactPhone: '+233-332-132-459',
        contactEmail: 'atl@ucc.edu.gh',
        latitude: 5.1050,
        longitude: -1.2800,
      },
    }),
    prisma.hostel.create({
      data: {
        name: 'Adehye Hall',
        description: 'The royal, female-only hall of the University of Cape Coast. Adehye Hall provides a secure, serene, and nurturing environment for ladies with an on-site salon, kitchenettes, and landscaped study gardens.',
        images: [],
        location: 'Southern Campus (Old Site)',
        pricePerMonth: 150,
        currency: 'GHS',
        roomType: 'SHARED',
        facilities: ['WiFi', 'Water', '24/7 Power', 'Salon', 'Gardens', 'Security'],
        contactPhone: '+233-332-132-460',
        contactEmail: 'adehye@ucc.edu.gh',
        latitude: 5.1030,
        longitude: -1.2780,
      },
    }),
    prisma.hostel.create({
      data: {
        name: 'Oguaa Hall',
        description: 'One of the oldest traditional halls at UCC, Oguaa Hall provides a mixed-gender community near the historic Old Site gate. Rich in culture with large common rooms, sports pitches, and convenience stores.',
        images: [],
        location: 'Southern Campus (Old Site)',
        pricePerMonth: 130,
        currency: 'GHS',
        roomType: 'SHARED',
        facilities: ['WiFi', 'Water', '24/7 Power', 'JCR', 'Shops', 'Sports Courts'],
        contactPhone: '+233-332-132-461',
        contactEmail: 'oguaa@ucc.edu.gh',
        latitude: 5.1020,
        longitude: -1.2820,
      },
    }),
    prisma.hostel.create({
      data: {
        name: 'SRC Hostel',
        description: 'A modern self-contained hostel owned by the UCC Student Representative Council. Located at Akotokyir, it features en-suite bathrooms, a private gym, standby generator, and dedicated shuttle service to campus.',
        images: [],
        location: 'Akotokyir',
        pricePerMonth: 45,
        currency: 'USD',
        roomType: 'SELF_CONTAINED',
        facilities: ['WiFi', 'Water', '24/7 Power', 'Gym', 'Shuttle Service', 'Security'],
        contactPhone: '+233-332-132-462',
        contactEmail: 'srchostel@ucc.edu.gh',
        latitude: 5.1220,
        longitude: -1.2980,
      },
    }),
    prisma.hostel.create({
      data: {
        name: 'Superannuation Hostel',
        description: 'A premium, university-managed hostel catering to both undergraduate and postgraduate students. Offers spacious en-suite rooms, quiet study rooms, private kitchens, and backup water reservoirs.',
        images: [],
        location: 'Akotokyir',
        pricePerMonth: 50,
        currency: 'USD',
        roomType: 'SELF_CONTAINED',
        facilities: ['WiFi', 'Water', '24/7 Power', 'AC', 'Laundry', 'Study Room'],
        contactPhone: '+233-332-132-463',
        contactEmail: 'superannuation@ucc.edu.gh',
        latitude: 5.1240,
        longitude: -1.2960,
      },
    }),
    prisma.hostel.create({
      data: {
        name: 'Ewusiwa Hostel',
        description: 'A highly popular private hostel located in Apewosika, just outside the campus perimeter. Features large self-contained rooms, secure gated entry, backup water systems, and stable high-speed Wi-Fi.',
        images: [],
        location: 'Apewosika',
        pricePerMonth: 48,
        currency: 'USD',
        roomType: 'SELF_CONTAINED',
        facilities: ['WiFi', 'Water', 'Security', 'Parking'],
        contactPhone: '+233-244-123-456',
        contactEmail: 'ewusiwahostel@gmail.com',
        latitude: 5.1200,
        longitude: -1.2850,
      },
    }),
    prisma.hostel.create({
      data: {
        name: 'The Nest Hostel',
        description: 'Serene and modern private hostel located in the Kwaprow student community. Offers quiet surroundings, en-suite bathrooms, fully fitted kitchenettes, and CCTV security.',
        images: [],
        location: 'Kwaprow',
        pricePerMonth: 46,
        currency: 'USD',
        roomType: 'SELF_CONTAINED',
        facilities: ['WiFi', 'Water', 'Security', 'CCTV', 'Kitchenette'],
        contactPhone: '+233-243-789-012',
        contactEmail: 'thenestkwaprow@gmail.com',
        latitude: 5.1260,
        longitude: -1.2890,
      },
    }),
  ]);
  console.log(`Created ${hostels.length} hostels`);

  // ==================== JOBS ====================
  console.log('Creating jobs...');
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Frontend Developer Intern',
        company: 'TechStart Nigeria',
        description: 'Join our team to build innovative web applications. You\'ll work with React, TypeScript, and modern frontend tools.',
        requirements: ['HTML/CSS', 'JavaScript basics', 'React (bonus)', 'Git basics'],
        salary: 'N80,000/month',
        jobType: 'INTERNSHIP',
        location: 'Lagos (Hybrid)',
        isRemote: true,
        deadline: new Date('2026-08-30'),
        contactEmail: 'jobs@techstart.ng',
      },
    }),
    prisma.job.create({
      data: {
        title: 'Data Entry Clerk',
        company: 'GreenField Enterprises',
        description: 'Part-time data entry position. Flexible hours, perfect for students.',
        requirements: ['Fast typing', 'Attention to detail', 'Microsoft Excel', 'Reliable internet'],
        salary: 'N30,000/month',
        jobType: 'PART_TIME',
        location: 'On Campus',
        isRemote: false,
        deadline: new Date('2026-07-15'),
        contactEmail: 'hr@greenfield.ng',
      },
    }),
    prisma.job.create({
      data: {
        title: 'Campus Brand Ambassador',
        company: 'StudyBuddy App',
        description: 'Represent StudyBuddy on campus. Promote the app, organize events, and earn commissions.',
        requirements: ['Excellent communication', 'Social media savvy', 'Leadership skills', 'Passion for education'],
        salary: 'Commission-based',
        jobType: 'PART_TIME',
        location: 'On Campus',
        isRemote: false,
        deadline: new Date('2026-09-01'),
        contactEmail: 'ambassador@studybuddy.com',
      },
    }),
    prisma.job.create({
      data: {
        title: 'Software Engineering Intern',
        company: 'FinTech Solutions',
        description: 'Summer internship in our backend team. Work with Node.js, PostgreSQL, and AWS.',
        requirements: ['Node.js', 'SQL basics', 'REST APIs', 'Problem-solving skills'],
        salary: 'N120,000/month',
        jobType: 'INTERNSHIP',
        location: 'Abuja',
        isRemote: false,
        deadline: new Date('2026-07-31'),
        contactEmail: 'internships@fintech.ng',
      },
    }),
    prisma.job.create({
      data: {
        title: 'Freelance Graphic Designer',
        company: 'CreativeHub',
        description: 'Create social media graphics, logos, and marketing materials for our clients.',
        requirements: ['Adobe Photoshop', 'Adobe Illustrator', 'Portfolio', 'Creativity'],
        salary: 'N15,000 - N50,000 per project',
        jobType: 'FREELANCE',
        location: 'Remote',
        isRemote: true,
        deadline: new Date('2026-12-31'),
        contactEmail: 'design@creativehub.ng',
      },
    }),
  ]);
  console.log(`Created ${jobs.length} jobs`);

  // ==================== EVENTS ====================
  console.log('Creating events...');
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Tech Conference 2026',
        description: 'Annual technology conference featuring industry leaders, workshops, and networking opportunities.',
        venue: 'University Auditorium',
        date: new Date('2026-07-20T09:00:00Z'),
        organizerId: ada.id,
        category: 'TECH',
        maxAttendees: 500,
        registrations: {
          create: [
            { userId: ada.id },
            { userId: chidi.id },
            { userId: daniel.id },
            { userId: emeka.id },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        title: 'Career Fair 2026',
        description: 'Meet recruiters from top companies. Bring your CV and dress professionally!',
        venue: 'Student Center',
        date: new Date('2026-08-10T10:00:00Z'),
        organizerId: emeka.id,
        category: 'CAREER',
        maxAttendees: 300,
        registrations: {
          create: [
            { userId: emeka.id },
            { userId: blessing.id },
            { userId: ahmed.id },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        title: 'Inter-Football Tournament',
        description: 'Annual inter-departmental football competition. Who will take the trophy this year?',
        venue: 'Sports Complex',
        date: new Date('2026-06-25T15:00:00Z'),
        organizerId: chidi.id,
        category: 'SPORTS',
        maxAttendees: 1000,
        registrations: {
          create: [
            { userId: chidi.id },
            { userId: ahmed.id },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        title: 'Cultural Night',
        description: 'Celebrate the diverse cultures on campus with music, dance, food, and drama performances.',
        venue: 'Open Air Theatre',
        date: new Date('2026-07-05T18:00:00Z'),
        organizerId: ahmed.id,
        category: 'CULTURAL',
        maxAttendees: 800,
        registrations: {
          create: [
            { userId: ahmed.id },
            { userId: blessing.id },
            { userId: sarah.id },
            { userId: grace.id },
          ],
        },
      },
    }),
    prisma.event.create({
      data: {
        title: 'Entrepreneurship Workshop',
        description: 'Free workshop on starting your business with zero capital. Learn from successful student entrepreneurs.',
        venue: 'Business Faculty Hall',
        date: new Date('2026-06-28T14:00:00Z'),
        organizerId: emeka.id,
        category: 'CAREER',
        maxAttendees: 100,
        registrations: {
          create: [
            { userId: emeka.id },
            { userId: ada.id },
            { userId: blessing.id },
          ],
        },
      },
    }),
  ]);
  console.log(`Created ${events.length} events`);

  // ==================== STORIES ====================
  console.log('Creating stories...');
  const stories = await Promise.all([
    prisma.story.create({
      data: {
        imageUrl: 'https://picsum.photos/seed/story1/400/700',
        content: 'Study session in progress! 📚',
        authorId: ada.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.story.create({
      data: {
        imageUrl: 'https://picsum.photos/seed/story2/400/700',
        content: 'Game day! ⚽',
        authorId: chidi.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.story.create({
      data: {
        imageUrl: 'https://picsum.photos/seed/story3/400/700',
        content: 'Clinical rotation done for today 🏥',
        authorId: fatima.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.story.create({
      data: {
        imageUrl: 'https://picsum.photos/seed/story4/400/700',
        content: 'New design concept 🎨',
        authorId: grace.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  console.log(`Created ${stories.length} stories`);

  // ==================== NOTIFICATIONS ====================
  console.log('Creating notifications...');
  const notificationData = [
    { userId: ada.id, type: 'LIKE' as const, content: 'Chidi Okafor liked your post', senderId: chidi.id },
    { userId: ada.id, type: 'COMMENT' as const, content: 'Emeka Nwosu commented on your post', senderId: emeka.id },
    { userId: ada.id, type: 'FOLLOW' as const, content: 'Blessing Ume started following you', senderId: blessing.id },
    { userId: chidi.id, type: 'LIKE' as const, content: 'Ada Eze liked your post', senderId: ada.id },
    { userId: chidi.id, type: 'FOLLOW' as const, content: 'Ahmed Bello started following you', senderId: ahmed.id },
    { userId: fatima.id, type: 'LIKE' as const, content: 'Ada Eze liked your post', senderId: ada.id },
    { userId: fatima.id, type: 'EVENT' as const, content: 'Tech Conference 2026 is happening soon!', senderId: ada.id },
    { userId: emeka.id, type: 'COMMENT' as const, content: 'Ahmed Bello commented on your post', senderId: ahmed.id },
    { userId: blessing.id, type: 'MESSAGE' as const, content: 'You have a new message from Emeka', senderId: emeka.id },
    { userId: grace.id, type: 'LIKE' as const, content: 'Ada Eze liked your post', senderId: ada.id },
  ];
  await prisma.notification.createMany({ data: notificationData });
  console.log(`Created ${notificationData.length} notifications`);

  // ==================== CONVERSATIONS & MESSAGES ====================
  console.log('Creating conversations and messages...');
  const conversation1 = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: {
        create: [
          { userId: ada.id },
          { userId: chidi.id },
        ],
      },
    },
  });

  const conversation2 = await prisma.conversation.create({
    data: {
      isGroup: false,
      members: {
        create: [
          { userId: fatima.id },
          { userId: sarah.id },
        ],
      },
    },
  });

  const conversation3 = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: 'CS Study Group',
      members: {
        create: [
          { userId: ada.id },
          { userId: chidi.id },
          { userId: daniel.id },
        ],
      },
    },
  });

  await prisma.message.createMany({
    data: [
      { conversationId: conversation1.id, senderId: ada.id, content: 'Hey Chidi! Did you finish the assignment?' },
      { conversationId: conversation1.id, senderId: chidi.id, content: 'Almost done! Just struggling with question 3.' },
      { conversationId: conversation1.id, senderId: ada.id, content: 'I can help. Let\'s meet at the library at 3pm?' },
      { conversationId: conversation1.id, senderId: chidi.id, content: 'Sounds good! See you there 👍' },
      { conversationId: conversation2.id, senderId: fatima.id, content: 'Hey Sarah! Do you have the pharmacology notes from last week?' },
      { conversationId: conversation2.id, senderId: sarah.id, content: 'Yes! I\'ll send them now.' },
      { conversationId: conversation2.id, senderId: sarah.id, content: 'Here you go 📚' },
      { conversationId: conversation3.id, senderId: ada.id, content: 'Welcome to the CS Study Group! 🎉' },
      { conversationId: conversation3.id, senderId: daniel.id, content: 'Excited to be here! When\'s our first session?' },
      { conversationId: conversation3.id, senderId: chidi.id, content: 'How about tomorrow at 2pm in the CS lab?' },
    ],
  });

  console.log('Created conversations and messages');
  console.log('\nSeeding complete! ✅');
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
