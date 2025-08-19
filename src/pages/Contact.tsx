import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactInfo = [
    {
      icon: <Mail className="h-8 w-8 text-blue-600" />,
      title: 'ईमेल',
      details: 'contact@nagrikmanch.in',
      subDetails: 'support@nagrikmanch.in'
    },
    {
      icon: <Phone className="h-8 w-8 text-green-600" />,
      title: 'फोन',
      details: '+91 98765 43210',
      subDetails: '+91 98765 43211'
    },
    {
      icon: <MapPin className="h-8 w-8 text-red-600" />,
      title: 'पता',
      details: 'नागरिक मंच',
      subDetails: 'पटना, बिहार 800001'
    },
    {
      icon: <Clock className="h-8 w-8 text-purple-600" />,
      title: 'समय',
      details: 'सोमवार - शनिवार',
      subDetails: '9:00 AM - 6:00 PM'
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              संपर्क करें
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto">
              हमसे जुड़ें और अपनी बात कहें - हम आपकी सुनने को तैयार हैं
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Contact Info Cards */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  {info.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{info.title}</h3>
                <p className="text-gray-600 font-medium">{info.details}</p>
                <p className="text-gray-500 text-sm">{info.subDetails}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">अपना संदेश भेजें</h2>
              <p className="text-gray-600">
                हमें अपनी समस्या, सुझाव या प्रश्न बताएं। हम 24 घंटे के अंदर जवाब देने का प्रयास करते हैं।
              </p>
            </div>

            {isSubmitted ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">संदेश भेजा गया!</h3>
                <p className="text-gray-600">
                  धन्यवाद! हमें आपका संदेश मिल गया है। हम जल्द ही आपसे संपर्क करेंगे।
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      पूरा नाम *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="आपका नाम"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      ईमेल *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      फोन नंबर
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      विषय *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="">विषय चुनें</option>
                      <option value="general">सामान्य प्रश्न</option>
                      <option value="technical">तकनीकी सहायता</option>
                      <option value="feedback">सुझाव/फीडबैक</option>
                      <option value="complaint">शिकायत</option>
                      <option value="partnership">साझेदारी</option>
                      <option value="media">मीडिया पूछताछ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    संदेश *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-vertical"
                    placeholder="अपना संदेश यहाँ लिखें..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>भेजा जा रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>संदेश भेजें</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-8">
            {/* FAQ Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">अक्सर पूछे जाने वाले प्रश्न</h3>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">प्लेटफॉर्म का उपयोग कैसे करें?</h4>
                  <p className="text-gray-600 text-sm">
                    रजिस्ट्रेशन के बाद आप अपने क्षेत्र की जानकारी देख सकते हैं और चर्चा में भाग ले सकते हैं।
                  </p>
                </div>
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">क्या यह सेवा मुफ्त है?</h4>
                  <p className="text-gray-600 text-sm">
                    हाँ, हमारी सभी सेवाएं बिल्कुल मुफ्त हैं। हमारा लक्ष्य सभी तक पहुंच बनाना है।
                  </p>
                </div>
                <div className="border-b pb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">डेटा की सुरक्षा कैसे की जाती है?</h4>
                  <p className="text-gray-600 text-sm">
                    हम आपकी निजता को सर्वोच्च प्राथमिकता देते हैं और उच्च सुरक्षा मानकों का पालन करते हैं।
                  </p>
                </div>
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white p-8">
              <h3 className="text-2xl font-bold mb-6">कार्यालय समय</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>सोमवार - शुक्रवार</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>शनिवार</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>रविवार</span>
                  <span>बंद</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-blue-300">
                <p className="text-blue-100 text-sm">
                  आपातकालीन स्थिति में 24/7 ईमेल सपोर्ट उपलब्ध है।
                </p>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">सामाजिक माध्यम</h3>
              <p className="text-gray-600 mb-6">
                हमारे सामाजिक माध्यमों पर भी जुड़ें और नवीनतम अपडेट पाएं।
              </p>
              <div className="flex space-x-4">
                <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="bg-blue-400 hover:bg-blue-500 text-white p-3 rounded-lg transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg transition-colors">
                  <span className="sr-only">YouTube</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;