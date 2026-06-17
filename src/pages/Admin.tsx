import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuthStore, useUIStore } from '@/store';
import { adminAPI } from '@/api';
import type { AdminStats, Item, User, Complaint, TimelineEvent } from '../../shared/types';
import {
  LayoutDashboard,
  Package,
  Users,
  AlertTriangle,
  Settings,
  LogOut,
  Search,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Menu,
  X,
  ChevronRight,
  Clock,
  MapPin,
  RefreshCw,
  Gift,
  Star,
  ArrowRight,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { timeAgo, exchangeStatusLabel, exchangeStatusColor, giftStatusLabel, giftStatusColor } from '@/utils';

const timelineIconMap: Record<string, any> = {
  exchange_created: RefreshCw,
  exchange_confirmed: CheckCircle,
  exchange_rejected: X,
  exchange_negotiated: MessageSquare,
  exchange_completed_one: Clock,
  exchange_completed_both: CheckCircle,
  exchange_reviewed: Star,
  exchange_no_show: AlertTriangle,
  gift_created: Gift,
  gift_confirmed: CheckCircle,
  gift_cancelled: X,
  gift_expired: AlertTriangle,
  gift_completed: CheckCircle,
};

const timelineLabelMap: Record<string, string> = {
  exchange_created: '发起交换申请',
  exchange_confirmed: '物主确认交换',
  exchange_rejected: '物主拒绝交换',
  exchange_negotiated: '更新见面约定',
  exchange_completed_one: '一方确认完成',
  exchange_completed_both: '双方确认完成',
  exchange_reviewed: '提交信用评价',
  exchange_no_show: '标记放鸽子',
  gift_created: '提交领取申请',
  gift_confirmed: '物主确认赠送',
  gift_cancelled: '申请人取消',
  gift_expired: '申请已失效',
  gift_completed: '领取完成',
};

const renderTimelineItemAdmin = (event: TimelineEvent, isLast: boolean) => {
  const Icon = timelineIconMap[event.type] || FileText;
  const label = timelineLabelMap[event.type] || '操作';
  const operatorName = (event as any).operator?.username || '系统';

  return (
    <div key={event.id} className="relative pl-8 pb-4">
      {!isLast && (
        <div className="absolute left-[13px] top-8 bottom-0 w-0.5 bg-gray-200" />
      )}
      <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary-600" />
      </div>
      <div className="bg-gray-50 rounded-lg p-3 ml-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-sm text-gray-900">{label}</span>
          <span className="text-xs text-gray-400">{timeAgo(event.createdAt)}</span>
        </div>
        <div className="text-xs text-gray-500 mb-1">操作人：{operatorName}</div>
        {event.type === 'exchange_created' && event.content && (
          <div className="text-sm text-gray-600 bg-white rounded p-2 mt-1">申请留言：{event.content}</div>
        )}
        {event.type === 'exchange_negotiated' && (
          <div className="mt-1 space-y-1 text-sm">
            {event.oldMeetTime !== event.newMeetTime && (
              <div className="flex items-center text-gray-600">
                <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                {event.oldMeetTime && <span className="text-gray-400 line-through mr-1">{event.oldMeetTime}</span>}
                {event.oldMeetTime && <ArrowRight className="w-3 h-3 mx-1 text-gray-400" />}
                <span className="text-primary-600 font-medium">{event.newMeetTime}</span>
              </div>
            )}
            {event.oldMeetLocation !== event.newMeetLocation && (
              <div className="flex items-center text-gray-600">
                <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                {event.oldMeetLocation && <span className="text-gray-400 line-through mr-1">{event.oldMeetLocation}</span>}
                {event.oldMeetLocation && <ArrowRight className="w-3 h-3 mx-1 text-gray-400" />}
                <span className="text-primary-600 font-medium">{event.newMeetLocation}</span>
              </div>
            )}
          </div>
        )}
        {event.type === 'exchange_reviewed' && (
          <div className="mt-1 space-y-1">
            <div className="flex items-center text-yellow-500 text-sm">
              {'★'.repeat(event.rating || 0)}
              <span className="text-gray-400 ml-2">{'★'.repeat(5 - (event.rating || 0))}</span>
            </div>
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {event.tags.map((t: string) => (
                  <span key={t} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {event.comment && <p className="text-sm text-gray-600 bg-white rounded p-2 mt-1">{event.comment}</p>}
          </div>
        )}
        {event.type === 'gift_confirmed' && event.content && (
          <div className="text-sm text-green-600 font-medium bg-green-50 rounded p-2 mt-1">{event.content}</div>
        )}
        {event.type === 'gift_expired' && event.content && (
          <div className="text-sm text-red-600 bg-red-50 rounded p-2 mt-1">{event.content}</div>
        )}
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/admin', label: '数据概览', icon: LayoutDashboard, exact: true },
    { path: '/admin/items', label: '物品管理', icon: Package },
    { path: '/admin/users', label: '用户管理', icon: Users },
    { path: '/admin/complaints', label: '投诉管理', icon: AlertTriangle },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gray-900 text-white z-50 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <span className="font-bold">管理后台</span>
        <div className="w-10"></div>
      </div>

      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-40 transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-gray-800">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">换</span>
            </div>
            <span className="font-bold text-lg">管理后台</span>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center mb-4 px-2">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-10 h-10 rounded-full bg-gray-700" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-700"></div>
            )}
            <div className="ml-3">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-gray-400">管理员</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2.5 text-gray-300 hover:bg-gray-800 hover:text-white rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            退出登录
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:ml-64 pt-14 lg:pt-0">
        <div className="p-6">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="items" element={<AdminItems />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="complaints" element={<AdminComplaints />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const { showToastMessage } = useUIStore();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err: any) {
      showToastMessage(err.message || '加载失败', 'error');
    }
  };

  const statCards = [
    { label: '用户总数', value: stats?.userCount || 0, icon: Users, color: 'bg-blue-500' },
    { label: '物品总数', value: stats?.itemCount || 0, icon: Package, color: 'bg-green-500' },
    { label: '完成交换', value: stats?.exchangeCount || 0, icon: CheckCircle, color: 'bg-purple-500' },
    { label: '待处理投诉', value: stats?.complaintCount || 0, icon: AlertTriangle, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">数据概览</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/admin/items"
              className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Package className="w-8 h-8 text-primary-500 mr-3" />
              <div>
                <div className="font-medium text-gray-800">物品管理</div>
                <div className="text-xs text-gray-500">审核、下架物品</div>
              </div>
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Users className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <div className="font-medium text-gray-800">用户管理</div>
                <div className="text-xs text-gray-500">冻结、解冻用户</div>
              </div>
            </Link>
            <Link
              to="/admin/complaints"
              className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <AlertTriangle className="w-8 h-8 text-orange-500 mr-3" />
              <div>
                <div className="font-medium text-gray-800">投诉处理</div>
                <div className="text-xs text-gray-500">处理用户投诉</div>
              </div>
            </Link>
            <Link
              to="/"
              className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Eye className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <div className="font-medium text-gray-800">返回前台</div>
                <div className="text-xs text-gray-500">浏览用户端</div>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">系统提示</h2>
          <div className="space-y-3">
            <div className="flex items-start p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">信用系统正常运行</p>
                <p className="text-xs text-blue-600">连续3次放鸽子自动冻结30天</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">交换机制正常</p>
                <p className="text-xs text-green-600">物主48小时内确认机制</p>
              </div>
            </div>
            <div className="flex items-start p-3 bg-orange-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-500 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">赠送先到先得</p>
                <p className="text-xs text-orange-600">领取码机制已启用</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminItems = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToastMessage } = useUIStore();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async (keyword = '') => {
    setLoading(true);
    try {
      const data = await adminAPI.getItems(1, 20, keyword || undefined);
      setItems(data.list);
      setTotal(data.total);
    } catch (err: any) {
      showToastMessage(err.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!confirm('确定要下架该物品吗？')) return;
    try {
      await adminAPI.removeItem(id, '管理员下架');
      showToastMessage('已下架', 'success');
      fetchItems(searchKeyword);
    } catch (err: any) {
      showToastMessage(err.message || '操作失败', 'error');
    }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: '上架中', color: 'bg-green-100 text-green-700' },
    exchanged: { label: '已交换', color: 'bg-blue-100 text-blue-700' },
    gifted: { label: '已赠送', color: 'bg-orange-100 text-orange-700' },
    removed: { label: '已下架', color: 'bg-red-100 text-red-700' },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">物品管理</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchItems(searchKeyword)}
            placeholder="搜索物品..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物品</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">发布时间</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={item.images?.[0]}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                        />
                        <div className="ml-4">
                          <p className="font-medium text-gray-900 truncate max-w-xs">{item.title}</p>
                          <p className="text-xs text-gray-500">ID: {item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        item.type === 'exchange' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.type === 'exchange' ? '交换' : '赠送'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusMap[item.status]?.color}`}>
                        {statusMap[item.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {timeAgo(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/item/${item.id}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                          title="查看"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {item.status === 'active' && (
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="下架"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToastMessage } = useUIStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (keyword = '') => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsers(1, 20, keyword || undefined);
      setUsers(data.list);
      setTotal(data.total);
    } catch (err: any) {
      showToastMessage(err.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFreeze = async (id: number, isFrozen: boolean) => {
    const reason = isFrozen ? '解冻' : '违规操作冻结30天';
    if (!isFrozen && !confirm(`确定要冻结该用户30天吗？`)) return;
    try {
      await adminAPI.freezeUser(id, isFrozen ? 0 : 30, reason);
      showToastMessage(isFrozen ? '已解冻' : '已冻结', 'success');
      fetchUsers(searchKeyword);
    } catch (err: any) {
      showToastMessage(err.message || '操作失败', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers(searchKeyword)}
            placeholder="搜索用户..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">信用分</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">放鸽子</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={user.avatar}
                          alt=""
                          className="w-10 h-10 rounded-full bg-gray-100"
                        />
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{user.username}</p>
                          <p className="text-xs text-gray-500">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`font-medium ${
                          user.creditScore >= 90 ? 'text-green-600' :
                          user.creditScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {user.creditScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${user.noShowCount > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                        {user.noShowCount} 次
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isFrozen ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          已冻结
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          正常
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {timeAgo(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.isFrozen ? (
                        <button
                          onClick={() => handleFreeze(user.id, true)}
                          className="text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          解冻
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFreeze(user.id, false)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center justify-end ml-auto"
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" />
                          冻结
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [handleResult, setHandleResult] = useState('');
  const [showTimeline, setShowTimeline] = useState<'exchange' | 'gift' | null>(null);
  const { showToastMessage } = useUIStore();

  useEffect(() => {
    fetchComplaints();
  }, [filterStatus, filterType, searchKeyword]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const status = filterStatus === 'all' ? undefined : filterStatus;
      const type = filterType === 'all' ? undefined : filterType;
      const data = await adminAPI.getComplaints(1, 50, status, type, searchKeyword || undefined);
      setComplaints(data.list);
    } catch (err: any) {
      showToastMessage(err.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHandle = async (id: number) => {
    if (!handleResult.trim()) {
      showToastMessage('请输入处理结果', 'error');
      return;
    }
    try {
      await adminAPI.handleComplaint(id, handleResult);
      showToastMessage('已处理', 'success');
      setSelectedComplaint(null);
      setHandleResult('');
      setShowTimeline(null);
      fetchComplaints();
    } catch (err: any) {
      showToastMessage(err.message || '操作失败', 'error');
    }
  };

  const filterTabs = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待处理' },
    { value: 'handled', label: '已处理' },
  ];

  const typeOptions = [
    { value: 'all', label: '全部类型' },
    { value: '物品违规', label: '物品违规' },
    { value: '虚假信息', label: '虚假信息' },
    { value: '违禁物品', label: '违禁物品' },
    { value: '放鸽子', label: '放鸽子' },
    { value: '其他', label: '其他' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">投诉管理</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterStatus === tab.value
                    ? 'bg-white text-primary-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索投诉人/被投诉人/描述..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">加载中...</div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-500">暂无投诉记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">投诉人</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">被投诉人</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联物品</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={complaint.reporter?.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full bg-gray-100"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {complaint.reporter?.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={complaint.reportedUser?.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full bg-gray-100"
                        />
                        <span className="ml-2 text-sm text-gray-900">
                          {complaint.reportedUser?.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {complaint.item && (
                        <div className="flex items-center">
                          <img
                            src={complaint.item.images?.[0]}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                          />
                          <span className="ml-2 text-sm text-gray-900 max-w-[150px] truncate">
                            {complaint.item.title}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{complaint.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        complaint.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {complaint.status === 'pending' ? '待处理' : '已处理'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {timeAgo(complaint.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setHandleResult('');
                          setShowTimeline(null);
                        }}
                        className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">投诉详情</h3>
              <button
                onClick={() => {
                  setSelectedComplaint(null);
                  setHandleResult('');
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">投诉人</p>
                  <div className="flex items-center">
                    <img src={selectedComplaint.reporter?.avatar} alt="" className="w-8 h-8 rounded-full" />
                    <span className="ml-2 font-medium">{selectedComplaint.reporter?.username}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">被投诉人</p>
                  <div className="flex items-center">
                    <img src={selectedComplaint.reportedUser?.avatar} alt="" className="w-8 h-8 rounded-full" />
                    <span className="ml-2 font-medium">{selectedComplaint.reportedUser?.username}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">关联物品</p>
                {selectedComplaint.item && (
                  <Link
                    to={`/item/${selectedComplaint.item.id}`}
                    target="_blank"
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <img src={selectedComplaint.item.images?.[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="ml-3 flex-1">
                      <p className="font-medium text-gray-900">{selectedComplaint.item.title}</p>
                      <p className="text-xs text-gray-500">点击查看物品详情</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                )}
              </div>

              {(selectedComplaint.relatedExchange || selectedComplaint.relatedGiftRequest) && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">履约时间线</p>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    {selectedComplaint.relatedExchange && (
                      <button
                        onClick={() => setShowTimeline('exchange')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center ${
                          showTimeline === 'exchange' || !showTimeline
                            ? 'bg-white text-primary-600 shadow'
                            : 'text-gray-600'
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        交换记录
                      </button>
                    )}
                    {selectedComplaint.relatedGiftRequest && (
                      <button
                        onClick={() => setShowTimeline('gift')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center ${
                          showTimeline === 'gift'
                            ? 'bg-white text-primary-600 shadow'
                            : 'text-gray-600'
                        }`}
                      >
                        <Gift className="w-3.5 h-3.5 mr-1" />
                        赠送记录
                      </button>
                    )}
                  </div>
                  {(!showTimeline || showTimeline === 'exchange') && selectedComplaint.relatedExchange && (
                    <div className="mt-3 border border-gray-100 rounded-xl p-4 max-h-80 overflow-y-auto">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          状态：
                          <span className={`ml-1 px-2 py-0.5 rounded text-xs ${exchangeStatusColor[selectedComplaint.relatedExchange.status]}`}>
                            {exchangeStatusLabel[selectedComplaint.relatedExchange.status]}
                          </span>
                        </span>
                        {selectedComplaint.relatedExchange.meetLocation && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {selectedComplaint.relatedExchange.meetLocation}
                          </span>
                        )}
                      </div>
                      {(selectedComplaint.relatedExchange.timeline || []).length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-4">暂无时间线记录</p>
                      ) : (
                        (selectedComplaint.relatedExchange.timeline || []).map((e: any, idx: number, arr: any[]) =>
                          renderTimelineItemAdmin(e, idx === arr.length - 1)
                        )
                      )}
                    </div>
                  )}
                  {showTimeline === 'gift' && selectedComplaint.relatedGiftRequest && (
                    <div className="mt-3 border border-gray-100 rounded-xl p-4 max-h-80 overflow-y-auto">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          状态：
                          <span className={`ml-1 px-2 py-0.5 rounded text-xs ${giftStatusColor[selectedComplaint.relatedGiftRequest.status]}`}>
                            {giftStatusLabel[selectedComplaint.relatedGiftRequest.status]}
                          </span>
                        </span>
                        {selectedComplaint.relatedGiftRequest.pickupCode && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded font-medium">
                            领取码：{selectedComplaint.relatedGiftRequest.pickupCode}
                          </span>
                        )}
                      </div>
                      {(selectedComplaint.relatedGiftRequest.timeline || []).length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-4">暂无时间线记录</p>
                      ) : (
                        (selectedComplaint.relatedGiftRequest.timeline || []).map((e: any, idx: number, arr: any[]) =>
                          renderTimelineItemAdmin(e, idx === arr.length - 1)
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 mb-1">投诉类型</p>
                <p className="font-medium text-gray-900">{selectedComplaint.type}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">投诉原因</p>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.handleResult && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">处理结果</p>
                  <p className="text-gray-700 bg-blue-50 rounded-lg p-3">{selectedComplaint.handleResult}</p>
                </div>
              )}

              {selectedComplaint.status === 'pending' && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">处理结果</p>
                  <textarea
                    value={handleResult}
                    onChange={(e) => setHandleResult(e.target.value)}
                    placeholder="请输入处理结果..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedComplaint(null);
                  setHandleResult('');
                }}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                关闭
              </button>
              {selectedComplaint.status === 'pending' && (
                <button
                  onClick={() => handleHandle(selectedComplaint.id)}
                  className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                >
                  确认处理
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
