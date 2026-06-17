import { Router } from 'express';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import type {
  Exchange,
  CreateExchangeRequest,
  ReviewRequest,
  NegotiateRequest,
  Message as MessageType,
} from '../../../shared/types';

const router = Router();

const addMessage = (userId: number, type: string, title: string, content: string, relatedId?: number) => {
  const msg: MessageType = {
    id: db.nextMessageId++,
    userId,
    type: type as any,
    title,
    content,
    relatedId,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.messages.unshift(msg);
};

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { status } = req.query;

  let exchanges = db.exchanges.filter(
    e => e.requesterId === userId || e.ownerId === userId
  );

  if (status) {
    exchanges = exchanges.filter(e => e.status === status);
  }

  exchanges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const exchangesWithDetails = exchanges.map(exchange => {
    const item = db.items.find(i => i.id === exchange.itemId);
    const requester = db.users.find(u => u.id === exchange.requesterId);
    const owner = db.users.find(u => u.id === exchange.ownerId);
    return {
      ...exchange,
      item,
      requester: requester ? { ...requester } : undefined,
      owner: owner ? { ...owner } : undefined,
    };
  });

  res.json(exchangesWithDetails);
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { itemId, message, offeredItemIds } = req.body as CreateExchangeRequest;

  const item = db.items.find(i => i.id === itemId);
  if (!item) {
    res.status(404).json({ error: '物品不存在' });
    return;
  }

  if (item.type !== 'exchange') {
    res.status(400).json({ error: '该物品不支持交换' });
    return;
  }

  if (item.ownerId === userId) {
    res.status(400).json({ error: '不能交换自己的物品' });
    return;
  }

  const existingExchange = db.exchanges.find(
    e => e.itemId === itemId && e.requesterId === userId && e.status !== 'completed' && e.status !== 'rejected' && e.status !== 'cancelled'
  );
  if (existingExchange) {
    res.status(400).json({ error: '您已申请过交换，请等待物主回复' });
    return;
  }

  const id = db.nextExchangeId++;
  const now = new Date().toISOString();

  const exchange: Exchange = {
    id,
    itemId,
    requesterId: userId,
    ownerId: item.ownerId,
    status: 'pending',
    message,
    offeredItemIds,
    createdAt: now,
  };

  db.exchanges.unshift(exchange);

  addMessage(
    item.ownerId,
    'exchange',
    '收到新的交换申请',
    `有人申请交换您的「${item.title}」，请尽快处理。`,
    id
  );

  res.status(201).json(exchange);
});

router.post('/:id/confirm', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userId!;

  const exchange = db.exchanges.find(e => e.id === id);
  if (!exchange) {
    res.status(404).json({ error: '交换申请不存在' });
    return;
  }

  if (exchange.ownerId !== userId) {
    res.status(403).json({ error: '只有物主才能确认交换' });
    return;
  }

  if (exchange.status !== 'pending') {
    res.status(400).json({ error: '该申请状态无法确认' });
    return;
  }

  exchange.status = 'confirmed';
  exchange.confirmedAt = new Date().toISOString();

  addMessage(
    exchange.requesterId,
    'exchange',
    '交换申请已确认',
    '物主已确认您的交换申请，请协商见面时间地点。',
    id
  );

  res.json(exchange);
});

router.post('/:id/reject', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userId!;

  const exchange = db.exchanges.find(e => e.id === id);
  if (!exchange) {
    res.status(404).json({ error: '交换申请不存在' });
    return;
  }

  if (exchange.ownerId !== userId) {
    res.status(403).json({ error: '只有物主才能拒绝交换' });
    return;
  }

  if (exchange.status !== 'pending') {
    res.status(400).json({ error: '该申请状态无法拒绝' });
    return;
  }

  exchange.status = 'rejected';

  addMessage(
    exchange.requesterId,
    'exchange',
    '交换申请被拒绝',
    '很遗憾，物主拒绝了您的交换申请。',
    id
  );

  res.json(exchange);
});

