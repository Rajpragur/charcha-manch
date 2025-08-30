-- Complete Database Schema for Charcha Manch
-- Run this script in your Supabase SQL Editor

-- Create sequence for nagrik numbers
CREATE SEQUENCE IF NOT EXISTS nagrik_number_seq START 1001;

-- 1. User Profiles Table (Enhanced)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  phone_number TEXT,
  first_vote_year INTEGER,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES user_profiles(id),
  tier_level INTEGER DEFAULT 1,
  engagement_score INTEGER DEFAULT 0,
  constituency_id INTEGER, -- Will be set during onboarding
  nagrik_number INTEGER UNIQUE DEFAULT nextval('nagrik_number_seq'), -- Unique nagrik number for each user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Constituencies Table (Enhanced with user counts)
CREATE TABLE constituencies (
  id SERIAL PRIMARY KEY,
  area_name TEXT NOT NULL,
  area_name_hi TEXT NOT NULL,
  district TEXT,
  state TEXT DEFAULT 'Bihar',
  total_users INTEGER DEFAULT 0,
  level1_users INTEGER DEFAULT 0,
  level2_users INTEGER DEFAULT 0,
  level3_users INTEGER DEFAULT 0,
  level4_users INTEGER DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Candidates Table (Enhanced)
CREATE TABLE candidates (
  id SERIAL PRIMARY KEY,
  constituency_id INTEGER REFERENCES constituencies(id),
  name TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  image_url TEXT,
  age INTEGER,
  party_name TEXT NOT NULL,
  party_name_hi TEXT NOT NULL,
  party_icon_url TEXT,
  experience TEXT,
  education TEXT,
  net_worth DECIMAL(15,2),
  criminal_cases INTEGER DEFAULT 0,
  attendance_percentage DECIMAL(5,2),
  questions_asked INTEGER DEFAULT 0,
  funds_utilisation TEXT,
  manifesto_score DECIMAL(5,2) DEFAULT 0,
  last_election_vote_percentage DECIMAL(5,2),
  manifesto_link TEXT,
  is_current_representative BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. News Table
CREATE TABLE news (
  id SERIAL PRIMARY KEY,
  constituency_id INTEGER REFERENCES constituencies(id),
  title TEXT NOT NULL,
  title_hi TEXT NOT NULL,
  content TEXT,
  content_hi TEXT,
  image_url TEXT,
  source TEXT,
  published_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User Engagement Table
CREATE TABLE user_engagement (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  constituency_id INTEGER REFERENCES constituencies(id),
  engagement_type TEXT CHECK (engagement_type IN ('vote', 'comment', 'post', 'share', 'like')),
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Satisfaction Surveys Table
CREATE TABLE satisfaction_surveys (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  constituency_id INTEGER REFERENCES constituencies(id),
  candidate_id INTEGER REFERENCES candidates(id),
  question TEXT NOT NULL,
  answer BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Discussion Posts Table
CREATE TABLE discussion_posts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  constituency_id INTEGER REFERENCES constituencies(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT CHECK (post_type IN ('general', 'issue', 'suggestion', 'question')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'deleted')),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Post Interactions Table
CREATE TABLE post_interactions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES discussion_posts(id),
  user_id UUID REFERENCES auth.users(id),
  interaction_type TEXT CHECK (interaction_type IN ('like', 'dislike', 'comment', 'share')),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Referrals Table
CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id),
  referred_email TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Department Ratings Table (New)
CREATE TABLE department_ratings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  constituency_id INTEGER REFERENCES constituencies(id),
  department TEXT NOT NULL CHECK (department IN ('Health', 'Education', 'Crime', 'Infrastructure')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Global Stats Table (New - for caching daily stats)
CREATE TABLE global_stats (
  id SERIAL PRIMARY KEY,
  total_users INTEGER NOT NULL,
  level1_users INTEGER NOT NULL,
  level2_users INTEGER NOT NULL,
  level3_users INTEGER NOT NULL,
  level4_users INTEGER NOT NULL,
  total_constituencies INTEGER NOT NULL,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_constituency_id ON user_profiles(constituency_id);
CREATE INDEX idx_user_profiles_tier_level ON user_profiles(tier_level);
CREATE INDEX idx_candidates_constituency_id ON candidates(constituency_id);
CREATE INDEX idx_candidates_party_name ON candidates(party_name);
CREATE INDEX idx_user_engagement_user_id ON user_engagement(user_id);
CREATE INDEX idx_user_engagement_constituency_id ON user_engagement(constituency_id);
CREATE INDEX idx_satisfaction_surveys_constituency_id ON satisfaction_surveys(constituency_id);
CREATE INDEX idx_discussion_posts_constituency_id ON discussion_posts(constituency_id);
CREATE INDEX idx_department_ratings_constituency_id ON department_ratings(constituency_id);
CREATE INDEX idx_global_stats_last_calculated ON global_stats(last_calculated);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_stats ENABLE ROW LEVEL SECURITY;

-- Public read access for constituencies, candidates, and news
CREATE POLICY "Public read access for constituencies" ON constituencies FOR SELECT USING (true);
CREATE POLICY "Public read access for candidates" ON candidates FOR SELECT USING (true);
CREATE POLICY "Public read access for news" ON news FOR SELECT USING (true);
CREATE POLICY "Public read access for global stats" ON global_stats FOR SELECT USING (true);

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can view all posts but only edit their own
CREATE POLICY "Public read access for posts" ON discussion_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON discussion_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON discussion_posts FOR UPDATE USING (auth.uid() = user_id);

-- Users can view all satisfaction surveys but only submit their own
CREATE POLICY "Public read access for satisfaction surveys" ON satisfaction_surveys FOR SELECT USING (true);
CREATE POLICY "Users can insert own satisfaction surveys" ON satisfaction_surveys FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view all department ratings but only submit their own
CREATE POLICY "Public read access for department ratings" ON department_ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert own department ratings" ON department_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view all user engagement but only submit their own
CREATE POLICY "Public read access for user engagement" ON user_engagement FOR SELECT USING (true);
CREATE POLICY "Users can insert own user engagement" ON user_engagement FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view all referrals but only submit their own
CREATE POLICY "Public read access for referrals" ON referrals FOR SELECT USING (true);
CREATE POLICY "Users can insert own referrals" ON referrals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert sample data
INSERT INTO constituencies (area_name, area_name_hi, district) VALUES
('Patna Sahib', 'पटना साहिब', 'Patna'),
('Patna Central', 'पटना सेंट्रल', 'Patna'),
('Banka', 'बांका', 'Banka'),
('Gaya', 'गया', 'Gaya'),
('Bhagalpur', 'भागलपुर', 'Bhagalpur'),
('Muzaffarpur', 'मुजफ्फरपुर', 'Muzaffarpur'),
('Darbhanga', 'दरभंगा', 'Darbhanga'),
('Purnia', 'पूर्णिया', 'Purnia'),
('Katihar', 'कटिहार', 'Katihar'),
('Saharsa', 'सहरसा', 'Saharsa');

-- Insert sample candidates
INSERT INTO candidates (constituency_id, name, name_hi, party_name, party_name_hi, age, experience, education, net_worth, criminal_cases, manifesto_score, last_election_vote_percentage, manifesto_link) VALUES
(1, 'Ravi Shankar Prasad', 'रवि शंकर प्रसाद', 'Bharatiya Janata Party', 'भारतीय जनता पार्टी', 65, 'Former Union Minister', 'LLB, Patna University', 25000000, 0, 85.5, 52.3, 'https://example.com/manifesto1'),
(2, 'Tejashwi Yadav', 'तेजस्वी यादव', 'Rashtriya Janata Dal', 'राष्ट्रीय जनता दल', 34, 'Former Deputy CM', 'Class 12', 15000000, 2, 72.1, 48.7, 'https://example.com/manifesto2'),
(3, 'Giriraj Singh', 'गिरिराज सिंह', 'Bharatiya Janata Party', 'भारतीय जनता पार्टी', 68, 'Union Minister', 'BSc, Agriculture', 45000000, 1, 78.9, 54.2, 'https://example.com/manifesto3'),
(4, 'Jitan Ram Manjhi', 'जीतन राम मांझी', 'Hindustani Awam Morcha', 'हिंदुस्तानी अवाम मोर्चा', 75, 'Former CM', 'Class 8', 8000000, 0, 65.4, 42.1, 'https://example.com/manifesto4'),
(5, 'Aditya Sahu', 'आदित्य साहू', 'Indian National Congress', 'भारतीय राष्ट्रीय कांग्रेस', 45, 'MLA', 'MA, Political Science', 12000000, 0, 68.2, 38.5, 'https://example.com/manifesto5'),
(6, 'Ajay Nishad', 'अजय निशाद', 'Bharatiya Janata Party', 'भारतीय जनता पार्टी', 52, 'MP', 'BSc, Engineering', 18000000, 1, 82.1, 56.3, 'https://example.com/manifesto6'),
(7, 'Kirti Azad', 'कीर्ति आजाद', 'Bharatiya Janata Party', 'भारतीय जनता पार्टी', 64, 'Former MP', 'BSc, Physics', 22000000, 0, 75.8, 49.2, 'https://example.com/manifesto7'),
(8, 'Pappu Yadav', 'पप्पू यादव', 'Rashtriya Janata Dal', 'राष्ट्रीय जनता दल', 58, 'Former MP', 'BA, History', 16000000, 3, 70.4, 44.7, 'https://example.com/manifesto8'),
(9, 'Tariq Anwar', 'तारिक अनवर', 'Nationalist Congress Party', 'राष्ट्रवादी कांग्रेस पार्टी', 72, 'Former MP', 'MA, Urdu', 14000000, 0, 73.6, 41.8, 'https://example.com/manifesto9'),
(10, 'Dinesh Chandra Yadav', 'दिनेश चंद्र यादव', 'Janata Dal (United)', 'जनता दल (यूनाइटेड)', 55, 'MLA', 'BSc, Mathematics', 11000000, 0, 79.2, 51.4, 'https://example.com/manifesto10');

-- Insert sample news
INSERT INTO news (constituency_id, title, title_hi, published_date) VALUES
(1, 'New infrastructure project announced in Patna Sahib', 'पटना साहिब में नई बुनियादी ढांचा परियोजना की घोषणा', '2025-01-15'),
(2, 'Education reforms implemented in Patna Central', 'पटना सेंट्रल में शिक्षा सुधार लागू', '2025-01-14'),
(3, 'Road construction completed in Banka district', 'बांका जिले में सड़क निर्माण पूरा', '2025-01-13'),
(4, 'Healthcare facilities improved in Gaya', 'गया में स्वास्थ्य सुविधाएं बेहतर', '2025-01-12'),
(5, 'Water supply project launched in Bhagalpur', 'भागलपुर में जल आपूर्ति परियोजना शुरू', '2025-01-11'),
(6, 'Agricultural support scheme in Muzaffarpur', 'मुजफ्फरपुर में कृषि सहायता योजना', '2025-01-10'),
(7, 'Digital literacy program in Darbhanga', 'दरभंगा में डिजिटल साक्षरता कार्यक्रम', '2025-01-09'),
(8, 'Tourism development in Purnia', 'पूर्णिया में पर्यटन विकास', '2025-01-08'),
(9, 'Industrial growth in Katihar', 'कटिहार में औद्योगिक विकास', '2025-01-07'),
(10, 'Educational excellence in Saharsa', 'सहरसा में शैक्षिक उत्कृष्टता', '2025-01-06');

-- Insert initial global stats
INSERT INTO global_stats (total_users, level1_users, level2_users, level3_users, level4_users, total_constituencies) VALUES
(0, 0, 0, 0, 0, 10);

-- Create function to update constituency user counts
CREATE OR REPLACE FUNCTION update_constituency_user_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update constituency stats when user profile changes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update constituency user counts
    UPDATE constituencies 
    SET 
      total_users = (
        SELECT COUNT(*) FROM user_profiles WHERE constituency_id = NEW.constituency_id
      ),
      level1_users = (
        SELECT COUNT(*) FROM user_profiles WHERE constituency_id = NEW.constituency_id AND tier_level = 1
      ),
      level2_users = (
        SELECT COUNT(*) FROM user_profiles WHERE constituency_id = NEW.constituency_id AND tier_level = 2
      ),
      level3_users = (
        SELECT COUNT(*) FROM user_profiles WHERE constituency_id = NEW.constituency_id AND tier_level = 3
      ),
      level4_users = (
        SELECT COUNT(*) FROM user_profiles WHERE constituency_id = NEW.constituency_id AND tier_level = 4
      ),
      last_calculated = NOW()
    WHERE id = NEW.constituency_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    -- Update constituency stats when user profile is deleted
    UPDATE constituencies 
    SET 
      total_users = (
        SELECT COUNT(*) FROM user_profiles WHERE constituency_id = OLD.constituency_id
      ),
      level1_users = (
        SELECT COUNT(*) FROM user_profiles WHERE constituency_id = OLD.constituency_id AND tier_level = 1
      ),
      level2_users = (
        SELECT COUNT(*) FROM user_profiles WHERE constituency_id = OLD.constituency_id AND tier_level = 2
      ),
      level3_users = (
        SELECT COUNT(*) FROM user_profiles WHERE constituency_id = OLD.constituency_id AND tier_level = 3
      ),
      level4_users = (
        SELECT COUNT(*) FROM user_profiles WHERE constituency_id = OLD.constituency_id AND tier_level = 4
      ),
      last_calculated = NOW()
    WHERE id = OLD.constituency_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user profile changes
CREATE TRIGGER trigger_update_constituency_user_counts
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_constituency_user_counts();

-- Create function to update global stats
CREATE OR REPLACE FUNCTION update_global_stats()
RETURNS void AS $$
BEGIN
  -- Update global stats
  INSERT INTO global_stats (total_users, level1_users, level2_users, level3_users, level4_users, total_constituencies, last_calculated)
  SELECT 
    SUM(total_users),
    SUM(level1_users),
    SUM(level2_users),
    SUM(level3_users),
    SUM(level4_users),
    COUNT(*),
    NOW()
  FROM constituencies
  ON CONFLICT (id) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    level1_users = EXCLUDED.level1_users,
    level2_users = EXCLUDED.level2_users,
    level3_users = EXCLUDED.level3_users,
    level4_users = EXCLUDED.level4_users,
    total_constituencies = EXCLUDED.total_constituencies,
    last_calculated = EXCLUDED.last_calculated;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job or scheduled function to update global stats daily
-- This can be done through Supabase's pg_cron extension or external cron jobs

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated; 