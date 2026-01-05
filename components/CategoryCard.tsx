'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Category } from '@/types';
import { useAuth } from '@/components/AuthProvider';
import LoginModal from '@/components/LoginModal';
import { 
  Microscope, 
  Building, 
  Trophy, 
  Globe, 
  Presentation,
  Folder,
  LucideIcon
} from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

const iconMap: Record<string, LucideIcon> = {
  Microscope,
  Building,
  Trophy,
  Globe,
  Presentation,
  Folder,
};

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600 border-blue-200',
  green: 'bg-green-100 text-green-600 border-green-200',
  purple: 'bg-purple-100 text-purple-600 border-purple-200',
  orange: 'bg-orange-100 text-orange-600 border-orange-200',
  red: 'bg-red-100 text-red-600 border-red-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function CategoryCard({ category }: CategoryCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  const IconComponent = iconMap[category.icon || 'Folder'] || Folder;
  const colorClass = colorClasses[category.color || 'gray'] || colorClasses.gray;

  function handleClick(e: React.MouseEvent) {
    if (!user) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  }

  return (
    <>
      <Link
        href={'/category/' + category.slug}
        onClick={handleClick}
        className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
      >
        <div className={'w-12 h-12 rounded-lg flex items-center justify-center mb-4 ' + colorClass}>
          <IconComponent className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{category.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{category.video_count || 0}本の動画</span>
          <span className="text-sm font-medium text-blue-600">詳しく見る →</span>
        </div>
      </Link>
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        message={'「' + category.name + '」のコンテンツを視聴するにはログインが必要です'}
      />
    </>
  );
}
