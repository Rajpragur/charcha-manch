import React, { useState, useEffect } from 'react';
import { Calendar, User, Tag, Clock, Share2, ArrowLeft, Eye, ThumbsUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  headerImage: string;
  author: string;
  publishDate: string;
  readTime: number;
  views: number;
  likes: number;
  tags: string[];
  sections: {
    subtitle: string;
    content: string;
    image?: string;
  }[];
}

const BlogPost: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock blog data
  const mockPosts: BlogPost[] = [
    {
      id: '1',
      title: 'डिजिटल लोकतंत्र: भारत का भविष्य',
      description: 'आधुनिक तकनीक कैसे भारतीय लोकतंत्र को मजबूत बना सकती है और नागरिकों की भागीदारी बढ़ा सकती है।',
      headerImage: '/api/placeholder/800/400',
      author: 'डॉ. राज कुमार',
      publishDate: '2025-08-15',
      readTime: 8,
      views: 2341,
      likes: 156,
      tags: ['लोकतंत्र', 'तकनीक', 'नागरिकता'],
      sections: [
        {
          subtitle: 'डिजिटल क्रांति का प्रभाव',
          content: 'आज के युग में तकनीक ने हमारे जीवन के हर क्षेत्र को प्रभावित किया है। लोकतंत्र भी इससे अछूता नहीं है। डिजिटल प्लेटफॉर्म के माध्यम से नागरिक अब अपने प्रतिनिधियों से सीधे जुड़ सकते हैं और अपनी आवाज़ उठा सकते हैं। यह परिवर्तन न केवल पारदर्शिता लाता है बल्कि जवाबदेही भी सुनिश्चित करता है।',
          image: '/api/placeholder/600/300'
        },
        {
          subtitle: 'नागरिक सहभागिता में वृद्धि',
          content: 'पारंपरिक तरीकों की तुलना में डिजिटल माध्यम से अधिक लोग राजनीतिक प्रक्रियाओं में भाग ले सकते हैं। ऑनलाइन चुनाव, डिजिटल सर्वे, और वर्चुअल टाउन हॉल मीटिंग्स के माध्यम से समाज के हर वर्ग की आवाज़ सुनी जा सकती है। यह विशेष रूप से युवाओं और महिलाओं की भागीदारी बढ़ाने में सहायक है।'
        },
        {
          subtitle: 'चुनौतियाँ और समाधान',
          content: 'डिजिटल लोकतंत्र की राह में कुछ चुनौतियाँ भी हैं जैसे साइबर सिक्योरिटी, डिजिटल डिवाइड, और फेक न्यूज़। इन समस्याओं का समाधान मजबूत नीतियों, शिक्षा, और तकनीकी सुरक्षा उपायों से किया जा सकता है। सरकार, नागरिक समाज, और तकनीकी कंपनियों को मिलकर इन चुनौतियों का सामना करना होगा।'
        }
      ]
    },
    {
      id: '2',
      title: 'युवाओं की राजनीतिक जागरूकता',
      description: 'आज के युवा कैसे राजनीति में सक्रिय हो सकते हैं और लोकतंत्र को मजबूत बनाने में योगदान दे सकते हैं।',
      headerImage: '/api/placeholder/800/400',
      author: 'प्रिया शर्मा',
      publishDate: '2025-08-12',
      readTime: 6,
      views: 1876,
      likes: 89,
      tags: ['युवा', 'राजनीति', 'जागरूकता'],
      sections: [
        {
          subtitle: 'युवाओं की शक्ति',
          content: 'भारत की 65% आबादी 35 वर्ष से कम उम्र की है। यह युवा शक्ति देश के भविष्य को आकार दे सकती है। राजनीतिक जागरूकता और सक्रिय भागीदारी के माध्यम से युवा एक बेहतर समाज का निर्माण कर सकते हैं।'
        },
        {
          subtitle: 'सोशल मीडिया की भूमिका',
          content: 'सोशल मीडिया ने युवाओं के लिए राजनीतिक चर्चा और जुड़ाव के नए रास्ते खोले हैं। ट्विटर, फेसबुक, और इंस्टाग्राम जैसे प्लेटफॉर्म पर युवा अपनी राय व्यक्त कर सकते हैं और सामाजिक मुद्दों पर आवाज़ उठा सकते हैं।'
        }
      ]
    },
    {
      id: '3',
      title: 'महिला सशक्तिकरण और राजनीतिक भागीदारी',
      description: 'भारतीय राजनीति में महिलाओं की बढ़ती भूमिका और उनके सामने आने वाली चुनौतियों का विश्लेषण।',
      headerImage: '/api/placeholder/800/400',
      author: 'अनीता गुप्ता',
      publishDate: '2025-08-10',
      readTime: 7,
      views: 2156,
      likes: 134,
      tags: ['महिला सशक्तिकरण', 'राजनीति', 'समानता'],
      sections: [
        {
          subtitle: 'बदलता परिदृश्य',
          content: 'पिछले कुछ दशकों में भारतीय राजनीति में महिलाओं की भागीदारी में महत्वपूर्ण वृद्धि हुई है। पंचायती राज से लेकर संसद तक, महिलाएं अपनी उपस्थिति दर्ज करा रही हैं और समाज में सकारात्मक बदलाव ला रही हैं।'
        }
      ]
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPosts(mockPosts);
      setLoading(false);
    }, 1000);
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hi-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = (post: BlogPost) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: window.location.href
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      alert('लिंक कॉपी हो गया!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ब्लॉग लोड हो रहा है...</p>
        </div>
      </div>
    );
  }

  // Single post view
  if (selectedPost) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => setSelectedPost(null)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>वापस ब्लॉग सूची में जाएं</span>
          </button>

          <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header Image */}
            <div className="relative h-64 md:h-96">
              <img 
                src={selectedPost.headerImage} 
                alt={selectedPost.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>

            <div className="p-8 md:p-12">
              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{selectedPost.author}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(selectedPost.publishDate)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{selectedPost.readTime} मिनट पढ़ने का समय</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>{selectedPost.views.toLocaleString()} विचार</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
                {selectedPost.title}
              </h1>

              {/* Description */}
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {selectedPost.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {selectedPost.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Content Sections */}
              <div className="space-y-8">
                {selectedPost.sections.map((section, index) => (
                  <div key={index}>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                      {section.subtitle}
                    </h2>
                    <div className="prose prose-lg max-w-none">
                      <p className="text-gray-700 leading-relaxed mb-6">
                        {section.content}
                      </p>
                      {section.image && (
                        <img 
                          src={section.image} 
                          alt={section.subtitle}
                          className="w-full rounded-lg shadow-md mb-6"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="border-t pt-8 mt-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                      <ThumbsUp className="h-5 w-5" />
                      <span>{selectedPost.likes}</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleShare(selectedPost)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>साझा करें</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  // Blog list view
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              ब्लॉग
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto">
              लोकतंत्र, राजनीति और सामाजिक मुद्दों पर विचारशील लेख
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Featured Post */}
        {posts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">फीचर्ड पोस्ट</h2>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                 onClick={() => setSelectedPost(posts[0])}>
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img 
                    src={posts[0].headerImage} 
                    alt={posts[0].title}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{posts[0].author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(posts[0].publishDate)}</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    {posts[0].title}
                  </h3>
                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {posts[0].description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {posts[0].tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{posts[0].readTime} मिनट पढ़ने का समय</span>
                      <span>{posts[0].views.toLocaleString()} विचार</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* All Posts */}
        <section>
          <h2 className="text-3xl font-bold text-gray-800 mb-8">सभी पोस्ट</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <div 
                key={post.id}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedPost(post)}
              >
                <img 
                  src={post.headerImage} 
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(post.publishDate)}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{post.readTime} मिनट</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Eye className="h-4 w-4" />
                      <span>{post.views}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.slice(0, 2).map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center mt-12">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors">
            और पोस्ट लोड करें
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;