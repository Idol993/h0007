import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore } from '@/store';
import { User, Lock, Phone, ArrowRight } from 'lucide-react';
import Toast from '@/components/Toast';

interface AuthPageProps {
  mode: 'login' | 'register';
}

const AuthPage = ({ mode }: AuthPageProps) => {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, isLoading } = useAuthStore();
  const { showToastMessage } = useUIStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      showToastMessage('请填写用户名和密码', 'error');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        showToastMessage('两次密码输入不一致', 'error');
        return;
      }
      if (password.length < 6) {
        showToastMessage('密码至少6位', 'error');
        return;
      }
    }

    try {
      if (mode === 'login') {
        await login(username, password);
        showToastMessage('登录成功！', 'success');
      } else {
        await register(username, password, phone || undefined);
        showToastMessage('注册成功！', 'success');
      }
      setTimeout(() => navigate('/'), 500);
    } catch (err: any) {
      showToastMessage(err.message || '操作失败', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <Toast />
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">换</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === 'login' ? '欢迎回来' : '创建账号'}
          </h1>
          <p className="text-gray-500">
            {mode === 'login'
              ? '登录您的账号，开始邻里互换之旅'
              : '加入我们，让闲置物品流动起来'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  手机号 <span className="text-gray-400 text-xs">（选填）</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  确认密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入密码"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3.5 rounded-xl font-medium transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                '处理中...'
              ) : (
                <>
                  {mode === 'login' ? '登录' : '注册'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>
                还没有账号？
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium ml-1">
                  立即注册
                </Link>
              </>
            ) : (
              <>
                已有账号？
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium ml-1">
                  立即登录
                </Link>
              </>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">测试账号</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-700">管理员</p>
                <p className="text-gray-500">admin / admin123</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-700">普通用户</p>
                <p className="text-gray-500">小明 / 123456</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
