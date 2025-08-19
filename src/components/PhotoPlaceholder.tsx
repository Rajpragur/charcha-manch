import React from 'react';
import { Image, Building2, Landmark, Users, MapPin, Award, FileText, BarChart3 } from 'lucide-react';

interface PhotoPlaceholderProps {
  type: 'constituency' | 'building' | 'landmark' | 'group' | 'achievement' | 'document' | 'chart' | 'general';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const PhotoPlaceholder: React.FC<PhotoPlaceholderProps> = ({ 
  type, 
  size = 'md', 
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  const getIconAndColors = () => {
    switch (type) {
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
      case 'document':
        return { icon: FileText, bgFrom: 'from-emerald-100', bgTo: 'to-emerald-200', iconColor: 'text-emerald-600' };
      case 'chart':
        return { icon: BarChart3, bgFrom: 'from-purple-100', bgTo: 'to-purple-200', iconColor: 'text-purple-600' };
      case 'general':
      default:
        return { icon: Image, bgFrom: 'from-slate-100', bgTo: 'to-slate-200', iconColor: 'text-slate-600' };
    }
  };

  const { icon: Icon, bgFrom, bgTo } = getIconAndColors();

  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-gradient-to-br ${bgFrom} ${bgTo} flex items-center justify-center flex-shrink-0 ${className}`}>
      <Icon className="w-1/3 h-1/3 ${iconColor}" />
    </div>
  );
};

export default PhotoPlaceholder;
