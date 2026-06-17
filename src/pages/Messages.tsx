import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Toast from '@/components/Toast';
import { messagesAPI } from '@/api';
import { useAuthStore } from '@/store';
import type { Message } from '../../shared/types';
import {
  Bell,
  RefreshCw,
  Gift,
  MessageCircle,
  Star,
  Check,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { timeAgo } from '@/utils';

const Messages = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeType, setActiveType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchMessages();
  }, [isAuthenticated, navigate, activeType]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const type = activeType === 'all' ? undefined : activeType;
      const data = await messagesAPI.getList(type);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await messagesAPI.markAllRead();
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await messagesAPI.markRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const typeTabs = [
    { value: 'all', label: '全部', icon: Bell },
    { value: 'exchange', label: '交换', icon: RefreshCw },
    { value: 'gift', label: '赠送', icon: Gift },
    { value: 'review', label: '评价', icon: Star },
    { value: 'system', label: '系统', icon: Bell },
  ];

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'exchange': return RefreshCw;
      case 'gift': return Gift;
      case 'review': return Star;
      case 'system': return Bell;
      default: return MessageCircle;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'exchange': return 'bg-blue-100 text-blue-600';
      case 'gift': return 'bg-orange-100 text-orange-600';
      case 'review': return 'bg-yellow-100 text-yellow-600';
      case 'system': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showSearch={false} />
      <Toast />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">消息中心</h1>
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
          >
            <Check className="w-4 h-4 mr-1" />
            全部已读
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden mb-6">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {typeTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveType(tab.value)}
                  className={`flex items-center space-x-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeType === tab.value
                      ? 'text-primary-600 border-primary-500'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border-b border-gray-100 animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">暂无消息</h3>
            <p className="text-gray-400 text-sm">有新消息会在这里显示</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            {messages.map((message) => {
              const Icon = getMessageIcon(message.type);
              return (
                <div
                  key={message.id}
                  onClick={() => handleMarkRead(message.id)}
                  className={`p-4 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !message.isRead ? 'bg-primary-50/50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getMessageColor(message.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-medium ${!message.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                          {message.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {!message.isRead && (
                            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                          )}
                          <span className="text-xs text-gray-400">
                            {timeAgo(message.createdAt)}
                          </span>
                        </div>
                      </div>
                      {message.content && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {message.content}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
