import { Router } from 'express';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import type {
  Exchange,
  CreateExchangeRequest,
  ReviewRequest,
  NegotiateRequest,
  Message as MessageType,
  TimelineEvent,
  Review,
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

const addTimeline = (
  exchangeId: number,
  type: TimelineEvent['type'],
  operatorId: number,
  extra: Partial<TimelineEvent> = {}
) => {
  const event: TimelineEvent = {
    id: db.nextTimelineEventId++,
    type,
    operatorId,
    createdAt: new Date().toISOString(),
    ...extra,
  };
  db.timelineEvents.push(event);
  return event;
};

const buildTimelineWithUsers = (exchangeId: number): TimelineEvent[] => {
  return db.timelineEvents
    .filter(e =>
      e.type.startsWith('exchange_') &&
      (e as any).exchangeId === exchangeId
    )
    .map(e => ({ ...e }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
    const timeline = db.timelineEvents
      .filter(e => (e as any).exchangeId === exchange.id)
      .map(e => ({
        ...e,
        operator: db.users.find(u => u.id === e.operatorId),
      }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return {
      ...exchange,
      item,
      requester: requester ? { ...requester } : undefined,
      owner: owner ? { ...owner } : undefined,
      timeline,
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

  addTimeline(id, 'exchange_created', userId, { content: message, exchangeId: id } as any);

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

  addTimeline(id, 'exchange_confirmed', userId, { exchangeId: id } as any);

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

  addTimeline(id, 'exchange_rejected', userId, { exchangeId: id } as any);

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

  if (exchange.status !== 'confirmed' && exchange.status !== 'negotiating') {
    res.status(400).json({ error: '只有已确认或协商中的交换才能更新见面信息' });
    return;
  }

  if (exchange.status === 'completed') {
    res.status(400).json({ error: '交换已完成，无法再改约' });
    return;
  }

  const oldMeetTime = exchange.meetTime;
  const oldMeetLocation = exchange.meetLocation;

  exchange.meetTime = meetTime;
  exchange.meetLocation = meetLocation;
  exchange.status = 'negotiating';

  addTimeline(id, 'exchange_negotiated', userId, {
    oldMeetTime,
    oldMeetLocation,
    newMeetTime: meetTime,
    newMeetLocation: meetLocation,
    exchangeId: id,
  } as any);

  const otherUserId = exchange.requesterId === userId ? exchange.ownerId : exchange.requesterId;
  const operatorName = db.users.find(u => u.id === userId)?.username || '对方';

  let msgContent = `${operatorName}更新了见面约定：\n`;
  if (oldMeetTime && oldMeetTime !== meetTime) {
    msgContent += `时间：${oldMeetTime} → ${meetTime}\n`;
  } else if (!oldMeetTime) {
    msgContent += `时间：${meetTime}\n`;
  }
  if (oldMeetLocation && oldMeetLocation !== meetLocation) {
    msgContent += `地点：${oldMeetLocation} → ${meetLocation}`;
  } else if (!oldMeetLocation) {
    msgContent += `地点：${meetLocation}`;
  }

  addMessage(otherUserId, 'exchange', '见面信息已更新', msgContent, id);

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
    exchange.requesterCompleted = true;
  } else {
    exchange.ownerCompleted = true;
  }

  const operatorName = db.users.find(u => u.id === userId)?.username || '对方';
  const otherUserId = exchange.requesterId === userId ? exchange.ownerId : exchange.requesterId;

  const bothConfirmed = exchange.requesterCompleted && exchange.ownerCompleted;

  if (bothConfirmed) {
    exchange.status = 'completed';
    exchange.completedAt = new Date().toISOString();

    const item = db.items.find(i => i.id === exchange.itemId);
    if (item) {
      item.status = 'exchanged';
    }

    addTimeline(id, 'exchange_completed_both', userId, { exchangeId: id } as any);

    addMessage(exchange.requesterId, 'review', '交换已完成', '请为对方进行信用评价。', id);
    addMessage(exchange.ownerId, 'review', '交换已完成', '请为对方进行信用评价。', id);
  } else {
    addTimeline(id, 'exchange_completed_one', userId, { exchangeId: id } as any);
    addMessage(otherUserId, 'exchange', '对方已确认完成交换', `${operatorName}已确认完成交换，请您也确认并评价。`, id);
  }

  res.json(exchange);
});

router.post('/:id/review', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userId!;
  const { rating, tags, comment } = req.body as ReviewRequest;

  const exchange = db.exchanges.find(e => e.id === id);
  if (!exchange) {
    res.status(404).json({ error: '交换申请不存在' });
    return;
  }

  if (exchange.status !== 'completed') {
    res.status(400).json({ error: '只有已完成的交换才能评价' });
    return;
  }

  let toUserId: number;
  const creditChange = (rating - 3) * 2;

  if (exchange.requesterId === userId) {
    exchange.requesterRating = rating;
    exchange.requesterComment = comment;
    exchange.requesterTags = tags || [];
    toUserId = exchange.ownerId;
  } else if (exchange.ownerId === userId) {
    exchange.ownerRating = rating;
    exchange.ownerComment = comment;
    exchange.ownerTags = tags || [];
    toUserId = exchange.requesterId;
  } else {
    res.status(403).json({ error: '无权限评价' });
    return;
  }

  const toUser = db.users.find(u => u.id === toUserId);
  if (toUser) {
    toUser.creditScore = Math.max(0, Math.min(100, toUser.creditScore + creditChange));
  }

  addTimeline(id, 'exchange_reviewed', userId, {
    rating,
    tags: tags || [],
    comment,
    exchangeId: id,
  } as any);

  const review: Review = {
    id: db.nextReviewId++,
    fromUserId: userId,
    toUserId,
    exchangeId: id,
    rating,
    tags: tags || [],
    comment,
    creditChange,
    createdAt: new Date().toISOString(),
  };
  db.reviews.push(review);

  const fromUserName = db.users.find(u => u.id === userId)?.username || '对方';
  addMessage(
    toUserId,
    'review',
    '收到新的评价',
    `${fromUserName}给了您 ${rating} 星评价${creditChange >= 0 ? '，信用分+' + creditChange : '，信用分' + creditChange}`,
    id
  );

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
  addTimeline(id, 'exchange_no_show', userId, { exchangeId: id } as any);

  res.json({ success: true });
});

export default router;
