import { Router } from 'express';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import type { Item } from '../../../shared/types';

const router = Router();

router.get('/favorites', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.userId!;

  const userFavorites = db.favorites.filter(f => f.userId === userId);
  const items: Item[] = userFavorites
    .map(f => {
      const item = db.items.find(i => i.id === f.itemId);
      if (!item) return null;
      const owner = db.users.find(u => u.id === item.ownerId);
      return { ...item, owner };
    })
    .filter(Boolean) as Item[];

  res.json(items);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const user = db.users.find(u => u.id === id);

  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  const items = db.items.filter(i => i.ownerId === id && i.status === 'active');
  const completedExchanges = db.exchanges.filter(
    e => (e.requesterId === id || e.ownerId === id) && e.status === 'completed'
  );

  res.json({
    ...user,
    itemCount: items.length,
    exchangeCount: completedExchanges.length,
  });
});

router.get('/:id/items', (req, res) => {
  const id = parseInt(req.params.id);
  const { status = 'active' } = req.query;

  const items = db.items.filter(i => i.ownerId === id && i.status === status);
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(items);
});

router.get('/:id/credit', (req, res) => {
  const id = parseInt(req.params.id);
  const user = db.users.find(u => u.id === id);

  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  res.json({
    creditScore: user.creditScore,
    noShowCount: user.noShowCount,
    isFrozen: user.isFrozen,
    frozenUntil: user.frozenUntil,
  });
});

router.get('/:id/reviews', (req, res) => {
  const id = parseInt(req.params.id);

  const reviews = db.reviews
    .filter(r => r.toUserId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)
    .map(r => ({
      ...r,
      fromUser: db.users.find(u => u.id === r.fromUserId),
    }));

  const totalReviews = db.reviews.filter(r => r.toUserId === id).length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  res.json({
    list: reviews,
    total: totalReviews,
    avgRating: Math.round(avgRating * 10) / 10,
  });
});

export default router;
