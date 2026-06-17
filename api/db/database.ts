import bcrypt from 'bcryptjs';
import type {
  User,
  Item,
  Exchange,
  GiftRequest,
  Message,
  Favorite,
  Complaint,
  TimelineEvent,
  Review,
  CreditLog,
  ItemType,
  ItemCondition,
} from '../../shared/types';

const hashPassword = (password: string) => bcrypt.hashSync(password, 10);

const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

const itemImages = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop',
];

export interface Database {
  users: User[];
  items: Item[];
  exchanges: Exchange[];
  giftRequests: GiftRequest[];
  messages: Message[];
  favorites: Favorite[];
  complaints: Complaint[];
  timelineEvents: TimelineEvent[];
  reviews: Review[];
  creditLogs: CreditLog[];
  nextUserId: number;
  nextItemId: number;
  nextExchangeId: number;
  nextGiftRequestId: number;
  nextMessageId: number;
  nextFavoriteId: number;
  nextComplaintId: number;
  nextTimelineEventId: number;
  nextReviewId: number;
  nextCreditLogId: number;
}

const now = new Date().toISOString();

const users: User[] = [
  {
    id: 1,
    username: 'admin',
    phone: '13800138000',
    avatar: avatarUrl('admin'),
    role: 'admin',
    creditScore: 100,
    noShowCount: 0,
    isFrozen: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    username: '小明',
    phone: '13800138001',
    avatar: avatarUrl('xiaoming'),
    role: 'user',
    creditScore: 95,
    noShowCount: 0,
    isFrozen: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    username: '李阿姨',
    phone: '13800138002',
    avatar: avatarUrl('liayi'),
    role: 'user',
    creditScore: 98,
    noShowCount: 0,
    isFrozen: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 4,
    username: '王叔叔',
    phone: '13800138003',
    avatar: avatarUrl('wanguncle'),
    role: 'user',
    creditScore: 88,
    noShowCount: 1,
    isFrozen: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 5,
    username: '张小花',
    phone: '13800138004',
    avatar: avatarUrl('zhangxiaohua'),
    role: 'user',
    creditScore: 92,
    noShowCount: 0,
    isFrozen: false,
    createdAt: now,
    updatedAt: now,
  },
];

const categories = [
  '图书文具',
  '数码产品',
  '家居用品',
  '服装鞋帽',
  '母婴用品',
  '玩具游戏',
  '运动户外',
  '家用电器',
];

const conditions: ItemCondition[] = ['new', 'like_new', 'good', 'fair', 'poor'];

const itemData = [
  { title: '《三体》全集三部曲', category: '图书文具', type: 'exchange' as ItemType, condition: 'good' as ItemCondition, desc: '刘慈欣科幻经典，读过一遍保存良好，想换其他科幻小说或历史类书籍。', expected: '科幻小说', owner: 2 },
  { title: 'iPhone 12 手机壳', category: '数码产品', type: 'gift' as ItemType, condition: 'like_new' as ItemCondition, desc: '买错型号了，全新未使用，免费赠送有需要的邻居。', owner: 3 },
  { title: '小米空气净化器2', category: '家用电器', type: 'exchange' as ItemType, condition: 'good' as ItemCondition, desc: '使用两年，功能正常，滤芯刚换过。想换个加湿器或者电饭煲。', expected: '生活小家电', owner: 4 },
  { title: '儿童绘本30本', category: '母婴用品', type: 'exchange' as ItemType, condition: 'good' as ItemCondition, desc: '都是正版绘本，孩子长大了看不了了，想换其他年龄段的童书或者益智玩具。', expected: '益智玩具', owner: 5 },
  { title: '乐高城市系列积木', category: '玩具游戏', type: 'exchange' as ItemType, condition: 'like_new' as ItemCondition, desc: '正品乐高，零件齐全，有说明书。想换其他乐高系列或者拼图。', expected: '乐高/拼图', owner: 2 },
  { title: '运动瑜伽垫', category: '运动户外', type: 'gift' as ItemType, condition: 'good' as ItemCondition, desc: 'TPE材质，防滑耐用，搬家带不走了，免费送。', owner: 3 },
  { title: '索尼WH-1000XM3耳机', category: '数码产品', type: 'exchange' as ItemType, condition: 'good' as ItemCondition, desc: '顶级降噪耳机，音质出色，使用爱惜。想换个平板或者相机镜头。', expected: '平板/相机', owner: 4 },
  { title: '九阳豆浆机', category: '家用电器', type: 'gift' as ItemType, condition: 'fair' as ItemCondition, desc: '老款豆浆机，功能完好，就是外观有些旧了，送给有需要的人。', owner: 5 },
  { title: '优衣库羽绒服M码', category: '服装鞋帽', type: 'exchange' as ItemType, condition: 'good' as ItemCondition, desc: '黑色轻薄羽绒服，穿了一季，保暖性好。想换其他款式外套或者L码的。', expected: '外套', owner: 2 },
  { title: '得力文件柜', category: '家居用品', type: 'gift' as ItemType, condition: 'fair' as ItemCondition, desc: '四层文件柜，收纳神器，办公室搬家闲置，免费送自提。', owner: 3 },
  { title: 'Kindle Paperwhite', category: '数码产品', type: 'exchange' as ItemType, condition: 'like_new' as ItemCondition, desc: '电子书阅读器，护眼墨水屏，95新。想换个AirPods或者其他数码配件。', expected: '蓝牙耳机', owner: 4 },
  { title: '婴儿推车', category: '母婴用品', type: 'gift' as ItemType, condition: 'good' as ItemCondition, desc: '好孩子品牌，可坐可躺，折叠方便，孩子大了用不上了，赠送。', owner: 5 },
];

