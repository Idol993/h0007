import { useUIStore } from '@/store';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const Toast = () => {
  const { showToast, toastMessage, toastType, hideToast } = useUIStore();

  if (!showToast) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-down">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg border shadow-lg ${bgColors[toastType]}`}>
        {icons[toastType]}
        <span className="text-gray-800 text-sm">{toastMessage}</span>
        <button
          onClick={hideToast}
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
