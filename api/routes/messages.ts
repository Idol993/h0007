import { Router } from 'express';
import { db } from '../db/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import type { Message } from '../../../shared/types';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { type } = req.query;

  let messages = db.messages.filter(m => m.userId === userId);

  if (type) {
    messages = messages.filter(m => m.type === type);
  }

  messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(messages);
});

router.get('/unread-count', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const count = db.messages.filter(m => m.userId === userId && !m.isRead).length;
  res.json({ count });
});

router.post('/:id/read', authMiddleware, (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userId!;

  const message = db.messages.find(m => m.id === id && m.userId === userId);
  if (!message) {
    res.status(404).json({ error: '消息不存在' });
    return;
  }

  message.isRead = true;
  res.json({ success: true });
});

router.post('/read-all', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.userId!;

  db.messages
    .filter(m => m.userId === userId)
    .forEach(m => {
      m.isRead = true;
    });

  res.json({ success: true });
});

export default router;