const locations = [
  '阳光花园小区',
  '幸福里社区',
  '金色家园',
  '翠湖天地',
  '绿城花园',
  '万科城',
];

const items: Item[] = itemData.map((item, index) => ({
  id: index + 1,
  ownerId: item.owner,
  title: item.title,
  description: item.desc,
  type: item.type,
  category: item.category,
  condition: item.condition,
  images: [itemImages[index % itemImages.length]],
  expectedCategory: item.expected,
  location: locations[index % locations.length],
  latitude: 39.9 + Math.random() * 0.1,
  longitude: 116.3 + Math.random() * 0.1,
  status: 'active',
  viewCount: Math.floor(Math.random() * 100) + 10,
  createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: now,
}));

const exchanges: Exchange[] = [
  {
    id: 1,
    itemId: 1,
    requesterId: 3,
    ownerId: 2,
    status: 'completed',
    message: '我有《基地》系列想换，可以吗？',
    meetTime: '2024-01-15T14:00:00Z',
    meetLocation: '小区东门便利店',
    requesterRating: 5,
    requesterComment: '书保存得很好，邻居人很nice！',
    ownerRating: 5,
    ownerComment: '交换顺利，书也很新。',
    createdAt: '2024-01-10T10:00:00Z',
    confirmedAt: '2024-01-10T12:00:00Z',
    completedAt: '2024-01-15T15:00:00Z',
  },
  {
    id: 2,
    itemId: 7,
    requesterId: 2,
    ownerId: 4,
    status: 'confirmed',
    message: '我有iPad mini想换，方便聊聊吗？',
    createdAt: '2024-01-12T09:00:00Z',
    confirmedAt: '2024-01-12T11:00:00Z',
  },
];

const giftRequests: GiftRequest[] = [
  {
    id: 1,
    itemId: 2,
    requesterId: 4,
    status: 'completed',
    pickupCode: 'GIFT-8X2K',
    message: '我正好需要，谢谢阿姨！',
    createdAt: '2024-01-11T08:00:00Z',
    confirmedAt: '2024-01-11T09:00:00Z',
  },
];

const messages: Message[] = [
  {
    id: 1,
    userId: 2,
    type: 'exchange',
    title: '交换申请已确认',
    content: '李阿姨确认了您的《三体》交换申请，请及时联系协商见面时间。',
    relatedId: 1,
    isRead: true,
    createdAt: '2024-01-10T12:00:00Z',
  },
  {
    id: 2,
    userId: 4,
    type: 'gift',
    title: '赠送领取码已生成',
    content: '恭喜您获得手机壳，领取码：GIFT-8X2K，请凭码到指定地点领取。',
    relatedId: 1,
    isRead: false,
    createdAt: '2024-01-11T09:00:00Z',
  },
  {
    id: 3,
    userId: 2,
    type: 'exchange',
    title: '收到新的交换申请',
    content: '王叔叔申请交换您的索尼耳机，请尽快处理。',
    relatedId: 2,
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const favorites: Favorite[] = [
  { id: 1, userId: 2, itemId: 7, createdAt: '2024-01-10T08:00:00Z' },
  { id: 2, userId: 2, itemId: 3, createdAt: '2024-01-11T08:00:00Z' },
  { id: 3, userId: 3, itemId: 1, createdAt: '2024-01-09T08:00:00Z' },
];

const complaints: Complaint[] = [
  {
    id: 1,
    reporterId: 2,
    reportedUserId: 4,
    itemId: 7,
    type: '放鸽子',
    description: '约好了交换时间，对方临时说不来了，也不提前说。',
    status: 'pending',
    createdAt: '2024-01-13T10:00:00Z',
  },
];

const timelineEvents: TimelineEvent[] = [];
const reviews: Review[] = [];

export const db: Database = {
  users: users.map(u => ({ ...u, password: undefined } as User & { password?: string })),
  items,
  exchanges,
  giftRequests,
  messages,
  favorites,
  complaints,
  timelineEvents,
  reviews,
  nextUserId: users.length + 1,
  nextItemId: items.length + 1,
  nextExchangeId: exchanges.length + 1,
  nextGiftRequestId: giftRequests.length + 1,
  nextMessageId: messages.length + 1,
  nextFavoriteId: favorites.length + 1,
  nextComplaintId: complaints.length + 1,
  nextTimelineEventId: 1,
  nextReviewId: 1,
};

export const passwordMap: Record<number, string> = {
  1: hashPassword('admin123'),
  2: hashPassword('123456'),
  3: hashPassword('123456'),
  4: hashPassword('123456'),
  5: hashPassword('123456'),
};

export const userPasswords = passwordMap;
