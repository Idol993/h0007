import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import ItemCard from '@/components/ItemCard';
import { usersAPI, exchangesAPI, giftsAPI } from '@/api';
import { useAuthStore, useUIStore } from '@/store';
import type { User, Item, Exchange, GiftRequest, TimelineEvent } from '../../shared/types';
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
  X,
  CheckCircle,
  Clock,
  MessageSquare,
  FileText,
  CheckSquare,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { exchangeStatusLabel, exchangeStatusColor, timeAgo, giftStatusLabel, giftStatusColor } from '@/utils';

const REVIEW_TAGS = [
  '守时',
  '物品描述真实',
  '沟通顺畅',
  '态度友好',
  '包装完好',
  '值得信赖',
  '需要改进',
];

const timelineIconMap: Record<string, any> = {
  exchange_created: RefreshCw,
  exchange_confirmed: CheckCircle,
  exchange_rejected: X,
  exchange_negotiated: MessageSquare,
  exchange_completed_one: Clock,
  exchange_completed_both: CheckSquare,
  exchange_reviewed: Star,
  exchange_no_show: AlertTriangle,
  gift_created: Gift,
  gift_confirmed: CheckCircle,
  gift_cancelled: X,
  gift_expired: AlertTriangle,
  gift_completed: CheckSquare,
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

const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isAuthenticated, logout } = useAuthStore();
  const { showToastMessage } = useUIStore();
  const [profileUser, setProfileUser] = useState<(User & { itemCount?: number; exchangeCount?: number }) | null>(null);
  const [activeTab, setActiveTab] = useState('items');
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [favorites, setFavorites] = useState<Item[]>([]);
  const [giftRequests, setGiftRequests] = useState<GiftRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [subAction, setSubAction] = useState('exchanges');
  const [showNegotiateModal, setShowNegotiateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const [negotiateTime, setNegotiateTime] = useState('');
  const [negotiateLocation, setNegotiateLocation] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineExchange, setTimelineExchange] = useState<Exchange | null>(null);
  const [timelineGift, setTimelineGift] = useState<GiftRequest | null>(null);
  const [userReviews, setUserReviews] = useState<{ list: any[]; total: number; avgRating: number } | null>(null);
  const [reviewGift, setReviewGift] = useState<GiftRequest | null>(null);

  const isOwnProfile = !id || (currentUser && currentUser.id === parseInt(id));
  const userId = id ? parseInt(id) : currentUser?.id;

  useEffect(() => {
    if (!isAuthenticated && !id) {
      navigate('/login');
      return;
    }
    if (userId) {
      fetchProfile();
      fetchReviews();
    }
  }, [userId, isAuthenticated, navigate, id]);

  useEffect(() => {
    if (userId && activeTab === 'items') {
      fetchUserItems();
    }
    if (activeTab === 'exchanges' && isOwnProfile) {
      if (subAction === 'exchanges') {
        fetchExchanges();
      } else if (subAction === 'giftRequests') {
        fetchGiftRequests();
      }
    }
    if (activeTab === 'favorites' && isOwnProfile) {
      fetchFavorites();
    }
  }, [userId, activeTab, isOwnProfile, subAction]);

  const fetchReviews = async () => {
    try {
      const data = await usersAPI.getUserReviews(userId!);
      setUserReviews(data);
    } catch {}
  };

  const fetchGiftRequests = async () => {
    try {
      const data = await giftsAPI.getRequests();
      setGiftRequests(data);
    } catch (err) {
      console.error('Failed to fetch gift requests:', err);
    }
  };

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

  const openNegotiateModal = (exchange: Exchange) => {
    setSelectedExchange(exchange);
    setNegotiateTime(exchange.meetTime || '');
    setNegotiateLocation(exchange.meetLocation || '');
    setShowNegotiateModal(true);
  };

  const handleNegotiate = async () => {
    if (!selectedExchange) return;
    if (!negotiateTime.trim() || !negotiateLocation.trim()) {
      showToastMessage('请填写见面时间和地点', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await exchangesAPI.negotiate(selectedExchange.id, {
        meetTime: negotiateTime,
        meetLocation: negotiateLocation,
      });
      showToastMessage('已更新见面信息', 'success');
      setShowNegotiateModal(false);
      fetchExchanges();
    } catch (err: any) {
      showToastMessage(err.message || '操作失败', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmExchange = async (exchange: Exchange) => {
    if (!confirm('确认交换已完成吗？')) return;
    setActionLoading(true);
    try {
      await exchangesAPI.complete(exchange.id);
      showToastMessage('已确认完成', 'success');
      fetchExchanges();
    } catch (err: any) {
      showToastMessage(err.message || '操作失败', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewModal = (exchange: Exchange) => {
    setSelectedExchange(exchange);
    setReviewGift(null);
    setReviewRating(5);
    setReviewComment('');
    setReviewTags([]);
    setShowReviewModal(true);
  };

  const toggleTag = (tag: string) => {
    setReviewTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleReview = async () => {
    if (!selectedExchange) return;
    setActionLoading(true);
    try {
      await exchangesAPI.review(selectedExchange.id, {
        rating: reviewRating,
        tags: reviewTags,
        comment: reviewComment,
      });
      showToastMessage('评价成功', 'success');
      setShowReviewModal(false);
      fetchExchanges();
      fetchReviews();
    } catch (err: any) {
      showToastMessage(err.message || '操作失败', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openTimelineExchange = (exchange: Exchange) => {
    setTimelineExchange(exchange);
    setTimelineGift(null);
    setShowTimeline(true);
  };

  const openTimelineGift = (gift: GiftRequest) => {
    setTimelineGift(gift);
    setTimelineExchange(null);
    setShowTimeline(true);
  };

  const renderTimelineItem = (event: TimelineEvent, isLast: boolean) => {
    const Icon = timelineIconMap[event.type] || FileText;
    const label = timelineLabelMap[event.type] || '操作';
    const operatorName = (event as any).operator?.username || '系统';

    return (
      <div key={event.id} className="relative pl-8 pb-5">
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
          {event.type === 'gift_created' && event.content && (
            <div className="text-sm text-gray-600 bg-white rounded p-2 mt-1">申请留言：{event.content}</div>
          )}
        </div>
      </div>
    );
  };

  const handleConfirmGift = async (request: GiftRequest) => {
    if (!confirm('确认赠送并生成领取码？确认后其他申请将自动失效')) return;
    setActionLoading(true);
    try {
      const result = await giftsAPI.confirmRequest(request.id);
      showToastMessage(`已确认！领取码：${result.pickupCode}`, 'success');
      fetchGiftRequests();
    } catch (err: any) {
      showToastMessage(err.message || '操作失败', 'error');
    } finally {
      setActionLoading(false);
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
    { icon: Star, label: '信用评价', value: 'reviews', count: userReviews?.total || 0 },
    { icon: Settings, label: '账号设置', value: 'settings' },
  ] : [
    { icon: Package, label: 'TA的发布', value: 'items', count: profileUser?.itemCount || 0 },
    { icon: Star, label: 'TA的评价', value: 'reviews', count: userReviews?.total || 0 },
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
                  <div className="flex space-x-2 mb-4">
                    <button
                      onClick={() => setSubAction('exchanges')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        subAction === 'exchanges'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      交换记录
                    </button>
                    <button
                      onClick={() => setSubAction('giftRequests')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        subAction === 'giftRequests'
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      赠送领取
                    </button>
                  </div>

                  {subAction === 'exchanges' && (
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
                            const myCompleted = isRequester ? exchange.requesterCompleted : exchange.ownerCompleted;
                            const otherCompleted = isRequester ? exchange.ownerCompleted : exchange.requesterCompleted;
                            const myRating = isRequester ? exchange.requesterRating : exchange.ownerRating;
                            const canNegotiate = exchange.status === 'confirmed' || exchange.status === 'negotiating';
                            const canComplete = exchange.status === 'negotiating' || exchange.status === 'confirmed';
                            const canReview = exchange.status === 'completed' && myRating === undefined;
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
                                    {myCompleted && !otherCompleted && exchange.status !== 'completed'
                                      ? '等待对方确认'
                                      : exchangeStatusLabel[exchange.status]}
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
                                        {exchange.meetTime}
                                      </>
                                    )}
                                  </div>
                                )}
                                {exchange.message && (
                                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                    {exchange.message}
                                  </div>
                                )}
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {canNegotiate && (
                                    <button
                                      onClick={() => openNegotiateModal(exchange)}
                                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center"
                                    >
                                      <MessageSquare className="w-4 h-4 mr-1" />
                                      协商见面
                                    </button>
                                  )}
                                  {canComplete && !myCompleted && (
                                    <button
                                      onClick={() => handleConfirmExchange(exchange)}
                                      disabled={actionLoading}
                                      className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      确认完成
                                    </button>
                                  )}
                                  {canReview && (
                                    <button
                                      onClick={() => openReviewModal(exchange)}
                                      className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors flex items-center"
                                    >
                                      <Star className="w-4 h-4 mr-1" />
                                      去评价
                                    </button>
                                  )}
                                  {myRating !== undefined && (
                                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm">
                                      已评价：{'★'.repeat(myRating)}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => openTimelineExchange(exchange)}
                                    className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center"
                                  >
                                    <Clock className="w-4 h-4 mr-1" />
                                    履约时间线
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {subAction === 'giftRequests' && (
                    <>
                      {giftRequests.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-5xl mb-3">🎁</div>
                          <p className="text-gray-500">暂无赠送领取请求</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {giftRequests.map((request) => {
                            const isOwner = request.item?.ownerId === currentUser?.id;
                            return (
                              <div
                                key={request.id}
                                className="border border-gray-100 rounded-xl p-4 hover:border-primary-200 transition-colors"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                                      {request.item?.images?.[0] && (
                                        <img src={request.item.images[0]} alt="" className="w-full h-full object-cover" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">{request.item?.title}</div>
                                      <div className="text-sm text-gray-500 flex items-center mt-1">
                                        <UserIcon className="w-3 h-3 mr-1" />
                                        {isOwner ? `申请人：${request.requester?.username}` : `物主：${request.item?.owner?.username}`}
                                        <span className="mx-2">·</span>
                                        {timeAgo(request.createdAt)}
                                      </div>
                                    </div>
                                  </div>
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${giftStatusColor[request.status]}`}>
                                    {giftStatusLabel[request.status]}
                                  </span>
                                </div>
                                {request.pickupCode && (
                                  <div className="bg-green-50 rounded-lg p-3 mb-3">
                                    <p className="text-sm text-green-700 font-medium">
                                      领取码：<span className="text-lg font-bold">{request.pickupCode}</span>
                                    </p>
                                  </div>
                                )}
                                {request.message && (
                                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                    {request.message}
                                  </div>
                                )}
                                {isOwner && request.status === 'pending' && (
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                      onClick={() => handleConfirmGift(request)}
                                      disabled={actionLoading}
                                      className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                                    >
                                      确认赠送，生成领取码
                                    </button>
                                    <button
                                      onClick={() => openTimelineGift(request)}
                                      className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center"
                                    >
                                      <Clock className="w-4 h-4 mr-1" />
                                      履约时间线
                                    </button>
                                  </div>
                                )}
                                {!(isOwner && request.status === 'pending') && (
                                  <div className="mt-4">
                                    <button
                                      onClick={() => openTimelineGift(request)}
                                      className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center"
                                    >
                                      <Clock className="w-4 h-4 mr-1" />
                                      履约时间线
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
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

              {activeTab === 'reviews' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl font-bold text-gray-900">
                        {userReviews?.avgRating || 0}
                      </div>
                      <div>
                        <div className="flex text-yellow-400 text-lg">
                          {'★'.repeat(Math.round(userReviews?.avgRating || 0))}
                          <span className="text-gray-300">
                            {'★'.repeat(5 - Math.round(userReviews?.avgRating || 0))}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          共 {userReviews?.total || 0} 条评价
                        </p>
                      </div>
                    </div>
                  </div>
                  {!userReviews?.list || userReviews.list.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">⭐</div>
                      <p className="text-gray-500">暂无评价</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userReviews.list.map((review: any) => (
                        <div key={review.id} className="border border-gray-100 rounded-xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <img
                                src={review.fromUser?.avatar}
                                alt=""
                                className="w-9 h-9 rounded-full bg-gray-100"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{review.fromUser?.username}</p>
                                <div className="flex items-center text-xs text-gray-400 space-x-2">
                                  <span className="text-yellow-500">
                                    {'★'.repeat(review.rating)}
                                  </span>
                                  <span>{timeAgo(review.createdAt)}</span>
                                  {review.creditChange !== 0 && (
                                    <span className={review.creditChange > 0 ? 'text-green-600' : 'text-red-600'}>
                                      信用{review.creditChange > 0 ? '+' : ''}{review.creditChange}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          {review.tags && review.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {review.tags.map((tag: string) => (
                                <span
                                  key={tag}
                                  className="text-xs bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {review.comment && (
                            <p className="text-sm text-gray-600">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

      {showNegotiateModal && selectedExchange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">协商见面信息</h3>
              <button
                onClick={() => setShowNegotiateModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  见面时间
                </label>
                <input
                  type="datetime-local"
                  value={negotiateTime}
                  onChange={(e) => setNegotiateTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  见面地点
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={negotiateLocation}
                    onChange={(e) => setNegotiateLocation(e.target.value)}
                    placeholder="请输入见面地点，如：小区门口、咖啡店等"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowNegotiateModal(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleNegotiate}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading ? '提交中...' : '确认更新'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && selectedExchange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">信用评价</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">请为对方打分</p>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= reviewRating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {reviewRating === 1 && '非常不满意'}
                  {reviewRating === 2 && '不满意'}
                  {reviewRating === 3 && '一般'}
                  {reviewRating === 4 && '满意'}
                  {reviewRating === 5 && '非常满意'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择标签（可多选）
                </label>
                <div className="flex flex-wrap gap-2">
                  {REVIEW_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        reviewTags.includes(tag)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  评价内容（选填）
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="说说这次交换的体验..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReview}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading ? '提交中...' : '提交评价'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTimeline && (timelineExchange || timelineGift) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {timelineExchange ? '交换履约时间线' : '赠送领取时间线'}
              </h3>
              <button
                onClick={() => {
                  setShowTimeline(false);
                  setTimelineExchange(null);
                  setTimelineGift(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {(timelineExchange?.timeline?.length === 0 || timelineGift?.timeline?.length === 0) && (
                <div className="text-center py-8 text-gray-400 text-sm">暂无时间线记录</div>
              )}
              {(timelineExchange?.timeline || timelineGift?.timeline || []).map((event, idx, arr) =>
                renderTimelineItem(event as any, idx === arr.length - 1)
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setShowTimeline(false);
                  setTimelineExchange(null);
                  setTimelineGift(null);
                }}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
