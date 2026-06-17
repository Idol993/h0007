import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import ItemCard from '@/components/ItemCard';
import { usersAPI, exchangesAPI } from '@/api';
import { useAuthStore } from '@/store';
import type { User, Item, Exchange } from '../../shared/types';
import {
  User as UserIcon,
  Package,
  RefreshCw,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  Star,
  AlertTriangle,
  MapPin,
  Calendar,
  Gift,
} from 'lucide-react';
import { exchangeStatusLabel, exchangeStatusColor, timeAgo } from '@/utils';

const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isAuthenticated, logout } = useAuthStore();
  const [profileUser, setProfileUser] = useState<(User & { itemCount?: number; exchangeCount?: number }) | null>(null);
  const [activeTab, setActiveTab] = useState('items');
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [favorites, setFavorites] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !id || (currentUser && currentUser.id === parseInt(id));
  const userId = id ? parseInt(id) : currentUser?.id;

  useEffect(() => {
    if (!isAuthenticated && !id) {
      navigate('/login');
      return;
    }
    if (userId) {
      fetchProfile();
    }
  }, [userId, isAuthenticated, navigate, id]);

  useEffect(() => {
    if (userId && activeTab === 'items') {
      fetchUserItems();
    }
    if (userId && activeTab === 'exchanges' && isOwnProfile) {
      fetchExchanges();
    }
    if (activeTab === 'favorites' && isOwnProfile) {
      fetchFavorites();
    }
  }, [userId, activeTab, isOwnProfile]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await usersAPI.getProfile(userId!);
      setProfileUser(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserItems = async () => {
    try {
      const data = await usersAPI.getUserItems(userId!, 'active');
      setUserItems(data);
    } catch (err) {
      console.error('Failed to fetch user items:', err);
    }
  };

  const fetchExchanges = async () => {
    try {
      const data = await exchangesAPI.getList();
      setExchanges(data);
    } catch (err) {
      console.error('Failed to fetch exchanges:', err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const data = await usersAPI.getFavorites();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showSearch={false} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl h-48 mb-6"></div>
            <div className="bg-white rounded-xl h-96"></div>
          </div>
        </div>
        <Toast />
      </div>
    );
  }

  const menuItems = isOwnProfile ? [
    { icon: Package, label: '我的发布', value: 'items', count: profileUser?.itemCount || 0 },
    { icon: RefreshCw, label: '交换记录', value: 'exchanges', count: profileUser?.exchangeCount || 0 },
    { icon: Heart, label: '我的收藏', value: 'favorites' },
    { icon: Settings, label: '账号设置', value: 'settings' },
  ] : [
    { icon: Package, label: 'TA的发布', value: 'items', count: profileUser?.itemCount || 0 },
    { icon: RefreshCw, label: '交换记录', value: 'exchanges', count: profileUser?.exchangeCount || 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showSearch={false} />
      <Toast />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative flex items-center space-x-5">
            {profileUser?.avatar ? (
              <img
                src={profileUser.avatar}
                alt=""
                className="w-20 h-20 rounded-full border-4 border-white/30 bg-white"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <UserIcon className="w-10 h-10 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{profileUser?.username}</h1>
              <div className="flex items-center space-x-4 text-sm text-white/80">
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 fill-yellow-300 text-yellow-300" />
                  信用分 {profileUser?.creditScore}
                </div>
                {profileUser?.noShowCount !== undefined && profileUser.noShowCount > 0 && (
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    放鸽子 {profileUser.noShowCount} 次
                  </div>
                )}
              </div>
              {profileUser?.isFrozen && (
                <div className="mt-2 text-sm bg-red-500/30 px-3 py-1 rounded-full inline-block">
                  ⚠️ 账号已冻结
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              {menuItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${
                    activeTab === item.value
                      ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-500'
                      : 'hover:bg-gray-50 text-gray-700 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center">
                    {item.count !== undefined && (
                      <span className="text-sm text-gray-400 mr-2">{item.count}</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}

              {isOwnProfile && currentUser?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 text-gray-700 border-t border-gray-100"
                >
                  <div className="flex items-center">
                    <Settings className="w-5 h-5 mr-3" />
                    <span className="font-medium">管理后台</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              )}

              {isOwnProfile && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-5 py-4 hover:bg-red-50 text-red-500 border-t border-gray-100"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span className="font-medium">退出登录</span>
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {menuItems.find(m => m.value === activeTab)?.label}
              </h2>

              {activeTab === 'items' && (
                <>
                  {userItems.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">📦</div>
                      <p className="text-gray-500">暂无发布的物品</p>
                      {isOwnProfile && (
                        <Link
                          to="/publish"
                          className="inline-block mt-4 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                          去发布
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {userItems.map((item) => (
                        <ItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'exchanges' && (
                <>
                  {exchanges.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">🔄</div>
                      <p className="text-gray-500">暂无交换记录</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {exchanges.map((exchange) => {
                        const isRequester = exchange.requesterId === currentUser?.id;
                        const otherUser = isRequester ? exchange.owner : exchange.requester;
                        return (
                          <div
                            key={exchange.id}
                            className="border border-gray-100 rounded-xl p-4 hover:border-primary-200 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                                  {exchange.item?.images?.[0] && (
                                    <img src={exchange.item.images[0]} alt="" className="w-full h-full object-cover" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{exchange.item?.title}</div>
                                  <div className="text-sm text-gray-500 flex items-center mt-1">
                                    <UserIcon className="w-3 h-3 mr-1" />
                                    {isRequester ? '向' : '来自'} {otherUser?.username}
                                    <span className="mx-2">·</span>
                                    {timeAgo(exchange.createdAt)}
                                  </div>
                                </div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${exchangeStatusColor[exchange.status]}`}>
                                {exchangeStatusLabel[exchange.status]}
                              </span>
                            </div>
                            {exchange.meetLocation && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {exchange.meetLocation}
                                {exchange.meetTime && (
                                  <>
                                    <span className="mx-2">·</span>
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {timeAgo(exchange.meetTime)}
                                  </>
                                )}
                              </div>
                            )}
                            {exchange.message && (
                              <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                {exchange.message}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'favorites' && (
                <>
                  {favorites.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">❤️</div>
                      <p className="text-gray-500">暂无收藏的物品</p>
                      <Link
                        to="/"
                        className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
                      >
                        去逛逛 →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {favorites.map((item) => (
                        <ItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">⚙️</div>
                    <p className="text-gray-500">账号设置功能开发中...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
