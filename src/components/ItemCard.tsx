import { Link } from 'react-router-dom';
import { Heart, MapPin, Clock, RefreshCw, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Item } from '../../shared/types';
import { conditionLabel, conditionColor, timeAgo } from '@/utils';
import { itemsAPI } from '@/api';
import { useAuthStore } from '@/store';
import { useUIStore } from '@/store';

interface ItemCardProps {
  item: Item;
}

const ItemCard = ({ item }: ItemCardProps) => {
  const { isAuthenticated } = useAuthStore();
  const { showToastMessage } = useUIStore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !checkingFavorite) {
      checkFavoriteStatus();
    }
  }, [isAuthenticated, item.id]);

  const checkFavoriteStatus = async () => {
    setCheckingFavorite(true);
    try {
      const result = await itemsAPI.checkFavorite(item.id);
      setIsFavorite(result.isFavorite);
    } catch {}
    setCheckingFavorite(false);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      showToastMessage('请先登录', 'error');
      return;
    }

    try {
      const result = await itemsAPI.toggleFavorite(item.id);
      setIsFavorite(result.isFavorite);
      showToastMessage(result.isFavorite ? '收藏成功' : '已取消收藏', 'success');
    } catch (err: any) {
      showToastMessage(err.message || '操作失败', 'error');
    }
  };

  return (
    <Link
      to={`/item/${item.id}`}
      className="group bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col"
    >
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {!imageError ? (
          <img
            src={item.images?.[0]}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
            暂无图片
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            item.type === 'exchange' 
              ? 'bg-blue-500 text-white' 
              : 'bg-orange-500 text-white'
          }`}>
            {item.type === 'exchange' ? (
              <><RefreshCw className="w-3 h-3 mr-1" />交换</>
            ) : (
              <><Gift className="w-3 h-3 mr-1" />免费送</>
            )}
          </span>
        </div>

        <button
          onClick={handleFavorite}
          className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
            }`}
          />
        </button>

        <div className={`absolute bottom-3 right-3 px-2 py-1 rounded-md text-xs font-medium ${conditionColor[item.condition]}`}>
          {conditionLabel[item.condition]}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
          {item.title}
        </h3>

        {item.type === 'exchange' && item.expectedCategory && (
          <div className="text-xs text-gray-500 mb-2">
            想换：<span className="text-primary-600">{item.expectedCategory}</span>
          </div>
        )}

        <div className="mt-auto space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
              <span>{timeAgo(item.createdAt)}</span>
            </div>
            {item.viewCount !== undefined && (
              <span>{item.viewCount} 浏览</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
