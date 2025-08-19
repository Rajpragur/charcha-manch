import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, User, Tag, ThumbsUp, MessageSquare, Eye, TrendingUp, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import PhotoPlaceholder from '../components/PhotoPlaceholder';

interface BlogPost {
  id: string;
  title: BilingualText;
  excerpt: BilingualText;
  content: BilingualText;
  author: BilingualText;
  date: string;
  readTime: string;
  tags: string[];
  views: number;
  likes: number;
  comments: number;
  category: BilingualText;
  featured: boolean;
}

interface BilingualText {
  en: string;
  hi: string;
}

const BlogPost: React.FC = () => {
  const { isEnglish } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const content = {
    title: isEnglish ? 'Blog & News' : 'ब्लॉग और समाचार',
    subtitle: isEnglish ? 'Stay updated with the latest political developments and citizen discussions in Bihar' : 'बिहार में नवीनतम राजनीतिक विकास और नागरिक चर्चाओं के साथ अपडेट रहें',
    searchPlaceholder: isEnglish ? 'Search articles...' : 'लेख खोजें...',
    categories: isEnglish ? 'Categories' : 'श्रेणियां',
    all: isEnglish ? 'All' : 'सभी',
    politics: isEnglish ? 'Politics' : 'राजनीति',
    development: isEnglish ? 'Development' : 'विकास',
    education: isEnglish ? 'Education' : 'शिक्षा',
    healthcare: isEnglish ? 'Healthcare' : 'स्वास्थ्य',
    agriculture: isEnglish ? 'Agriculture' : 'कृषि',
    infrastructure: isEnglish ? 'Infrastructure' : 'बुनियादी ढांचा',
    readMore: isEnglish ? 'Read More' : 'और पढ़ें',
    views: isEnglish ? 'views' : 'दृश्य',
    likes: isEnglish ? 'likes' : 'लाइक',
    comments: isEnglish ? 'comments' : 'टिप्पणियां',
    readTime: isEnglish ? 'min read' : 'मिनट पढ़ने में',
    by: isEnglish ? 'by' : 'द्वारा',
    featured: isEnglish ? 'Featured' : 'विशेष',
    trending: isEnglish ? 'Trending' : 'चर्चित',
    recent: isEnglish ? 'Recent' : 'हाल के',
    popular: isEnglish ? 'Popular' : 'लोकप्रिय'
  };

  // Sample blog posts data
  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: {
        en: 'Major Infrastructure Development Announced for Patna',
        hi: 'पटना के लिए बड़े बुनियादी ढांचे के विकास की घोषणा'
      },
      excerpt: {
        en: 'The government has announced comprehensive infrastructure development projects for Patna, including new roads, bridges, and public transport systems.',
        hi: 'सरकार ने पटना के लिए व्यापक बुनियादी ढांचा विकास परियोजनाओं की घोषणा की है, जिसमें नई सड़कें, पुल और सार्वजनिक परिवहन प्रणालियां शामिल हैं।'
      },
      content: {
        en: 'The comprehensive infrastructure development plan for Patna includes the construction of new arterial roads, modern bridges over the Ganga, and an integrated public transport system. This initiative aims to transform Patna into a modern, well-connected city that can accommodate its growing population and economic activities.',
        hi: 'पटना के लिए व्यापक बुनियादी ढांचा विकास योजना में नई मुख्य सड़कों का निर्माण, गंगा पर आधुनिक पुल और एकीकृत सार्वजनिक परिवहन प्रणाली शामिल है। यह पहल पटना को एक आधुनिक, अच्छी तरह से जुड़े शहर में बदलने का लक्ष्य रखती है जो अपनी बढ़ती आबादी और आर्थिक गतिविधियों को समायोजित कर सकता है।'
      },
      author: {
        en: 'Development Team',
        hi: 'विकास टीम'
      },
      date: '2025-01-15',
      readTime: '5',
      tags: ['Infrastructure', 'Development', 'Patna'],
      views: 1245,
      likes: 89,
      comments: 23,
      category: {
        en: 'Infrastructure',
        hi: 'बुनियादी ढांचा'
      },
      featured: true
    },
    {
      id: '2',
      title: {
        en: 'Education Reforms: New Policies for Better Learning',
        hi: 'शिक्षा सुधार: बेहतर सीखने के लिए नई नीतियां'
      },
      excerpt: {
        en: 'Comprehensive education reforms are being implemented across Bihar to improve learning outcomes and provide better opportunities for students.',
        hi: 'बिहार भर में सीखने के परिणामों में सुधार और छात्रों के लिए बेहतर अवसर प्रदान करने के लिए व्यापक शिक्षा सुधार लागू किए जा रहे हैं।'
      },
      content: {
        en: 'The new education policies focus on improving teacher training, modernizing school infrastructure, and implementing technology-driven learning methods. These reforms aim to bridge the urban-rural education gap and ensure quality education for all students in Bihar.',
        hi: 'नई शिक्षा नीतियां शिक्षक प्रशिक्षण में सुधार, स्कूल के बुनियादी ढांचे को आधुनिक बनाने और तकनीक-संचालित सीखने के तरीकों को लागू करने पर ध्यान केंद्रित करती हैं। ये सुधार शहरी-ग्रामीण शिक्षा अंतर को पाटने और बिहार के सभी छात्रों के लिए गुणवत्तापूर्ण शिक्षा सुनिश्चित करने का लक्ष्य रखते हैं।'
      },
      author: {
        en: 'Education Department',
        hi: 'शिक्षा विभाग'
      },
      date: '2025-01-12',
      readTime: '4',
      tags: ['Education', 'Reforms', 'Policy'],
      views: 987,
      likes: 67,
      comments: 18,
      category: {
        en: 'Education',
        hi: 'शिक्षा'
      },
      featured: false
    },
    {
      id: '3',
      title: {
        en: 'Healthcare Initiatives: Improving Medical Services in Rural Areas',
        hi: 'स्वास्थ्य पहल: ग्रामीण क्षेत्रों में चिकित्सा सेवाओं में सुधार'
      },
      excerpt: {
        en: 'New healthcare initiatives are being launched to improve medical services and accessibility in rural areas of Bihar.',
        hi: 'बिहार के ग्रामीण क्षेत्रों में चिकित्सा सेवाओं और पहुंच में सुधार के लिए नई स्वास्थ्य पहल शुरू की जा रही हैं।'
      },
      content: {
        en: 'The healthcare initiatives include setting up new primary health centers, mobile medical units, and telemedicine services. These efforts aim to provide better healthcare access to rural communities and reduce health disparities across the state.',
        hi: 'स्वास्थ्य पहल में नए प्राथमिक स्वास्थ्य केंद्र, मोबाइल चिकित्सा इकाइयां और टेलीमेडिसिन सेवाएं शामिल हैं। ये प्रयास ग्रामीण समुदायों को बेहतर स्वास्थ्य देखभाल पहुंच प्रदान करने और राज्य भर में स्वास्थ्य असमानताओं को कम करने का लक्ष्य रखते हैं।'
      },
      author: {
        en: 'Health Ministry',
        hi: 'स्वास्थ्य मंत्रालय'
      },
      date: '2025-01-10',
      readTime: '6',
      tags: ['Healthcare', 'Rural', 'Medical'],
      views: 756,
      likes: 45,
      comments: 12,
      category: {
        en: 'Healthcare',
        hi: 'स्वास्थ्य'
      },
      featured: false
    }
  ];

  const categories = [
    { id: 'all', name: content.all, count: blogPosts.length },
    { id: 'politics', name: content.politics, count: blogPosts.filter(post => post.category.en === 'Politics').length },
    { id: 'development', name: content.development, count: blogPosts.filter(post => post.category.en === 'Development').length },
    { id: 'education', name: content.education, count: blogPosts.filter(post => post.category.en === 'Education').length },
    { id: 'healthcare', name: content.healthcare, count: blogPosts.filter(post => post.category.en === 'Healthcare').length },
    { id: 'agriculture', name: content.agriculture, count: blogPosts.filter(post => post.category.en === 'Agriculture').length },
    { id: 'infrastructure', name: content.infrastructure, count: blogPosts.filter(post => post.category.en === 'Infrastructure').length }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category.en.toLowerCase() === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white py-12 sm:py-16 px-4 w-full">
        <div className="w-full max-w-none mx-auto">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">
              {content.title}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 max-w-4xl mx-auto px-4 text-slate-200">
              {content.subtitle}
            </p>
            
            {/* Photo Placeholders */}
            <div className="flex justify-center items-center space-x-4 mb-6 sm:mb-8">
              <PhotoPlaceholder type="document" size="md" className="hidden sm:block" />
              <PhotoPlaceholder type="chart" size="md" className="hidden sm:block" />
              <PhotoPlaceholder type="general" size="md" className="hidden sm:block" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-sky-600" />
                {content.categories}
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-sky-100 text-sky-800 border border-sky-200'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category.name}</span>
                      <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">
                        {category.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-amber-600" />
                {isEnglish ? 'Popular Tags' : 'लोकप्रिय टैग'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Development', 'Politics', 'Education', 'Healthcare', 'Infrastructure', 'Agriculture'].map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs hover:bg-slate-200 transition-colors cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Featured Post */}
            {blogPosts.filter(post => post.featured).map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-100">
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                      {content.featured}
                    </span>
                    <span className="px-2 py-1 bg-sky-100 text-sky-800 text-xs font-medium rounded-full">
                      {isEnglish ? post.category.en : post.category.hi}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-800 mb-3">
                    {isEnglish ? post.title.en : post.title.hi}
                  </h2>
                  
                  <p className="text-slate-600 mb-4 leading-relaxed">
                    {isEnglish ? post.excerpt.en : post.excerpt.hi}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {isEnglish ? post.author.en : post.author.hi}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {post.date}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {post.readTime} {content.readTime}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {post.views} {content.views}
                      </span>
                      <span className="flex items-center">
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        {post.likes} {content.likes}
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {post.comments} {content.comments}
                      </span>
                    </div>
                    
                    <button className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium">
                      {content.readMore}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Regular Posts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPosts.filter(post => !post.featured).map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-2 py-1 bg-sky-100 text-sky-800 text-xs font-medium rounded-full">
                        {isEnglish ? post.category.en : post.category.hi}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-800 mb-3 line-clamp-2">
                      {isEnglish ? post.title.en : post.title.hi}
                    </h3>
                    
                    <p className="text-slate-600 mb-4 text-sm leading-relaxed line-clamp-3">
                      {isEnglish ? post.excerpt.en : post.excerpt.hi}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {isEnglish ? post.author.en : post.author.hi}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {post.date}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {post.views}
                        </span>
                        <span className="flex items-center">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {post.likes}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {post.comments}
                        </span>
                      </div>
                      
                      <button className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg hover:bg-slate-200 transition-colors text-xs font-medium">
                        {content.readMore}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button className="px-3 py-2 bg-sky-600 text-white rounded-lg">1</button>
              <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">2</button>
              <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">3</button>
              <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;