import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import { itemsAPI } from '@/api';
import { useAuthStore, useUIStore } from '@/store';
import type { ItemType, ItemCondition, CreateItemRequest } from '../../shared/types';
import {
  Upload,
  X,
  RefreshCw,
  Gift,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { useEffect } from 'react';

const categories = [
  '图书文具',
  '数码产品',
  '家居用品',
  '服装鞋帽',
  '母婴用品',
  '玩具游戏',
  '运动户外',
  '家用电器',
];

const conditions: { value: ItemCondition; label: string }[] = [
  { value: 'new', label: '全新' },
  { value: 'like_new', label: '99新' },
  { value: 'good', label: '9成新' },
  { value: 'fair', label: '7成新' },
  { value: 'poor', label: '有瑕疵' },
];

const sampleImages = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=450&fit=crop',
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&h=450&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=450&fit=crop',
];

const Publish = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { showToastMessage } = useUIStore();
  const [type, setType] = useState<ItemType>('exchange');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('good');
  const [expectedCategory, setExpectedCategory] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (user?.isFrozen) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar showSearch={false} />
        <Toast />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-medium text-gray-600 mb-2">账号已被冻结</h2>
          <p className="text-gray-400 mb-6">您的发布权限已被冻结，解冻后可继续发布</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const handleImageUpload = () => {
    const randomImages = [...sampleImages].sort(() => Math.random() - 0.5).slice(0, 3);
    setImages(prev => [...prev, ...randomImages].slice(0, 6));
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showToastMessage('请填写物品标题', 'error');
      return;
    }
    if (!category) {
      showToastMessage('请选择物品分类', 'error');
      return;
    }
    if (images.length === 0) {
      showToastMessage('请至少上传一张图片', 'error');
      return;
    }
    if (!location.trim()) {
      showToastMessage('请填写物品位置', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const data: CreateItemRequest = {
        title: title.trim(),
        description: description.trim(),
        type,
        category,
        condition,
        images,
        location: location.trim(),
      };

      if (type === 'exchange' && expectedCategory.trim()) {
        data.expectedCategory = expectedCategory.trim();
      }

      const result = await itemsAPI.create(data);
      showToastMessage('发布成功！', 'success');
      setTimeout(() => {
        navigate(`/item/${result.id}`);
      }, 1000);
    } catch (err: any) {
      showToastMessage(err.message || '发布失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Navbar showSearch={false} />
      <Toast />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">发布物品</h1>

        <div className="bg-white rounded-xl shadow-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">选择类型</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setType('exchange')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                type === 'exchange'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center mb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  type === 'exchange' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <RefreshCw className="w-5 h-5" />
                </div>
                <span className="ml-3 font-medium text-gray-900">物品交换</span>
              </div>
              <p className="text-sm text-gray-500">以物换物，互通有无</p>
            </button>

            <button
              onClick={() => setType('gift')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                type === 'gift'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center mb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  type === 'gift' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Gift className="w-5 h-5" />
                </div>
                <span className="ml-3 font-medium text-gray-900">免费赠送</span>
              </div>
              <p className="text-sm text-gray-500">免费送出，传递温暖</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">物品图片</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <button
                onClick={handleImageUpload}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 flex flex-col items-center justify-center text-gray-400 hover:text-primary-500 transition-colors"
              >
                <Upload className="w-6 h-6 mb-1" />
                <span className="text-xs">添加图片</span>
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">最多上传6张图片，点击添加模拟上传</p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6 mb-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              物品标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入物品标题"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              物品分类 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-left focus:ring-2 focus:ring-primary-500 focus:border-transparent flex items-center justify-between transition-all"
              >
                <span className={category ? 'text-gray-900' : 'text-gray-400'}>
                  {category || '请选择分类'}
                </span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>
              {showCategoryDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                        category === cat ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              新旧程度
            </label>
            <div className="flex flex-wrap gap-2">
              {conditions.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCondition(c.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    condition === c.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {type === 'exchange' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                期望交换类别 <span className="text-gray-400 text-xs font-normal">（选填，不做硬性限制）</span>
              </label>
              <input
                type="text"
                value={expectedCategory}
                onChange={(e) => setExpectedCategory(e.target.value)}
                placeholder="如：科幻小说、乐高积木、小家电等"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              物品描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="详细描述物品的使用情况、购买时间、注意事项等..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
              rows={5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              物品位置 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="请填写小区或大致位置"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-100 -mx-4 px-4 py-4 sm:static sm:border-0 sm:px-0 sm:bg-transparent">
          <div className="flex space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? '发布中...' : '立即发布'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Publish;
