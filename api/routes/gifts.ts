import { Router } from 'express';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generatePickupCode } from '../utils';
import type {
  GiftRequest,
  CreateGiftRequest,
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

router.get('/requests', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { itemId } = req.query;

  let requests = db.giftRequests.filter(
    r => r.requesterId === userId
  );

  if (itemId) {
    const id = parseInt(itemId as string);
    requests = db.giftRequests.filter(r => r.itemId === id);
  }

  requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const requestsWithDetails = requests.map(request => {
    const item = db.items.find(i => i.id === request.itemId);
    const requester = db.users.find(u => u.id === request.requesterId);
    return {
      ...request,
      item,
      requester: requester ? { ...requester } : undefined,
    };
  });

  res.json(requestsWithDetails);
});

router.post('/request', authMiddleware, (req: AuthRequest, res) => {
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

  if (item.ownerId === userId) {
    res.status(400).json({ error: '不能领取自己的物品' });
    return;
  }

  if (item.status !== 'active') {
    res.status(400).json({ error: '该物品已被领取或下架' });
    return;
  }

  const existingRequest = db.giftRequests.find(
    r => r.itemId === itemId && r.requesterId === userId && r.status === 'pending'
  );
  if (existingRequest) {
    res.status(400).json({ error: '您已申请领取，请等待物主确认' });
    return;
  }

  const id = db.nextGiftRequestId++;
  const now = new Date().toISOString();

  const giftRequest: GiftRequest = {
    id,
    itemId,
    requesterId: userId,
    status: 'pending',
    message,
    createdAt: now,
  };

  db.giftRequests.unshift(giftRequest);

  addMessage(
    item.ownerId,
    'gift',
    '收到新的领取请求',
    `有人申请领取您的「${item.title}」，请尽快处理。`,
    id
  );

  res.status(201).json(giftRequest);
});

router.get('/requests/my', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.userId!;

  const requests = db.giftRequests.filter(r => r.requesterId === userId);
  requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const requestsWithDetails = requests.map(request => {
    const item = db.items.find(i => i.id === request.itemId);
    return {
      ...request,
      item,
    };
  });

  res.json(requestsWithDetails);
});

router.post('/requests/:id/confirm', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userId!;

  const giftRequest = db.giftRequests.find(r => r.id === id);
  if (!giftRequest) {
    res.status(404).json({ error: '领取请求不存在' });
    return;
  }

  const item = db.items.find(i => i.id === giftRequest.itemId);
  if (!item) {
    res.status(404).json({ error: '物品不存在' });
    return;
  }

  if (item.ownerId !== userId) {
    res.status(403).json({ error: '只有物主才能确认领取' });
    return;
  }

  if (giftRequest.status !== 'pending') {
    res.status(400).json({ error: '该请求状态无法确认' });
    return;
  }

  if (item.status !== 'active') {
    res.status(400).json({ error: '该物品已被领取或下架' });
    return;
  }

  const pickupCode = generatePickupCode();
  giftRequest.status = 'confirmed';
  giftRequest.pickupCode = pickupCode;
  giftRequest.confirmedAt = new Date().toISOString();

  item.status = 'gifted';

  db.giftRequests
    .filter(r => r.itemId === giftRequest.itemId && r.id !== giftRequest.id && r.status === 'pending')
    .forEach(r => {
      r.status = 'cancelled';
      addMessage(
        r.requesterId,
        'gift',
        '很遗憾，物品已被他人领取',
        `您申请的「${item.title}」已被其他邻居领取。`,
        r.id
      );
    });

  addMessage(
    giftRequest.requesterId,
    'gift',
    '恭喜！您获得了该物品',
    `领取码：${pickupCode}，请凭码到指定地点领取。`,
    id
  );

  res.json({ pickupCode, giftRequest });
});

router.post('/requests/:id/cancel', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userId!;

  const giftRequest = db.giftRequests.find(r => r.id === id);
  if (!giftRequest) {
    res.status(404).json({ error: '领取请求不存在' });
    return;
  }

  if (giftRequest.requesterId !== userId) {
    res.status(403).json({ error: '无权限取消' });
    return;
  }

  if (giftRequest.status !== 'pending') {
    res.status(400).json({ error: '该请求状态无法取消' });
    return;
  }

  giftRequest.status = 'cancelled';

  res.json({ success: true });
});

router.post('/verify', authMiddleware, (req: AuthRequest, res) => {
  const { itemId, pickupCode } = req.body;

  const giftRequest = db.giftRequests.find(
    r => r.itemId === itemId && r.pickupCode === pickupCode && r.status === 'confirmed'
  );

  if (!giftRequest) {
    res.status(400).json({ success: false, error: '领取码无效' });
    return;
  }

  giftRequest.status = 'completed';

  const item = db.items.find(i => i.id === itemId);
  if (item) {
    item.status = 'gifted';
  }

  res.json({ success: true, giftRequest });
});

export default router;
