import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, userPasswords } from '../db/database';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '../../shared/types';

const router = Router();

const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, password, phone } = req.body as RegisterRequest;

  if (!username || !password) {
    res.status(400).json({ error: '请输入用户名和密码' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: '密码长度至少6位' });
    return;
  }

  const existingUser = db.users.find(u => u.username === username);
  if (existingUser) {
    res.status(400).json({ error: '该用户名已被注册' });
    return;
  }

  const id = db.nextUserId++;
  const now = new Date().toISOString();
  const hashedPassword = bcrypt.hashSync(password, 10);

  const user: User = {
    id,
    username,
    phone,
    avatar: avatarUrl(username),
    role: 'user',
    creditScore: 100,
    noShowCount: 0,
    isFrozen: false,
    createdAt: now,
    updatedAt: now,
  };

  db.users.push(user);
  userPasswords[id] = hashedPassword;

  const token = generateToken(id, 'user');

  const response: AuthResponse = {
    id: user.id,
    username: user.username,
    token,
    role: user.role,
    avatar: user.avatar,
  };

  res.status(201).json(response);
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body as LoginRequest;

  if (!username || !password) {
    res.status(400).json({ error: '请输入用户名和密码' });
    return;
  }

  const user = db.users.find(u => u.username === username);
  if (!user) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const hashedPassword = userPasswords[user.id];
  if (!hashedPassword) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const isValid = bcrypt.compareSync(password, hashedPassword);
  if (!isValid) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  if (user.isFrozen) {
    res.status(403).json({ error: '账号已被冻结，请联系管理员' });
    return;
  }

  const token = generateToken(user.id, user.role);

  const response: AuthResponse = {
    id: user.id,
    username: user.username,
    token,
    role: user.role,
    avatar: user.avatar,
  };

  res.json(response);
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response): void => {
  const userId = req.userId!;
  const user = db.users.find(u => u.id === userId);

  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    creditScore: user.creditScore,
    noShowCount: user.noShowCount,
    isFrozen: user.isFrozen,
    frozenUntil: user.frozenUntil,
    createdAt: user.createdAt,
  });
});

router.post('/logout', (_req: Request, res: Response): void => {
  res.json({ success: true });
});

export default router;
