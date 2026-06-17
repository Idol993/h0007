export const conditionLabel: Record<string, string> = {
  new: '全新',
  like_new: '99新',
  good: '9成新',
  fair: '7成新',
  poor: '有瑕疵',
};

export const typeLabel: Record<string, string> = {
  exchange: '交换',
  gift: '免费赠送',
};

export const conditionColor: Record<string, string> = {
  new: 'bg-green-100 text-green-700',
  like_new: 'bg-blue-100 text-blue-700',
  good: 'bg-yellow-100 text-yellow-700',
  fair: 'bg-orange-100 text-orange-700',
  poor: 'bg-gray-100 text-gray-700',
};

export const exchangeStatusLabel: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  rejected: '已拒绝',
  negotiating: '协商中',
  completed: '已完成',
  cancelled: '已取消',
  no_show: '放鸽子',
};

export const exchangeStatusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  negotiating: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
  no_show: 'bg-red-200 text-red-800',
};

export const giftStatusLabel: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  cancelled: '已取消',
  completed: '已完成',
};

export const giftStatusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
  completed: 'bg-blue-100 text-blue-700',
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const timeAgo = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return formatDate(d).split(' ')[0];
};

export const formatDistance = (km?: number): string => {
  if (!km) return '';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};

export const getInitials = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

export const getRatingStars = (rating: number): string => {
  const fullStars = Math.floor(rating);
  return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
};
