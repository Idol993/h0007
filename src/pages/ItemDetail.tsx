import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import { itemsAPI, exchangesAPI, giftsAPI, adminAPI } from '@/api';
import { useAuthStore, useUIStore } from '@/store';
import type { Item } from '../../shared/types';
import {
  MapPin,
  Clock,
  Eye,
  Heart,
  Share2,
  RefreshCw,
  Gift,
  ChevronLeft,
  ChevronRight,
  Star,
  User,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { conditionLabel, conditionColor, timeAgo, typeLabel } from '@/utils';

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { showToastMessage } = useUIStore();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [message, setMessage] = useState('');
  const [complaintType, setComplaintType] = useState('物品违规');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchItem();
    }
  }, [id]);

  const fetchItem = async () => {
    setLoading(true);
    try {
      const data = await itemsAPI.getDetail(parseInt(id!));
      setItem(data);
      
      if (isAuthenticated) {
        try {
          const fav = await itemsAPI.checkFavorite(parseInt(id!));
          setIsFavorite(fav.isFavorite);
        } catch {}
      }
    } catch (err: any) {
      showToastMessage(err.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const result = await itemsAPI.toggleFavorite(parseInt(id!));
      setIsFavorite(result.isFavorite);
      showToastMessage(result.isFavorite ? '收藏成功' : '已取消收藏', 'success');
    } catch (err: any) {
      showToastMessage(err.message || '操作失败', 'error');
    }
  };

  const handleExchange = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await exchangesAPI.create({
        itemId: parseInt(id!),
        message,
      });
      showToastMessage('交换申请已发送，请等待物主确认', 'success');
      setShowExchangeModal(false);
      setMessage('');
    } catch (err: any) {
      showToastMessage(err.message || '申请失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGiftRequest = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await giftsAPI.createRequest({
        itemId: parseInt(id!),
        message,
      });
      showToastMessage('领取申请已发送，请等待物主确认', 'success');
      setShowGiftModal(false);
      setMessage('');
    } catch (err: any) {
      showToastMessage(err.message || '申请失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplaint = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!complaintDescription.trim()) {
      showToastMessage('请填写投诉原因', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await adminAPI.createComplaint({
        reportedUserId: item!.ownerId,
        itemId: parseInt(id!),
        type: complaintType,
        description: complaintDescription,
      });
      showToastMessage('投诉已提交，管理员会尽快处理', 'success');
      setShowComplaintModal(false);
      setComplaintType('物品违规');
      setComplaintDescription('');
    } catch (err: any) {
      showToastMessage(err.message || '投诉提交失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showSearch={false} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="aspect-video bg-gray-200"></div>
              <div className="p-6 space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <Toast />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showSearch={false} />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-medium text-gray-600 mb-2">物品不存在</h2>
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-700"
          >
            返回首页
          </button>
        </div>
        <Toast />
      </div>
    );
  }

  const isOwner = user?.id === item.ownerId;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Navbar showSearch={false} />
      <Toast />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          返回
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl overflow-hidden shadow-card">
              <div className="relative aspect-[4/3] bg-gray-100">
                <img
                  src={item.images?.[currentImageIndex] || item.images?.[0]}
                  alt={item.title}
                  className="w-full h-full object-contain"
                />
                
                {item.images && item.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(i => (i - 1 + item.images!.length) % item.images!.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(i => (i + 1) % item.images!.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-700" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                      {item.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImageIndex(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {item.images && item.images.length > 1 && (
                <div className="p-4 border-t border-gray-100">
                  <div className="flex space-x-2 overflow-x-auto">
                    {item.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                          i === currentImageIndex ? 'border-primary-500' : 'border-transparent'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.type === 'exchange' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {item.type === 'exchange' ? (
                        <><RefreshCw className="w-3 h-3 mr-1" />可交换</>
                      ) : (
                        <><Gift className="w-3 h-3 mr-1" />免费赠送</>
                      )}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${conditionColor[item.condition]}`}>
                      {conditionLabel[item.condition]}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {item.category}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {item.viewCount} 浏览
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {timeAgo(item.createdAt)}发布
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {item.location}
                </div>
              </div>

              {item.type === 'exchange' && item.expectedCategory && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center text-blue-700">
                    <RefreshCw className="w-5 h-5 mr-2" />
                    <span className="font-medium">期望交换：</span>
                    <span className="ml-2">{item.expectedCategory}</span>
                  </div>
                </div>
              )}

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">物品描述</h3>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-card p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">物主信息</h3>
              <Link to={`/user/${item.ownerId}`} className="flex items-center space-x-3 mb-4">
                {item.owner?.avatar ? (
                  <img src={item.owner.avatar} alt="" className="w-12 h-12 rounded-full bg-gray-100" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900">{item.owner?.username}</div>
                  <div className="flex items-center text-sm text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 text-gray-600">信用分 {item.owner?.creditScore}</span>
                  </div>
                </div>
              </Link>

              <div className="grid grid-cols-2 gap-3 text-center text-sm mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-semibold text-gray-900">--</div>
                  <div className="text-gray-500">发布物品</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-semibold text-gray-900">--</div>
                  <div className="text-gray-500">完成交换</div>
                </div>
              </div>

              {!isOwner && (
                <div className="space-y-3">
                  {item.type === 'exchange' ? (
                    <button
                      onClick={() => setShowExchangeModal(true)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      发起交换
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowGiftModal(true)}
                      className="w-full bg-accent-500 hover:bg-accent-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center"
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      立即领取
                    </button>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={handleFavorite}
                      className={`flex-1 py-2.5 rounded-xl border font-medium transition-colors flex items-center justify-center ${
                        isFavorite
                          ? 'border-red-200 bg-red-50 text-red-500'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className={`w-5 h-5 mr-1 ${isFavorite ? 'fill-current' : ''}`} />
                      收藏
                    </button>
                    <button className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors flex items-center justify-center">
                      <Share2 className="w-5 h-5 mr-1" />
                      分享
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        navigate('/login');
                        return;
                      }
                      setShowComplaintModal(true);
                    }}
                    className="w-full py-2 text-sm text-gray-500 hover:text-red-500 flex items-center justify-center transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    举报物品
                  </button>
                </div>
              )}

              {isOwner && (
                <div className="text-center text-sm text-gray-500">
                  这是您发布的物品
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showExchangeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">发起交换申请</h3>
            <p className="text-gray-600 text-sm mb-4">
              向物主发送交换申请，物主将在48小时内确认。您可以留言说明您想交换的物品。
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="留言给物主（可选），比如您有什么物品想交换..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowExchangeModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleExchange}
                disabled={submitting}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? '发送中...' : '发送申请'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGiftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">申请领取</h3>
            <p className="text-gray-600 text-sm mb-4">
              免费物品采用先到先得原则，物主确认后您将获得领取码。
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="留言给物主（可选）..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
            />
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowGiftModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleGiftRequest}
                disabled={submitting}
                className="flex-1 bg-accent-500 hover:bg-accent-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? '提交中...' : '确认领取'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">举报物品</h3>
            <p className="text-gray-600 text-sm mb-4">
              请选择举报类型并详细描述问题，管理员会尽快处理。
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">举报类型</label>
                <select
                  value={complaintType}
                  onChange={(e) => setComplaintType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="物品违规">物品违规</option>
                  <option value="虚假信息">虚假信息</option>
                  <option value="违禁物品">违禁物品</option>
                  <option value="放鸽子">放鸽子</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">投诉原因</label>
                <textarea
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  placeholder="请详细描述投诉原因..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowComplaintModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleComplaint}
                disabled={submitting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? '提交中...' : '提交投诉'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail;
