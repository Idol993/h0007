import { Router } from 'express';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import type {
  GiftRequest,
  CreateGiftRequest,
  Item,
  Message as MessageType,
  TimelineEvent,
} from '../../../shared/types';

const router = Router();

const generatePickupCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

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

const addGiftTimeline = (
  giftRequestId: number,
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
  (event as any).giftRequestId = giftRequestId;
  db.timelineEvents.push(event);
  return event;
};

router.get('/requests', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { itemId } = req.query;

  let requests = db.giftRequests.filter(
    r => r.requesterId === userId || db.items.find(i => i.id === r.itemId)?.ownerId === userId
  );

  if (itemId) {
    const id = parseInt(itemId as string);
    requests = db.giftRequests.filter(r => r.itemId === id);
  }

  requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const requestsWithDetails = requests.map(request => {
    const item = db.items.find(i => i.id === request.itemId);
    const requester = db.users.find(u => u.id === request.requesterId);
    const timeline = db.timelineEvents
      .filter(e => (e as any).giftRequestId === request.id)
      .map(e => ({
        ...e,
        operator: db.users.find(u => u.id === e.operatorId),
      }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return {
      ...request,
      item: item ? { ...item, owner: db.users.find(u => u.id === item.ownerId) } : undefined,
      requester: requester ? { ...requester } : undefined,
      timeline,
    };
  });

  res.json(requestsWithDetails);
});

router.post('/requests', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { itemId, message } = req.body as CreateGiftRequest;

  const item = db.items.find(i => i.id === itemId);
  if (!item) {
    res.status(404).json({ error: '物品不存在' });
    return;
  }

  if (item.type !== 'gift') {
    res.status(400).json({ error: '该物品不是赠送类型' });
    return;
  }

  if (item.status !== 'active') {
    res.status(400).json({ error: '该物品已被赠送或下架' });
    return;
  }

  if (item.ownerId === userId) {
    res.status(400).json({ error: '不能领取自己的物品' });
    return;
  }

  const existingRequest = db.giftRequests.find(
    r => r.itemId === itemId && r.requesterId === userId && (r.status === 'pending' || r.status === 'confirmed')
  );
  if (existingRequest) {
    res.status(400).json({ error: '您已申请过领取，请等待物主回复' });
    return;
  }

  const confirmedRequestExists = db.giftRequests.find(
    r => r.itemId === itemId && r.status === 'confirmed'
  );
  if (confirmedRequestExists) {
    res.status(400).json({ error: '该物品已有申请人被确认，暂时无法领取' });
    return;
  }

  const id = db.nextGiftRequestId++;
  const request: GiftRequest = {
    id,
    itemId,
    requesterId: userId,
    status: 'pending',
    message,
    createdAt: new Date().toISOString(),
  };

  db.giftRequests.unshift(request);
  addGiftTimeline(id, 'gift_created', userId, { content: message });

  addMessage(
    item.ownerId,
    'gift',
    '收到新的领取申请',
    `有人申请领取您的「${item.title}」，请尽快处理。`,
    id
  );

  res.status(201).json(request);
});

router.post('/requests/:id/confirm', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userId!;

  const request = db.giftRequests.find(r => r.id === id);
  if (!request) {
    res.status(404).json({ error: '领取申请不存在' });
    return;
  }

  const item = db.items.find(i => i.id === request.itemId);
  if (!item) {
    res.status(404).json({ error: '关联物品不存在' });
    return;
  }

  if (item.ownerId !== userId) {
    res.status(403).json({ error: '只有物主才能确认领取申请' });
    return;
  }

  if (request.status !== 'pending') {
    res.status(400).json({ error: '该申请状态无法确认' });
    return;
  }

  request.status = 'confirmed';
  request.confirmedAt = new Date().toISOString();
  request.pickupCode = generatePickupCode();

  addGiftTimeline(id, 'gift_confirmed', userId, { content: `领取码：${request.pickupCode}` });

  const otherRequests = db.giftRequests.filter(
    r => r.itemId === request.itemId && r.id !== id && r.status === 'pending'
  );
  otherRequests.forEach(r => {
    r.status = 'expired';
    addGiftTimeline(r.id, 'gift_expired', userId, { content: '物主已确认其他申请人' });
    addMessage(
      r.requesterId,
      'gift',
      '领取申请已失效',
      `很遗憾，「${item.title}」的物主已确认其他申请人。`,
      r.id
    );
  });

  addMessage(
    request.requesterId,
    'gift',
    '领取申请已确认',
    `恭喜！您获得了「${item.title}」，领取码：${request.pickupCode}，请凭码到约定地点领取。`,
    id
  );

  res.json({
    ...request,
    item,
    pickupCode: request.pickupCode,
  });
});

router.post('/requests/:id/cancel', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userId!;

  const request = db.giftRequests.find(r => r.id === id);
  if (!request) {
    res.status(404).json({ error: '领取申请不存在' });
    return;
  }

  if (request.requesterId !== userId) {
    res.status(403).json({ error: '无权限取消' });
    return;
  }

  if (request.status !== 'pending') {
    res.status(400).json({ error: '该申请状态无法取消' });
    return;
  }

  request.status = 'cancelled';
  addGiftTimeline(id, 'gift_cancelled', userId);

  res.json(request);
});

router.post('/requests/:id/complete', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userId!;

  const request = db.giftRequests.find(r => r.id === id);
  if (!request) {
    res.status(404).json({ error: '领取申请不存在' });
    return;
  }

  const item = db.items.find(i => i.id === request.itemId);

  if (request.requesterId !== userId && item?.ownerId !== userId) {
    res.status(403).json({ error: '无权限操作' });
    return;
  }

  if (request.status !== 'confirmed') {
    res.status(400).json({ error: '该申请状态无法完成' });
    return;
  }

  request.status = 'completed';
  addGiftTimeline(id, 'gift_completed', userId);

  if (item) {
    item.status = 'gifted';
  }

  res.json(request);
});

export default router;
