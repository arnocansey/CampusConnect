export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  studentId?: string;
  phoneNumber?: string;
  profilePicture?: string;
  coverPhoto?: string;
  coverGradient?: string;
  bio?: string;
  department?: string;
  program?: string;
  level?: number;
  skills: string[];
  interests: string[];
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  role: 'STUDENT' | 'MODERATOR' | 'ADMIN';
  isVerified: boolean;
  isPrivate?: boolean;
  hasStore?: boolean;
  isPremiumSeller?: boolean;
  createdAt: string;
  _count?: {
    posts: number;
    followers: number;
    following: number;
  };
}

export interface PollOption {
  id: string;
  text: string;
  _count: { votes: number };
}

export interface Poll {
  id: string;
  postId: string;
  options: PollOption[];
  userVote?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface Post {
  id: string;
  content?: string;
  images: string[];
  videoUrl?: string;
  location?: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'POLL' | 'MARKETPLACE';
  tags: string[];
  author: Pick<User, 'id' | 'username' | 'fullName' | 'profilePicture' | 'isVerified'>;
  poll?: Poll | null;
  _count: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
  isSaved?: boolean;
  isReposted?: boolean;
  shareCount?: number;
  viewCount?: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  images: string[];
  author: Pick<User, 'id' | 'username' | 'fullName' | 'profilePicture' | 'isVerified'>;
  _count: {
    likes: number;
    replies: number;
  };
  replies?: Comment[];
  isLiked?: boolean;
  createdAt: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  currency: string;
  category: string;
  condition: string;
  seller: Pick<User, 'id' | 'username' | 'fullName' | 'profilePicture'>;
  isAvailable: boolean;
  isSold: boolean;
  location?: string;
  averageRating: number;
  _count: {
    reviews: number;
  };
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  course: string;
  department: string;
  level: number;
  semester?: string;
  tags: string[];
  uploader: Pick<User, 'id' | 'username' | 'fullName' | 'profilePicture'>;
  averageRating: number;
  isBookmarked?: boolean;
  _count: {
    downloads: number;
    ratings: number;
    comments: number;
  };
  createdAt: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  course?: string;
  department?: string;
  level?: number;
  isPublic: boolean;
  creator: Pick<User, 'id' | 'username' | 'fullName' | 'profilePicture'>;
  members?: GroupMember[];
  _count: {
    members: number;
  };
  isMember?: boolean;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  user: Pick<User, 'id' | 'username' | 'fullName' | 'profilePicture'>;
  role: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  joinedAt: string;
}

export interface Hostel {
  id: string;
  name: string;
  description: string;
  images: string[];
  location: string;
  latitude?: number;
  longitude?: number;
  pricePerMonth: number;
  currency: string;
  roomType: string;
  facilities: string[];
  contactPhone?: string;
  contactEmail?: string;
  averageRating: number;
  _count: {
    reviews: number;
  };
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  salary?: string;
  jobType: string;
  location?: string;
  isRemote: boolean;
  deadline?: string;
  applicationUrl?: string;
  contactEmail?: string;
  hasApplied?: boolean;
  _count: {
    applications: number;
  };
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  venue: string;
  date: string;
  endTime?: string;
  category: string;
  maxAttendees?: number;
  organizer: Pick<User, 'id' | 'username' | 'fullName' | 'profilePicture'>;
  isRegistered?: boolean;
  ticketCode?: string;
  _count: {
    registrations: number;
  };
  createdAt: string;
}

export interface Conversation {
  id: string;
  name?: string;
  avatar?: string;
  isGroup: boolean;
  memberIds?: string[];
  lastMessage?: {
    content?: string;
    sender: string;
    createdAt: string;
  };
  unreadCount: number;
}

export interface Message {
  id: string;
  content?: string;
  imageUrl?: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'SYSTEM';
  sender: Pick<User, 'id' | 'username' | 'fullName' | 'profilePicture'>;
  readBy?: string[];
  reactions?: {
    id: string;
    emoji: string;
    userId: string;
    user: {
      id: string;
      username: string;
      fullName: string;
    };
  }[];
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  content: string;
  link?: string;
  isRead: boolean;
  senderId?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
