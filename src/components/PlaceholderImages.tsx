import React from 'react';
import { User, Building2, MapPin, Landmark, Users, Award, MessageCircle, FileText, BarChart3, TrendingUp } from 'lucide-react';

interface PlaceholderImageProps {
  type: 'profile' | 'constituency' | 'building' | 'landmark' | 'group' | 'achievement' | 'discussion' | 'document' | 'chart' | 'trend';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const PlaceholderImages: React.FC<PlaceholderImageProps> = ({ 
  type, 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const iconSizes = {
    sm: 'w-1/2 h-1/2',
    md: 'w-1/2 h-1/2',
    lg: 'w-1/2 h-1/2',
    xl: 'w-2/3 h-2/3'
  };

  const getIconAndColors = () => {
    switch (type) {
      case 'profile':
        return { icon: User, bgFrom: 'from-amber-100', bgTo: 'to-amber-200', iconColor: 'text-amber-600' };
      case 'constituency':
        return { icon: MapPin, bgFrom: 'from-sky-100', bgTo: 'to-sky-200', iconColor: 'text-sky-600' };
      case 'building':
        return { icon: Building2, bgFrom: 'from-slate-100', bgTo: 'to-slate-200', iconColor: 'text-slate-600' };
      case 'landmark':
        return { icon: Landmark, bgFrom: 'from-emerald-100', bgTo: 'to-emerald-200', iconColor: 'text-emerald-600' };
      case 'group':
        return { icon: Users, bgFrom: 'from-rose-100', bgTo: 'to-rose-200', iconColor: 'text-rose-600' };
      case 'achievement':
        return { icon: Award, bgFrom: 'from-amber-100', bgTo: 'to-amber-200', iconColor: 'text-amber-600' };
      case 'discussion':
        return { icon: MessageCircle, bgFrom: 'from-sky-100', bgTo: 'to-sky-200', iconColor: 'text-sky-600' };
      case 'document':
        return { icon: FileText, bgFrom: 'from-emerald-100', bgTo: 'to-emerald-200', iconColor: 'text-emerald-600' };
      case 'chart':
        return { icon: BarChart3, bgFrom: 'from-purple-100', bgTo: 'to-purple-200', iconColor: 'text-purple-600' };
      case 'trend':
        return { icon: TrendingUp, bgFrom: 'from-green-100', bgTo: 'to-green-200', iconColor: 'text-green-600' };
      default:
        return { icon: User, bgFrom: 'from-slate-100', bgTo: 'to-slate-200', iconColor: 'text-slate-600' };
    }
  };

  const { icon: Icon, bgFrom, bgTo, iconColor } = getIconAndColors();

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${bgFrom} ${bgTo} flex items-center justify-center flex-shrink-0 ${className}`}>
      <Icon className={`${iconSizes[size]} ${iconColor}`} />
    </div>
  );
};

export default PlaceholderImages;
