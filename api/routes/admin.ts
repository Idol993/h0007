import { Router } from 'express';
import { db } from '../db/database';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';
import type { AdminStats, Complaint } from '../../../shared/types';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', (_req, res) => {
  const stats: AdminStats = {
    userCount: db.users.filter(u => u.role === 'user').length,
    itemCount: db.items.length,
    exchangeCount: db.exchanges.filter(e => e.status === 'completed').length,
    complaintCount: db.complaints.filter(c => c.status === 'pending').length,
  };
  res.json(stats);
});

router.get('/items', (req, res) => {
  const { page = 1, pageSize = 20, keyword, status } = req.query;

  let items = [...db.items];

  if (keyword) {
    const kw = (keyword as string).toLowerCase();
    items = items.filter(
      i => i.title.toLowerCase().includes(kw) || i.description.toLowerCase().includes(kw)
    );
  }

  if (status) {
    items = items.filter(i => i.status === status);
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = items.length;
  const start = (Number(page) - 1) * Number(pageSize);
  const list = items.slice(start, start + Number(pageSize));

  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/items/:id/remove', (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { reason } = req.body;

  const item = db.items.find(i => i.id === id);
  if (!item) {
    res.status(404).json({ error: '物品不存在' });
    return;
  }

  item.status = 'removed';
  item.updatedAt = new Date().toISOString();

  res.json({ success: true, reason });
});

router.get('/users', (req, res) => {
  const { page = 1, pageSize = 20, keyword } = req.query;

  let users = [...db.users.filter(u => u.role === 'user')];

  if (keyword) {
    const kw = (keyword as string).toLowerCase();
    users = users.filter(u => u.username.toLowerCase().includes(kw));
  }

  users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = users.length;
  const start = (Number(page) - 1) * Number(pageSize);
  const list = users.slice(start, start + Number(pageSize));

  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/users/:id/freeze', (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { days = 30, reason } = req.body;

  const user = db.users.find(u => u.id === id);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  if (user.isFrozen) {
    user.isFrozen = false;
    user.frozenUntil = undefined;
    res.json({ success: true, isFrozen: false });
  } else {
    user.isFrozen = true;
    const frozenUntil = new Date();
    frozenUntil.setDate(frozenUntil.getDate() + Number(days));
    user.frozenUntil = frozenUntil.toISOString();

    const msg = {
      id: db.nextMessageId++,
      userId: id,
      type: 'system' as const,
      title: '账号已被冻结',
      content: `由于"${reason || '违规操作'}"，您的账号发布权限已被冻结${days}天。`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    db.messages.unshift(msg);

    res.json({ success: true, isFrozen: true });
  }
});

router.get('/complaints', (req, res) => {
  const { page = 1, pageSize = 20, status } = req.query;

  let complaints = [...db.complaints];

  if (status) {
    complaints = complaints.filter(c => c.status === status);
  }

  complaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const complaintsWithDetails = complaints.map(c => {
    const reporter = db.users.find(u => u.id === c.reporterId);
    const reportedUser = db.users.find(u => u.id === c.reportedUserId);
    const item = db.items.find(i => i.id === c.itemId);
    return { ...c, reporter, reportedUser, item };
  });

  const total = complaints.length;
  const start = (Number(page) - 1) * Number(pageSize);
  const list = complaintsWithDetails.slice(start, start + Number(pageSize));

  res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/complaints/:id/handle', (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { result } = req.body;

  const complaint = db.complaints.find(c => c.id === id);
  if (!complaint) {
    res.status(404).json({ error: '投诉不存在' });
    return;
  }

  complaint.status = 'handled';
  complaint.handleResult = result;
  complaint.handledAt = new Date().toISOString();

  const msg = {
    id: db.nextMessageId++,
    userId: complaint.reporterId,
    type: 'system' as const,
    title: '投诉处理结果',
    content: `您提交的投诉已处理：${result}`,
    relatedId: id,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.messages.unshift(msg);

  res.json(complaint);
});

export default router;
