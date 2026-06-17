import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, MessageCircle, User, Menu, X, Bell } from 'lucide-react';
import { useAuthStore } from '@/store';
import { messagesAPI } from '@/api';

interface NavbarProps {
  onSearch?: (keyword: string) => void;
  searchValue?: string;
  showSearch?: boolean;
}

const Navbar = ({ onSearch, searchValue = '', showSearch = true }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchValue);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      messagesAPI.getUnreadCount().then(data => setUnreadCount(data.count)).catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchInput);
    } else {
      navigate(`/?keyword=${encodeURIComponent(searchInput)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handlePublishClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/publish');
  };

  return (
    <nav className="bg-primary-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold text-lg">换</span>
              </div>
              <span className="text-xl font-bold hidden sm:block">邻里互换</span>
            </Link>
          </div>

          {showSearch && (
            <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4 hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="搜索物品、分类..."
                  className="w-full px-4 py-2 pl-10 rounded-full text-gray-800 bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </form>
          )}

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={handlePublishClick}
              className="flex items-center space-x-1 bg-accent-500 hover:bg-accent-600 text-white px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all hover:shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">发布</span>
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/messages"
                  className="relative p-2 hover:bg-primary-700 rounded-full transition-colors"
                >
                  <MessageCircle className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="hidden sm:block">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 hover:bg-primary-700 px-3 py-2 rounded-lg transition-colors"
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-full bg-white" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <span className="text-sm">{user?.username}</span>
                  </Link>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden p-2 hover:bg-primary-700 rounded-full"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-white/90 hover:text-white text-sm font-medium"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>

        {showSearch && (
          <form onSubmit={handleSearch} className="md:hidden pb-3">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜索物品、分类..."
                className="w-full px-4 py-2 pl-10 rounded-full text-gray-800 bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </form>
        )}

        {mobileMenuOpen && isAuthenticated && (
          <div className="sm:hidden pb-4 space-y-2 animate-fade-in">
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 hover:bg-primary-700 rounded-lg"
            >
              个人中心
            </Link>
            <Link
              to="/messages"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 hover:bg-primary-700 rounded-lg flex items-center justify-between"
            >
              消息中心
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 hover:bg-primary-700 rounded-lg"
              >
                管理后台
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-primary-700 rounded-lg text-red-200"
            >
              退出登录
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
