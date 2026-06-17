import {
  BookOpen, Smartphone, Home, Shirt, Baby, Gamepad2, Dumbbell, Tv,
} from 'lucide-react';

interface CategoryNavProps {
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

const categories = [
  { id: '图书文具', name: '图书文具', icon: BookOpen, color: 'bg-blue-500' },
  { id: '数码产品', name: '数码产品', icon: Smartphone, color: 'bg-purple-500' },
  { id: '家居用品', name: '家居用品', icon: Home, color: 'bg-yellow-500' },
  { id: '服装鞋帽', name: '服装鞋帽', icon: Shirt, color: 'bg-pink-500' },
  { id: '母婴用品', name: '母婴用品', icon: Baby, color: 'bg-green-500' },
  { id: '玩具游戏', name: '玩具游戏', icon: Gamepad2, color: 'bg-orange-500' },
  { id: '运动户外', name: '运动户外', icon: Dumbbell, color: 'bg-red-500' },
  { id: '家用电器', name: '家用电器', icon: Tv, color: 'bg-indigo-500' },
];

const CategoryNav = ({ selectedCategory, onSelectCategory }: CategoryNavProps) => {
  return (
    <div className="bg-white rounded-xl shadow-card p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">物品分类</h2>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
        <button
          onClick={() => onSelectCategory?.('')}
          className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition-all ${
            !selectedCategory
              ? 'bg-primary-50 text-primary-600 ring-2 ring-primary-200'
              : 'hover:bg-gray-50 text-gray-600'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-xl">🏠</span>
          </div>
          <span className="text-xs font-medium">全部</span>
        </button>
        
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory?.(cat.id)}
              className={`flex flex-col items-center space-y-2 p-3 rounded-xl transition-all ${
                isSelected
                  ? 'bg-primary-50 text-primary-600 ring-2 ring-primary-200'
                  : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              <div className={`w-12 h-12 rounded-full ${cat.color} bg-opacity-10 flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${isSelected ? 'text-primary-600' : 'text-gray-500'}`} />
              </div>
              <span className="text-xs font-medium">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryNav;
