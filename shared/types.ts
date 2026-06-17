export type UserRole = 'user' | 'admin';

export type ItemType = 'exchange' | 'gift';

export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export type ItemStatus = 'active' | 'exchanged' | 'gifted' | 'removed';

export type ExchangeStatus = 'pending' | 'confirmed' | 'rejected' | 'negotiating' | 'completed' | 'cancelled' | 'no_show';

export type GiftRequestStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type MessageType = 'system' | 'exchange' | 'gift' | 'review';

export type ComplaintStatus = 'pending' | 'handled' | 'rejected';

export interface User {
  id: number;
  username: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  creditScore: number;
  noShowCount: number;
  isFrozen: boolean;
  frozenUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: number;
  ownerId: number;
  owner?: User;
  title: string;
  description: string;
  type: ItemType;
  category: string;
  condition: ItemCondition;
  images: string[];
  expectedCategory?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  status: ItemStatus;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Exchange {
  id: number;
  itemId: number;
  item?: Item;
  requesterId: number;
  requester?: User;
  ownerId: number;
  owner?: User;
  status: ExchangeStatus;
  message?: string;
  offeredItemIds?: number[];
  meetTime?: string;
  meetLocation?: string;
  requesterCompleted?: boolean;
  ownerCompleted?: boolean;
  requesterRating?: number;
  requesterComment?: string;
  ownerRating?: number;
  ownerComment?: string;
  createdAt: string;
  confirmedAt?: string;
  completedAt?: string;
}

export interface GiftRequest {
  id: number;
  itemId: number;
  item?: Item;
  requesterId: number;
  requester?: User;
  status: GiftRequestStatus;
  pickupCode?: string;
  message?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface Message {
  id: number;
  userId: number;
  type: MessageType;
  title: string;
  content?: string;
  relatedId?: number;
  isRead: boolean;
  createdAt: string;
}

export interface Favorite {
  id: number;
  userId: number;
  itemId: number;
  item?: Item;
  createdAt: string;
}

export interface Complaint {
  id: number;
  reporterId: number;
  reporter?: User;
  reportedUserId: number;
  reportedUser?: User;
  itemId?: number;
  item?: Item;
  type: string;
  description: string;
  status: ComplaintStatus;
  handleResult?: string;
  createdAt: string;
  handledAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  id: number;
  username: string;
  token: string;
  role: UserRole;
  avatar?: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ItemQueryParams {
  page?: number;
  pageSize?: number;
  category?: string;
  type?: ItemType;
  sort?: 'latest' | 'popular' | 'distance';
  keyword?: string;
  condition?: ItemCondition;
}

export interface CreateItemRequest {
  title: string;
  description: string;
  type: ItemType;
  category: string;
  condition: ItemCondition;
  images: string[];
  expectedCategory?: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateExchangeRequest {
  itemId: number;
  message?: string;
  offeredItemIds?: number[];
}

export interface CreateGiftRequest {
  itemId: number;
  message?: string;
}

export interface ReviewRequest {
  rating: number;
  comment?: string;
}

export interface NegotiateRequest {
  meetTime: string;
  meetLocation: string;
}

export interface AdminStats {
  userCount: number;
  itemCount: number;
  exchangeCount: number;
  complaintCount: number;
}
