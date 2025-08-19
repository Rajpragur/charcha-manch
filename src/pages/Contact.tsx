import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, Building2, Star, CheckCircle, AlertCircle } from 'lucide-react';
import PhotoPlaceholder from '../components/PhotoPlaceholder';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}

const Contact: React.FC = () => {
  const { isEnglish } = useLanguage();
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const content = {
    title: isEnglish ? 'Contact Us' : 'संपर्क करें',
    subtitle: isEnglish ? 'Get in Touch with Our Team' : 'हमारी टीम से संपर्क करें',
    description: isEnglish 
      ? 'Have questions, suggestions, or need assistance? We\'re here to help. Reach out to us through any of the channels below or fill out the contact form.'
      : 'कोई सवाल, सुझाव या सहायता की आवश्यकता है? हम यहां मदद के लिए हैं। नीचे दिए गए किसी भी चैनल के माध्यम से हमसे संपर्क करें या संपर्क फॉर्म भरें।',
    
    // Contact Methods
    contactMethods: isEnglish ? 'Contact Methods' : 'संपर्क के तरीके',
    getInTouch: isEnglish ? 'Get In Touch' : 'संपर्क में आएं',
    
    // Form
    formTitle: isEnglish ? 'Send us a Message' : 'हमें संदेश भेजें',
    name: isEnglish ? 'Full Name' : 'पूरा नाम',
    namePlaceholder: isEnglish ? 'Enter your full name' : 'अपना पूरा नाम दर्ज करें',
    email: isEnglish ? 'Email Address' : 'ईमेल पता',
    emailPlaceholder: isEnglish ? 'Enter your email address' : 'अपना ईमेल पता दर्ज करें',
    subject: isEnglish ? 'Subject' : 'विषय',
    subjectPlaceholder: isEnglish ? 'What is this about?' : 'यह किस बारे में है?',
    category: isEnglish ? 'Category' : 'श्रेणी',
    message: isEnglish ? 'Message' : 'संदेश',
    messagePlaceholder: isEnglish ? 'Tell us more about your inquiry...' : 'अपनी पूछताछ के बारे में हमें और बताएं...',
    sendMessage: isEnglish ? 'Send Message' : 'संदेश भेजें',
    sending: isEnglish ? 'Sending...' : 'भेज रहे हैं...',
    
    // Categories
    general: isEnglish ? 'General Inquiry' : 'सामान्य पूछताछ',
    technical: isEnglish ? 'Technical Support' : 'तकनीकी सहायता',
    feedback: isEnglish ? 'Feedback & Suggestions' : 'प्रतिक्रिया और सुझाव',
    partnership: isEnglish ? 'Partnership' : 'साझेदारी',
    media: isEnglish ? 'Media & Press' : 'मीडिया और प्रेस',
    
    // Contact Info
    address: isEnglish ? 'Address' : 'पता',
    addressValue: isEnglish ? 'Patna, Bihar, India' : 'पटना, बिहार, भारत',
    phone: isEnglish ? 'Phone' : 'फोन',
    phoneValue: '+91-XXX-XXX-XXXX',
    emailValue: 'info@charchamanch.com',
    hours: isEnglish ? 'Working Hours' : 'कार्य समय',
    hoursValue: isEnglish ? 'Monday - Friday: 9:00 AM - 6:00 PM' : 'सोमवार - शुक्रवार: सुबह 9:00 - शाम 6:00',
    weekend: isEnglish ? 'Saturday: 9:00 AM - 2:00 PM' : 'शनिवार: सुबह 9:00 - दोपहर 2:00',
    
    // Success/Error Messages
    successMessage: isEnglish ? 'Thank you! Your message has been sent successfully.' : 'धन्यवाद! आपका संदेश सफलतापूर्वक भेज दिया गया है।',
    errorMessage: isEnglish ? 'Sorry! There was an error sending your message. Please try again.' : 'क्षमा करें! आपका संदेश भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।',
    
    // Additional Info
    responseTime: isEnglish ? 'Response Time' : 'प्रतिक्रिया समय',
    responseTimeValue: isEnglish ? 'Within 24 hours' : '24 घंटे के भीतर',
    support: isEnglish ? '24/7 Support' : '24/7 सहायता',
    supportValue: isEnglish ? 'Available for urgent matters' : 'जरूरी मामलों के लिए उपलब्ध',
    
    // FAQ
    faqTitle: isEnglish ? 'Frequently Asked Questions' : 'अक्सर पूछे जाने वाले प्रश्न',
    faq1: isEnglish ? 'How can I report an issue in my constituency?' : 'मैं अपने निर्वाचन क्षेत्र में एक समस्या की रिपोर्ट कैसे कर सकता हूं?',
    faq1Answer: isEnglish ? 'You can use our constituency tracking feature or contact us directly through this form.' : 'आप हमारी निर्वाचन क्षेत्र ट्रैकिंग सुविधा का उपयोग कर सकते हैं या इस फॉर्म के माध्यम से सीधे हमसे संपर्क कर सकते हैं।',
    faq2: isEnglish ? 'How do I start a discussion on the platform?' : 'मैं मंच पर चर्चा कैसे शुरू करूं?',
    faq2Answer: isEnglish ? 'Simply log in to your account and use the "Start Discussion" feature in the forum section.' : 'बस अपने खाते में लॉगिन करें और फोरम अनुभाग में "चर्चा शुरू करें" सुविधा का उपयोग करें।',
    faq3: isEnglish ? 'Can I remain anonymous when reporting issues?' : 'क्या मैं मुद्दों की रिपोर्ट करते समय गुमनाम रह सकता हूं?',
    faq3Answer: isEnglish ? 'Yes, we respect your privacy and offer options for anonymous reporting.' : 'हां, हम आपकी गोपनीयता का सम्मान करते हैं और गुमनाम रिपोर्टिंग के विकल्प प्रदान करते हैं।'
  };

  const contactMethods = [
    {
      icon: <Mail className="h-6 w-6" />,
      title: isEnglish ? 'Email Us' : 'हमें ईमेल करें',
      description: isEnglish ? 'Send us an email and we\'ll get back to you within 24 hours.' : 'हमें ईमेल भेजें और हम 24 घंटे के भीतर आपसे संपर्क करेंगे।',
      value: content.emailValue,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50'
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: isEnglish ? 'Call Us' : 'हमें कॉल करें',
      description: isEnglish ? 'Speak directly with our support team during business hours.' : 'कार्य समय के दौरान हमारी सहायता टीम से सीधे बात करें।',
      value: content.phoneValue,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: isEnglish ? 'Visit Us' : 'हमें मिलें',
      description: isEnglish ? 'Visit our office in Patna for in-person assistance.' : 'व्यक्तिगत सहायता के लिए पटना में हमारे कार्यालय में आएं।',
      value: content.addressValue,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    }
  ];

  const categories = [
    { value: 'general', label: content.general },
    { value: 'technical', label: content.technical },
    { value: 'feedback', label: content.feedback },
    { value: 'partnership', label: content.partnership },
    { value: 'media', label: content.media }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      });
      
      // Reset status after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    }, 2000);
  };

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
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-3xl mx-auto px-4 text-slate-300">
              {content.description}
            </p>
            
            {/* Photo Placeholders */}
            <div className="flex justify-center items-center space-x-4 mb-6 sm:mb-8">
              <PhotoPlaceholder type="general" size="md" className="hidden sm:block" />
              <PhotoPlaceholder type="building" size="md" className="hidden sm:block" />
              <PhotoPlaceholder type="group" size="md" className="hidden sm:block" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Contact Methods */}
            <section>
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-slate-800">
                {content.contactMethods}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {contactMethods.map((method, index) => (
                  <div key={index} className={`${method.bgColor} rounded-lg p-6 border border-slate-100`}>
                    <div className={`${method.color} mb-4 flex justify-center`}>
                      {method.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2 text-center">
                      {method.title}
                    </h3>
                    <p className="text-slate-600 text-sm text-center mb-4">
                      {method.description}
                    </p>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-800">
                        {method.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact Form */}
            <section>
              <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                  <MessageSquare className="h-6 w-6 mr-2 text-sky-600" />
                  {content.formTitle}
                </h2>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <p className="text-emerald-800 font-medium">{content.successMessage}</p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                    <p className="text-rose-800 font-medium">{content.errorMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                        {content.name} *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder={content.namePlaceholder}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                        {content.email} *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder={content.emailPlaceholder}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                        {content.subject} *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        placeholder={content.subjectPlaceholder}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                        {content.category}
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                      {content.message} *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      placeholder={content.messagePlaceholder}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
                    />
                  </div>

                  <div className="text-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-sky-600 text-white px-8 py-3 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {content.sending}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          {content.sendMessage}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/* FAQ Section */}
            <section>
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-slate-800">
                {content.faqTitle}
              </h2>
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {content.faq1}
                  </h3>
                  <p className="text-slate-600">{content.faq1Answer}</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {content.faq2}
                  </h3>
                  <p className="text-slate-600">{content.faq2Answer}</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {content.faq3}
                  </h3>
                  <p className="text-slate-600">{content.faq3Answer}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-sky-600" />
                {content.getInTouch}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-sky-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{content.address}</p>
                    <p className="text-slate-600 text-sm">{content.addressValue}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{content.phone}</p>
                    <p className="text-slate-600 text-sm">{content.phoneValue}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{content.email}</p>
                    <p className="text-slate-600 text-sm">{content.emailValue}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-rose-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{content.hours}</p>
                    <p className="text-slate-600 text-sm">{content.hoursValue}</p>
                    <p className="text-slate-600 text-sm">{content.weekend}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Star className="h-5 w-5 mr-2 text-amber-600" />
                {isEnglish ? 'Additional Information' : 'अतिरिक्त जानकारी'}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{content.responseTime}</p>
                    <p className="text-xs text-slate-600">{content.responseTimeValue}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-sky-50 rounded-lg">
                  <Clock className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{content.support}</p>
                    <p className="text-xs text-slate-600">{content.supportValue}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Office Location */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-emerald-600" />
                {isEnglish ? 'Office Location' : 'कार्यालय स्थान'}
              </h3>
              
              <div className="space-y-3">
                <PhotoPlaceholder type="building" size="lg" className="w-full" />
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-800">{content.addressValue}</p>
                  <p className="text-xs text-slate-600">
                    {isEnglish ? 'Main Office - Bihar Region' : 'मुख्य कार्यालय - बिहार क्षेत्र'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;