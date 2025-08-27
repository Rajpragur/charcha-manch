import React, { useState, useEffect } from 'react';
import { FirebaseService } from '../services/firebaseService';
import { Newspaper, Clock, Tag, MapPin, User, AlertTriangle } from 'lucide-react';

interface NewsSectionProps {
  constituencyName?: string;
  candidateName?: string;
  title?: string;
  maxItems?: number;
  showBreakingNews?: boolean;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: 'constituency' | 'candidate' | 'general';
  constituencyName?: string;
  candidateName?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  createdAt: Date;
  isBreaking?: boolean;
}

const NewsSection: React.FC<NewsSectionProps> = ({
  constituencyName,
  candidateName,
  title = 'Latest News',
  maxItems = 5,
  showBreakingNews = true
}) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        let newsData: NewsItem[] = [];

        if (constituencyName) {
          newsData = await FirebaseService.getNewsByConstituency(constituencyName);
        } else if (candidateName) {
          newsData = await FirebaseService.getNewsByCandidate(candidateName);
        } else {
          newsData = await FirebaseService.getAllPublishedNews();
        }

        // Filter breaking news if requested
        if (showBreakingNews) {
          const breakingNews = newsData.filter(item => item.isBreaking);
          const regularNews = newsData.filter(item => !item.isBreaking);
          newsData = [...breakingNews, ...regularNews];
        }

        // Limit items
        setNews(newsData.slice(0, maxItems));
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [constituencyName, candidateName, maxItems, showBreakingNews]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-[#014e5c]/20 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-[#014e5c]/20 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-[#014e5c]/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-4">
        <div className="flex items-center text-red-600">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#014e5c]/20 p-6 text-center">
        <Newspaper className="mx-auto h-12 w-12 text-[#014e5c]/40 mb-3" />
        <h3 className="text-lg font-medium text-[#014e5c] mb-2">No News Available</h3>
        <p className="text-[#014e5c]/70">
          {constituencyName 
            ? `No news available for ${constituencyName} constituency yet.`
            : candidateName
            ? `No news available for ${candidateName} yet.`
            : 'No news available at the moment.'
          }
        </p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'constituency': return <MapPin className="h-4 w-4" />;
      case 'candidate': return <User className="h-4 w-4" />;
      default: return <Newspaper className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#014e5c]/20">
      <div className="px-4 py-3 border-b border-[#014e5c]/20">
        <h2 className="text-lg font-semibold text-[#014e5c] flex items-center">
          <Newspaper className="h-5 w-5 mr-2" />
          {title}
        </h2>
      </div>
      
      <div className="divide-y divide-[#014e5c]/10">
        {news.map((item) => (
          <div key={item.id} className="p-4 hover:bg-[#014e5c]/2 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-medium text-[#014e5c]">{item.title}</h3>
                {item.isBreaking && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    Breaking
                  </span>
                )}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                  {item.priority}
                </span>
                <span className="flex items-center gap-1 px-2 py-1 text-xs text-[#014e5c]/70 bg-[#014e5c]/10 rounded">
                  {getCategoryIcon(item.category)}
                  {item.category}
                </span>
              </div>
            </div>
            
            {item.excerpt && (
              <p className="text-sm text-[#014e5c]/80 mb-2">{item.excerpt}</p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-[#014e5c]/60 mb-2">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.createdAt instanceof Date ? item.createdAt.toLocaleDateString() : 'Unknown date'}
              </span>
              {item.constituencyName && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {item.constituencyName}
                </span>
              )}
              {item.candidateName && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {item.candidateName}
                </span>
              )}
            </div>
            
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag, index) => (
                  <span key={index} className="flex items-center gap-1 px-2 py-1 text-xs bg-[#014e5c]/10 text-[#014e5c] rounded">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {news.length >= maxItems && (
        <div className="px-4 py-3 border-t border-[#014e5c]/20 text-center">
          <button className="text-sm text-[#014e5c] hover:text-[#014e5c]/80 font-medium">
            View All News
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsSection;
