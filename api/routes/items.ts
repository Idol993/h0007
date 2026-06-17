import { Router } from 'express';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { calculateDistance } from '../utils';
import type {
  Item,
  ItemQueryParams,
  CreateItemRequest,
  PaginatedResponse,
  Favorite,
} from '../../../shared/types';

const router = Router();

router.get('/', (req, res) => {
  const {
    page = 1,
    pageSize = 20,
    category,
    type,
    sort = 'latest',
    keyword,
    condition,
  } = req.query as unknown as ItemQueryParams;

  let items = [...db.items.filter(item => item.status === 'active')];

  if (category) {
    items = items.filter(item => item.category === category);
  }
  if (type) {
    items = items.filter(item => item.type === type);
  }
  if (condition) {
    items = items.filter(item => item.condition === condition);
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    items = items.filter(
      item =>
        item.title.toLowerCase().includes(kw) ||
        item.description.toLowerCase().includes(kw)
    );
  }

  if (sort === 'latest') {
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const total = items.length;
  const start = (Number(page) - 1) * Number(pageSize);
  const paginatedItems = items.slice(start, start + Number(pageSize));

  const itemsWithOwner = paginatedItems.map(item => {
    const owner = db.users.find(u => u.id === item.ownerId);
    return {
      ...item,
      owner: owner ? { ...owner, password: undefined } : undefined,
    };
  });

  const response: PaginatedResponse<Item> = {
    list: itemsWithOwner,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
  };

  res.json(response);
});

router.get('/categories', (_req, res) => {
  const categories = [
    { id: 'books', name: '图书文具', icon: 'book-open' },
    { id: 'electronics', name: '数码产品', icon: 'smartphone' },
    { id: 'home', name: '家居用品', icon: 'home' },
    { id: 'clothing', name: '服装鞋帽', icon: 'shirt' },
    { id: 'baby', name: '母婴用品', icon: 'baby' },
    { id: 'toys', name: '玩具游戏', icon: 'gamepad-2' },
    { id: 'sports', name: '运动户外', icon: 'dumbbell' },
    { id: 'appliances', name: '家用电器', icon: 'tv' },
  ];
  res.json(categories);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const item = db.items.find(i => i.id === id);

  if (!item) {
    res.status(404).json({ error: '物品不存在' });
    return;
  }

  item.viewCount += 1;

  const owner = db.users.find(u => u.id === item.ownerId);
  const itemWithOwner: Item = {
    ...item,
    owner: owner ? { ...owner } : undefined,
  };

  res.json(itemWithOwner);
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const user = db.users.find(u => u.id === req.userId);
  
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  if (user.isFrozen) {
    res.status(403).json({ error: '账号已被冻结，无法发布物品' });
    return;
  }

  const data = req.body as CreateItemRequest;

  if (!data.title || !data.type || !data.category || !data.condition) {
    res.status(400).json({ error: '请填写完整信息' });
    return;
  }

  const id = db.nextItemId++;
  const now = new Date().toISOString();

  const item: Item = {
    id,
    ownerId: req.userId!,
    title: data.title,
    description: data.description || '',
    type: data.type,
    category: data.category,
    condition: data.condition,
    images: data.images || [],
    expectedCategory: data.expectedCategory,
    location: data.location || '',
    latitude: data.latitude,
    longitude: data.longitude,
    status: 'active',
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  db.items.unshift(item);

  res.status(201).json(item);
});

router.put('/:id', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const item = db.items.find(i => i.id === id);

  if (!item) {
    res.status(404).json({ error: '物品不存在' });
    return;
  }

  if (item.ownerId !== req.userId && req.userRole !== 'admin') {
    res.status(403).json({ error: '无权限修改' });
    return;
  }

  const data = req.body as Partial<CreateItemRequest>;

  if (data.title !== undefined) item.title = data.title;
  if (data.description !== undefined) item.description = data.description;
  if (data.type !== undefined) item.type = data.type;
  if (data.category !== undefined) item.category = data.category;
  if (data.condition !== undefined) item.condition = data.condition;
  if (data.images !== undefined) item.images = data.images;
  if (data.expectedCategory !== undefined) item.expectedCategory = data.expectedCategory;
  if (data.location !== undefined) item.location = data.location;

  item.updatedAt = new Date().toISOString();

  res.json(item);
});

router.delete('/:id', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const index = db.items.findIndex(i => i.id === id);

  if (index === -1) {
    res.status(404).json({ error: '物品不存在' });
    return;
  }

  const item = db.items[index];
  if (item.ownerId !== req.userId && req.userRole !== 'admin') {
    res.status(403).json({ error: '无权限删除' });
    return;
  }

  item.status = 'removed';
  item.updatedAt = new Date().toISOString();

  res.json({ success: true });
});

router.post('/:id/favorite', authMiddleware, (req: AuthRequest, res) => {
  const itemId = parseInt(req.params.id);
  const userId = req.userId!;

  const item = db.items.find(i => i.id === itemId);
  if (!item) {
    res.status(404).json({ error: '物品不存在' });
    return;
  }

  const existingIndex = db.favorites.findIndex(
    f => f.userId === userId && f.itemId === itemId
  );

  if (existingIndex !== -1) {
    db.favorites.splice(existingIndex, 1);
    res.json({ success: true, isFavorite: false });
  } else {
    const id = db.nextFavoriteId++;
    const favorite: Favorite = {
      id,
      userId,
      itemId,
      createdAt: new Date().toISOString(),
    };
    db.favorites.push(favorite);
    res.json({ success: true, isFavorite: true });
  }
});

router.get('/:id/favorite', authMiddleware, (req: AuthRequest, res) => {
  const itemId = parseInt(req.params.id);
  const userId = req.userId!;

  const isFavorite = db.favorites.some(
    f => f.userId === userId && f.itemId === itemId
  );

  res.json({ isFavorite });
});

export default router;
