import type {
  User,
  Item,
  Exchange,
  GiftRequest,
  Message,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  CreateItemRequest,
  CreateExchangeRequest,
  CreateGiftRequest,
  ReviewRequest,
  NegotiateRequest,
  PaginatedResponse,
  ItemQueryParams,
  AdminStats,
  Complaint,
} from '../../shared/types';

const API_BASE = '/api';

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data as T;
};

export const authAPI = {
  login: (data: LoginRequest) => request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  register: (data: RegisterRequest) => request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMe: () => request<User>('/auth/me'),
};

export const itemsAPI = {
  getList: (params?: ItemQueryParams) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    return request<PaginatedResponse<Item>>(`/items?${query.toString()}`);
  },
  getCategories: () => request<{ id: string; name: string; icon: string }[]>('/items/categories'),
  getDetail: (id: number) => request<Item>(`/items/${id}`),
  create: (data: CreateItemRequest) => request<Item>('/items', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<CreateItemRequest>) => request<Item>(`/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  remove: (id: number) => request<{ success: boolean }>(`/items/${id}`, {
    method: 'DELETE',
  }),
  toggleFavorite: (id: number) => request<{ success: boolean; isFavorite: boolean }>(`/items/${id}/favorite`, {
    method: 'POST',
  }),
  checkFavorite: (id: number) => request<{ isFavorite: boolean }>(`/items/${id}/favorite`),
};

export const exchangesAPI = {
  getList: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request<Exchange[]>(`/exchanges${query}`);
  },
  create: (data: CreateExchangeRequest) => request<Exchange>('/exchanges', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  confirm: (id: number) => request<Exchange>(`/exchanges/${id}/confirm`, {
    method: 'POST',
  }),
  reject: (id: number) => request<Exchange>(`/exchanges/${id}/reject`, {
    method: 'POST',
  }),
  negotiate: (id: number, data: NegotiateRequest) => request<Exchange>(`/exchanges/${id}/negotiate`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  complete: (id: number) => request<Exchange>(`/exchanges/${id}/complete`, {
    method: 'POST',
  }),
  review: (id: number, data: ReviewRequest) => request<Exchange>(`/exchanges/${id}/review`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  reportNoShow: (id: number) => request<{ success: boolean }>(`/exchanges/${id}/no-show`, {
    method: 'POST',
  }),
};

export const giftsAPI = {
  getRequests: (itemId?: number) => {
    const query = itemId ? `?itemId=${itemId}` : '';
    return request<GiftRequest[]>(`/gifts/requests${query}`);
  },
  getMyRequests: () => request<GiftRequest[]>('/gifts/requests/my'),
  createRequest: (data: CreateGiftRequest) => request<GiftRequest>('/gifts/requests', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  confirmRequest: (id: number) => request<{ pickupCode: string; giftRequest: GiftRequest }>(`/gifts/requests/${id}/confirm`, {
    method: 'POST',
  }),
  cancelRequest: (id: number) => request<{ success: boolean }>(`/gifts/requests/${id}/cancel`, {
    method: 'POST',
  }),
  verify: (itemId: number, pickupCode: string) => request<{ success: boolean; giftRequest?: GiftRequest }>('/gifts/verify', {
    method: 'POST',
    body: JSON.stringify({ itemId, pickupCode }),
  }),
};

export const usersAPI = {
  getProfile: (id: number) => request<User & { itemCount: number; exchangeCount: number }>(`/users/${id}`),
  getUserItems: (id: number, status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request<Item[]>(`/users/${id}/items${query}`);
  },
  getCredit: (id: number) => request<{ creditScore: number; noShowCount: number; isFrozen: boolean; frozenUntil?: string }>(`/users/${id}/credit`),
  getFavorites: () => request<Item[]>('/users/favorites'),
  getUserReviews: (id: number) => request<{ list: any[]; total: number; avgRating: number }>(`/users/${id}/reviews`),
};

export const messagesAPI = {
  getList: (type?: string) => {
    const query = type ? `?type=${type}` : '';
    return request<Message[]>(`/messages${query}`);
  },
  getUnreadCount: () => request<{ count: number }>('/messages/unread-count'),
  markRead: (id: number) => request<{ success: boolean }>(`/messages/${id}/read`, {
    method: 'POST',
  }),
  markAllRead: () => request<{ success: boolean }>('/messages/read-all', {
    method: 'POST',
  }),
};

export const adminAPI = {
  getStats: () => request<AdminStats>('/admin/stats'),
  getItems: (page = 1, pageSize = 20, keyword?: string) => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (keyword) query.append('keyword', keyword);
    return request<PaginatedResponse<Item>>(`/admin/items?${query.toString()}`);
  },
  removeItem: (id: number, reason: string) => request<{ success: boolean }>(`/admin/items/${id}/remove`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  getUsers: (page = 1, pageSize = 20, keyword?: string) => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (keyword) query.append('keyword', keyword);
    return request<PaginatedResponse<User>>(`/admin/users?${query.toString()}`);
  },
  freezeUser: (id: number, days: number, reason: string) => request<{ success: boolean; isFrozen: boolean }>(`/admin/users/${id}/freeze`, {
    method: 'POST',
    body: JSON.stringify({ days, reason }),
  }),
  getComplaints: (page = 1, pageSize = 20, status?: string, type?: string, keyword?: string) => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) query.append('status', status);
    if (type) query.append('type', type);
    if (keyword) query.append('keyword', keyword);
    return request<PaginatedResponse<Complaint & { reporter?: User; reportedUser?: User; item?: Item; relatedExchange?: any; relatedGiftRequest?: any }>>(`/admin/complaints?${query.toString()}`);
  },
  handleComplaint: (id: number, result: string) => request<Complaint>(`/admin/complaints/${id}/handle`, {
    method: 'POST',
    body: JSON.stringify({ result }),
  }),
  createComplaint: (itemId: number, data: { type: string; description: string }) =>
    request<Complaint>(`/items/${itemId}/complaint`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
