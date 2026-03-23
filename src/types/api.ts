export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  bio?: string;
  city?: string;
  website?: string;
  pinned_post_id?: string | null;
  followers_count?: number;
  following_count?: number;
  avatar?: string;
  banner?: string;
  joinDate?: string;
  verified: boolean;
  verificationExpiry?: string;
}

export interface VerificationRequest {
  id: number;
  userId: string;
  reason: string;
  tiktokVideoUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewerName?: string;
  reviewNotes?: string;
}

export interface VerificationStatus {
  status?: string;
  reason?: string;
  tiktokVideoUrl?: string;
  createdAt?: string;
  reviewedAt?: string;
  reviewerName?: string;
}

export interface Post {
  id: string;
  userId: string;
  text?: string;
  imageUrl?: string;
  imageUrls?: string[];
  timestamp: string;
  replies: number;
  reposts: number;
  resonance: number;
  name?: string;
  username?: string;
  avatar?: string;
  verified?: boolean;
}

export interface Comment {
  id: number;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
  name: string;
  username: string;
  avatar?: string;
  verified: boolean;
}

