import React from 'react';
import { Users, Target, Eye, Heart, Award, Globe } from 'lucide-react';

const About: React.FC = () => {
  const features = [
    {
      icon: <Users className="h-12 w-12 text-blue-600" />,
      title: 'नागरिक सहभागिता',
      description: 'हमारा प्लेटफॉर्म सभी नागरिकों को लोकतांत्रिक प्रक्रिया में सक्रिय भागीदारी का अवसर प्रदान करता है।'
    },
    {
      icon: <Target className="h-12 w-12 text-green-600" />,
      title: 'पारदर्शिता',
      description: 'राजनीतिक प्रक्रियाओं में पूर्ण पारदर्शिता और जवाबदेही सुनिश्चित करना हमारा मुख्य लक्ष्य है।'
    },
    {
      icon: <Globe className="h-12 w-12 text-purple-600" />,
      title: 'डिजिटल लोकतंत्र',
      description: 'तकनीक के माध्यम से लोकतंत्र को और भी मजबूत और सुलभ बनाने का प्रयास कर रहे हैं।'
    }
  ];

  const values = [
    {
      icon: <Heart className="h-8 w-8 text-red-500" />,
      title: 'सेवा भावना',
      description: 'समाज की बेहतरी के लिए निस्वार्थ सेवा'
    },
    {
      icon: <Award className="h-8 w-8 text-yellow-500" />,
      title: 'गुणवत्ता',
      description: 'उच्च गुणवत्ता वाली सेवाएं प्रदान करना'
    },
    {
      icon: <Eye className="h-8 w-8 text-blue-500" />,
      title: 'विश्वसनीयता',
      description: 'पूर्ण पारदर्शिता और विश्वसनीयता'
    }
  ];

  const stats = [
    { number: '50,000+', label: 'Active Users' },
    { number: '243', label: 'Constituencies' },
    { number: '10,000+', label: 'Discussions' },
    { number: '95%', label: 'User Satisfaction' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              हमारे बारे में
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto">
              लोकतंत्र को डिजिटल युग में मजबूत बनाने का हमारा मिशन
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">हमारा मिशन</h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              नागरिक मंच एक डिजिटल प्लेटफॉर्म है जो भारतीय लोकतंत्र में नागरिकों की सक्रिय भागीदारी को प्रोत्साहित करता है। 
              हमारा उद्देश्य राजनीतिक पारदर्शिता बढ़ाना, सूचना तक पहुंच सुनिश्चित करना और नागरिकों को अपने प्रतिनिधियों से 
              जुड़ने का सशक्त माध्यम प्रदान करना है।
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Vision Section */}
        <section className="mb-20">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 p-8 md:p-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">हमारा विजन</h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  हम एक ऐसे भारत की कल्पना करते हैं जहां हर नागरिक अपने लोकतांत्रिक अधिकारों का पूरा उपयोग कर सके। 
                  जहां पारदर्शिता, जवाबदेही और सहभागिता लोकतंत्र के मूल स्तंभ हों।
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                    <p className="text-gray-700">प्रतिनिधियों की कार्यप्रणाली में पूर्ण पारदर्शिता</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                    <p className="text-gray-700">नागरिकों और सरकार के बीच मजबूत संवाद</p>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 bg-gradient-to-br from-blue-500 to-purple-600">
                <div className="h-full flex items-center justify-center p-8">
                  <div className="text-center text-white">
                    <Users className="h-24 w-24 mx-auto mb-4 opacity-80" />
                    <h3 className="text-2xl font-semibold mb-2">एक साथ मिलकर</h3>
                    <p className="text-blue-100">लोकतंत्र को मजबूत बनाते हैं</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">हमारे मूल्य</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              ये मूलभूत सिद्धांत हमारे हर निर्णय और कार्य का आधार हैं
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-md">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Statistics Section */}
        <section className="mb-20">
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl text-white p-8 md:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">हमारी उपलब्धियां</h2>
              <p className="text-blue-100 text-lg">संख्याओं में हमारा प्रभाव</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                  <div className="text-blue-100">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">हमारी टीम</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              अनुभवी पेशेवरों की हमारी टीम लोकतंत्र को बेहतर बनाने के लिए प्रतिबद्ध है
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">हमारे विशेषज्ञ</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">राजनीति विज्ञान विशेषज्ञ</p>
                      <p className="text-sm text-gray-600">लोकतांत्रिक प्रक्रियाओं के विशेषज्ञ</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Globe className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">तकनीकी विकास टीम</p>
                      <p className="text-sm text-gray-600">अत्याधुनिक प्लेटफॉर्म डेवलपमेंट</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Heart className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">सामुदायिक विकास विशेषज्ञ</p>
                      <p className="text-sm text-gray-600">नागरिक सहभागिता बढ़ाने में विशेषज्ञ</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-32 h-32 mx-auto flex items-center justify-center mb-6">
                  <Award className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">समर्पित टीम</h3>
                <p className="text-gray-600">
                  हमारी टीम भारतीय लोकतंत्र को मजबूत बनाने के लिए दिन-रात काम करती है
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-gray-800 rounded-2xl text-white p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6">हमारे साथ जुड़ें</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              लोकतंत्र को मजबूत बनाने की यात्रा में हमारे साथ शामिल हों। 
              आपकी आवाज़ महत्वपूर्ण है।
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors">
                अभी रजिस्टर करें
              </button>
              <button className="border-2 border-gray-400 hover:border-white text-gray-300 hover:text-white px-8 py-3 rounded-lg transition-colors">
                और जानें
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;