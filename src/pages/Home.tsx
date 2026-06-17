import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import CategoryNav from '@/components/CategoryNav';
import ItemCard from '@/components/ItemCard';
import Toast from '@/components/Toast';
import { itemsAPI } from '@/api';
import type { Item, ItemType, ItemCondition } from '../../shared/types';
import { Filter, SortAsc, Grid3X3, List } from 'lucide-react';

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [type, setType] = useState<ItemType | ''>((searchParams.get('type') as ItemType) || '');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const fetchItems = async () => {
    setLoading(true);
    try {
      const result = await itemsAPI.getList({
        page,
        pageSize,
        category: category || undefined,
        type: type || undefined,
        sort: sort as any,
        keyword: keyword || undefined,
      });
      setItems(result.list);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category, type, keyword, sort, page]);

  const handleSearch = (kw: string) => {
    setKeyword(kw);
    setPage(1);
    const params: Record<string, string> = {};
    if (kw) params.keyword = kw;
    if (category) params.category = category;
    if (type) params.type = type;
    setSearchParams(params);
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setPage(1);
    const params: Record<string, string> = {};
    if (cat) params.category = cat;
    if (keyword) params.keyword = keyword;
    if (type) params.type = type;
    setSearchParams(params);
  };

  const handleTypeSelect = (t: ItemType | '') => {
    setType(t);
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSearch={handleSearch} searchValue={keyword} />
      <Toast />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CategoryNav
          selectedCategory={category}
          onSelectCategory={handleCategorySelect}
        />

        <div className="bg-white rounded-xl shadow-card p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">筛选：</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleTypeSelect('')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    type === ''
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => handleTypeSelect('exchange')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    type === 'exchange'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  可交换
                </button>
                <button
                  onClick={() => handleTypeSelect('gift')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    type === 'gift'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  免费送
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <SortAsc className="w-4 h-4 text-gray-500" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="text-sm border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="latest">最新发布</option>
                  <option value="popular">最多浏览</option>
                  <option value="distance">距离最近</option>
                </select>
              </div>
              <span className="text-sm text-gray-500">共 {total} 件物品</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-card animate-pulse">
                <div className="aspect-[4/3] bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-gray-600 mb-2">暂无物品</h3>
            <p className="text-gray-400">换个筛选条件试试吧</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  上一页
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-10 h-10 rounded-lg text-sm ${
                      page === i + 1
                        ? 'bg-primary-500 text-white'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p className="mb-2">邻里互换 - 让闲置物品流转起来</p>
            <p>© 2024 社区二手物品交换与赠送平台</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
