import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Users, Target, Award, Shield, Heart, Zap, CheckCircle } from 'lucide-react';
import PhotoPlaceholder from '../components/PhotoPlaceholder';

const About: React.FC = () => {
  const { isEnglish } = useLanguage();

  const content = {
    title: isEnglish ? 'About Us' : 'हमारे बारे में',
    subtitle: isEnglish ? 'Empowering Democracy Through Digital Participation' : 'डिजिटल भागीदारी के माध्यम से लोकतंत्र को सशक्त बनाना',
    description: isEnglish 
      ? 'We are a dedicated platform committed to strengthening democracy in Bihar by providing citizens with tools and opportunities to actively participate in political discussions, track development progress, and hold representatives accountable.'
      : 'हम एक समर्पित मंच हैं जो बिहार में लोकतंत्र को मजबूत करने के लिए प्रतिबद्ध हैं, नागरिकों को राजनीतिक चर्चाओं में सक्रिय रूप से भाग लेने, विकास प्रगति को ट्रैक करने और प्रतिनिधियों को जवाबदेह बनाने के लिए उपकरण और अवसर प्रदान करते हैं।',
    
    // Mission & Vision
    missionTitle: isEnglish ? 'Our Mission' : 'हमारा मिशन',
    mission: isEnglish 
      ? 'To create an inclusive digital platform that bridges the gap between citizens and their representatives, fostering transparency, accountability, and active civic engagement in Bihar.'
      : 'एक समावेशी डिजिटल मंच बनाना जो नागरिकों और उनके प्रतिनिधियों के बीच की खाई को पाटे, बिहार में पारदर्शिता, जवाबदेही और सक्रिय नागरिक भागीदारी को बढ़ावा दे।',
    
    visionTitle: isEnglish ? 'Our Vision' : 'हमारी दृष्टि',
    vision: isEnglish 
      ? 'A Bihar where every citizen has a voice, every concern is heard, and every development project is transparently tracked and discussed.'
      : 'एक बिहार जहां हर नागरिक की आवाज़ हो, हर चिंता सुनी जाए, और हर विकास परियोजना को पारदर्शिता के साथ ट्रैक और चर्चा किया जाए।',
    
    // Values
    valuesTitle: isEnglish ? 'Our Core Values' : 'हमारे मूल मूल्य',
    transparency: isEnglish ? 'Transparency' : 'पारदर्शिता',
    transparencyDesc: isEnglish ? 'We believe in open and honest communication about all political and development activities.' : 'हम सभी राजनीतिक और विकास गतिविधियों के बारे में खुली और ईमानदार संचार में विश्वास करते हैं।',
    
    accountability: isEnglish ? 'Accountability' : 'जवाबदेही',
    accountabilityDesc: isEnglish ? 'We hold ourselves and our representatives responsible for their actions and promises.' : 'हम अपने आप को और अपने प्रतिनिधियों को उनके कार्यों और वादों के लिए जिम्मेदार मानते हैं।',
    
    inclusivity: isEnglish ? 'Inclusivity' : 'समावेशिता',
    inclusivityDesc: isEnglish ? 'Every voice matters, regardless of background, location, or political affiliation.' : 'हर आवाज़ मायने रखती है, चाहे पृष्ठभूमि, स्थान या राजनीतिक संबद्धता कुछ भी हो।',
    
    innovation: isEnglish ? 'Innovation' : 'नवाचार',
    innovationDesc: isEnglish ? 'We continuously evolve our platform to better serve the needs of Bihar\'s citizens.' : 'हम बिहार के नागरिकों की जरूरतों को बेहतर ढंग से पूरा करने के लिए अपने मंच को लगातार विकसित करते हैं।',
    
    // What We Do
    whatWeDoTitle: isEnglish ? 'What We Do' : 'हम क्या करते हैं',
    constituencyTracking: isEnglish ? 'Constituency Tracking' : 'निर्वाचन क्षेत्र ट्रैकिंग',
    constituencyTrackingDesc: isEnglish ? 'Monitor development projects and progress in all 243 constituencies of Bihar.' : 'बिहार के सभी 243 निर्वाचन क्षेत्रों में विकास परियोजनाओं और प्रगति की निगरानी करें।',
    
    citizenForum: isEnglish ? 'Citizen Forum' : 'नागरिक मंच',
    citizenForumDesc: isEnglish ? 'Provide a platform for citizens to discuss issues, share concerns, and propose solutions.' : 'नागरिकों को मुद्दों पर चर्चा करने, चिंताएं साझा करने और समाधान प्रस्तावित करने के लिए मंच प्रदान करें।',
    
    representativeConnect: isEnglish ? 'Representative Connect' : 'प्रतिनिधि कनेक्ट',
    representativeConnectDesc: isEnglish ? 'Bridge the gap between citizens and their elected representatives.' : 'नागरिकों और उनके निर्वाचित प्रतिनिधियों के बीच की खाई को पाटें।',
    
    developmentMonitoring: isEnglish ? 'Development Monitoring' : 'विकास निगरानी',
    developmentMonitoringDesc: isEnglish ? 'Track and analyze the progress of government initiatives and projects.' : 'सरकारी पहलों और परियोजनाओं की प्रगति को ट्रैक और विश्लेषण करें।',
    
    // Team
    teamTitle: isEnglish ? 'Our Team' : 'हमारी टीम',
    teamDesc: isEnglish ? 'A diverse group of professionals committed to digital democracy and citizen empowerment.' : 'डिजिटल लोकतंत्र और नागरिक सशक्तिकरण के लिए प्रतिबद्ध पेशेवरों का एक विविध समूह।',
    
    // Contact
    contactTitle: isEnglish ? 'Get In Touch' : 'संपर्क करें',
    contactDesc: isEnglish ? 'Have questions or suggestions? We\'d love to hear from you.' : 'कोई सवाल या सुझाव है? हम आपसे सुनना चाहेंगे।',
    
    address: isEnglish ? 'Address' : 'पता',
    addressValue: isEnglish ? 'Patna, Bihar, India' : 'पटना, बिहार, भारत',
    phone: isEnglish ? 'Phone' : 'फोन',
    phoneValue: '+91-XXX-XXX-XXXX',
    email: isEnglish ? 'Email' : 'ईमेल',
    emailValue: 'info@charchamanch.com',
    hours: isEnglish ? 'Working Hours' : 'कार्य समय',
    hoursValue: isEnglish ? 'Monday - Friday: 9:00 AM - 6:00 PM' : 'सोमवार - शुक्रवार: सुबह 9:00 - शाम 6:00',
    
    // Stats
    statsTitle: isEnglish ? 'Our Impact' : 'हमारा प्रभाव',
    constituencies: isEnglish ? 'Constituencies Covered' : 'कवर किए गए निर्वाचन क्षेत्र',
    activeUsers: isEnglish ? 'Active Users' : 'सक्रिय उपयोगकर्ता',
    discussions: isEnglish ? 'Discussions Started' : 'शुरू की गई चर्चाएं',
    projects: isEnglish ? 'Projects Tracked' : 'ट्रैक की गई परियोजनाएं'
  };

  const values = [
    { title: content.transparency, description: content.transparencyDesc, icon: <Shield className="h-8 w-8" />, color: 'text-sky-600' },
    { title: content.accountability, description: content.accountabilityDesc, icon: <CheckCircle className="h-8 w-8" />, color: 'text-emerald-600' },
    { title: content.inclusivity, description: content.inclusivityDesc, icon: <Heart className="h-8 w-8" />, color: 'text-rose-600' },
    { title: content.innovation, description: content.innovationDesc, icon: <Zap className="h-8 w-8" />, color: 'text-amber-600' }
  ];

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
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {/*<div className="w-full bg-white border-b border-slate-200">
        <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-slate-800">
            {content.statsTitle}
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`${stat.color} mb-3 flex justify-center`}>
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-slate-800 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>*/}

      <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Mission & Vision */}
            <section>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                    <Target className="h-6 w-6 mr-2 text-sky-600" />
                    {content.missionTitle}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {content.mission}
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                    <Award className="h-6 w-6 mr-2 text-amber-600" />
                    {content.visionTitle}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {content.vision}
                  </p>
                </div>
              </div>
            </section>

            {/* Core Values */}
            <section>
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-slate-800">
                {content.valuesTitle}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {values.map((value, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
                    <div className={`${value.color} mb-4 flex justify-center`}>
                      {value.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 text-center">
                      {value.title}
                    </h3>
                    <p className="text-slate-600 text-center leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* What We Do */}
            <section>
              {/*
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-slate-800">
                {content.whatWeDoTitle}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {services.map((service, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
                    <div className={`${service.color} mb-4 flex justify-center`}>
                      {service.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 text-center">
                      {service.title}
                    </h3>
                    <p className="text-slate-600 text-center leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                ))}
              </div>
              */}
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Contact Information */}
            {/*
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-sky-600" />
                {content.contactTitle}
              </h3>
              <p className="text-slate-600 mb-4 text-sm">
                {content.contactDesc}
              </p>
              
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
                  </div>
                </div>
              </div>
            </div>
            */}

            {/* Team Info */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-emerald-600" />
                {content.teamTitle}
              </h3>
              <p className="text-slate-600 mb-4 text-sm">
                {content.teamDesc}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <PhotoPlaceholder type="group" size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {isEnglish ? 'Development Team' : 'विकास टीम'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {isEnglish ? 'Technology & Platform' : 'तकनीक और मंच'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <PhotoPlaceholder type="group" size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {isEnglish ? 'Content Team' : 'सामग्री टीम'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {isEnglish ? 'Research & Analysis' : 'अनुसंधान और विश्लेषण'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <PhotoPlaceholder type="group" size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {isEnglish ? 'Community Team' : 'समुदाय टीम'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {isEnglish ? 'User Engagement' : 'उपयोगकर्ता जुड़ाव'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;