router.post('/:id/negotiate', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userId!;
  const { meetTime, meetLocation } = req.body as NegotiateRequest;

  const exchange = db.exchanges.find(e => e.id === id);
  if (!exchange) {
    res.status(404).json({ error: '交换申请不存在' });
    return;
  }

  if (exchange.requesterId !== userId && exchange.ownerId !== userId) {
    res.status(403).json({ error: '无权限操作' });
    return;
  }

  if (exchange.status !== 'confirmed') {
    res.status(400).json({ error: '只有已确认的交换才能协商见面' });
    return;
  }

  exchange.meetTime = meetTime;
  exchange.meetLocation = meetLocation;
  exchange.status = 'negotiating';

  const otherUserId = exchange.requesterId === userId ? exchange.ownerId : exchange.requesterId;
  addMessage(
    otherUserId,
    'exchange',
    '见面信息已更新',
    `交换见面时间：${meetTime}，地点：${meetLocation}`,
    id
  );

  res.json(exchange);
});

router.post('/:id/complete', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userId!;

  const exchange = db.exchanges.find(e => e.id === id);
  if (!exchange) {
    res.status(404).json({ error: '交换申请不存在' });
    return;
  }

  if (exchange.requesterId !== userId && exchange.ownerId !== userId) {
    res.status(403).json({ error: '无权限操作' });
    return;
  }

  if (exchange.status !== 'negotiating' && exchange.status !== 'confirmed') {
    res.status(400).json({ error: '该状态无法完成交换' });
    return;
  }

  if (exchange.requesterId === userId) {
    exchange.requesterRating = exchange.requesterRating || 0;
  } else {
    exchange.ownerRating = exchange.ownerRating || 0;
  }

  const bothConfirmed = 
    (exchange.requesterId === userId || exchange.requesterRating !== undefined) &&
    (exchange.ownerId === userId || exchange.ownerRating !== undefined);

  if (bothConfirmed) {
    exchange.status = 'completed';
    exchange.completedAt = new Date().toISOString();

    const item = db.items.find(i => i.id === exchange.itemId);
    if (item) {
      item.status = 'exchanged';
    }
  }

  const otherUserId = exchange.requesterId === userId ? exchange.ownerId : exchange.requesterId;
  addMessage(
    otherUserId,
    'exchange',
    '对方已确认完成交换',
    '请确认并进行信用评价。',
    id
  );

  res.json(exchange);
});

router.post('/:id/review', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userId!;
  const { rating, comment } = req.body as ReviewRequest;

  const exchange = db.exchanges.find(e => e.id === id);
  if (!exchange) {
    res.status(404).json({ error: '交换申请不存在' });
    return;
  }

  if (exchange.status !== 'completed') {
    res.status(400).json({ error: '只有已完成的交换才能评价' });
    return;
  }

  if (exchange.requesterId === userId) {
    exchange.requesterRating = rating;
    exchange.requesterComment = comment;
    
    const owner = db.users.find(u => u.id === exchange.ownerId);
    if (owner) {
      owner.creditScore = Math.max(0, Math.min(100, owner.creditScore + (rating - 3) * 2));
    }
  } else if (exchange.ownerId === userId) {
    exchange.ownerRating = rating;
    exchange.ownerComment = comment;
    
    const requester = db.users.find(u => u.id === exchange.requesterId);
    if (requester) {
      requester.creditScore = Math.max(0, Math.min(100, requester.creditScore + (rating - 3) * 2));
    }
  } else {
    res.status(403).json({ error: '无权限评价' });
    return;
  }

  res.json(exchange);
});

router.post('/:id/no-show', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userId!;

  const exchange = db.exchanges.find(e => e.id === id);
  if (!exchange) {
    res.status(404).json({ error: '交换申请不存在' });
    return;
  }

  if (exchange.requesterId !== userId && exchange.ownerId !== userId) {
    res.status(403).json({ error: '无权限操作' });
    return;
  }

  const noShowUserId = exchange.requesterId === userId ? exchange.ownerId : exchange.requesterId;
  const noShowUser = db.users.find(u => u.id === noShowUserId);

  if (noShowUser) {
    noShowUser.noShowCount += 1;
    noShowUser.creditScore = Math.max(0, noShowUser.creditScore - 10);

    if (noShowUser.noShowCount >= 3) {
      noShowUser.isFrozen = true;
      const frozenUntil = new Date();
      frozenUntil.setDate(frozenUntil.getDate() + 30);
      noShowUser.frozenUntil = frozenUntil.toISOString();

      addMessage(
        noShowUserId,
        'system',
        '账号已被冻结',
        '由于您连续3次放鸽子，账号发布权限已被冻结30天。'
      );
    }
  }

  exchange.status = 'no_show';

  res.json({ success: true });
});

export default router;
