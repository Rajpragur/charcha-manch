
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Load existing JSON data
const loadJsonData = () => {
  try {
    const dataPath = path.join(process.cwd(), 'public/data/candidates.json')
    const rawData = fs.readFileSync(dataPath, 'utf8')
    return JSON.parse(rawData)
  } catch (error) {
    console.error('Error loading JSON data:', error)
    return null
  }
}

// Transform JSON data to match database schema
const transformData = (jsonData) => {
  const constituencies = []
  const candidates = []
  const news = []

  jsonData.forEach((item, index) => {
    // Create constituency
    const constituency = {
      id: index + 1,
      area_name: item.area_name,
      area_name_hi: item.area_name, // Same as English for now
      district: 'Bihar', // Default district
      state: 'Bihar'
    }
    constituencies.push(constituency)

    // Create candidate
    const candidate = {
      constituency_id: index + 1,
      name: item.vidhayak_info.name,
      name_hi: item.vidhayak_info.name, // Same as English for now
      image_url: item.vidhayak_info.image_url,
      age: item.vidhayak_info.age,
      party_name: item.vidhayak_info.party_name,
      party_name_hi: item.vidhayak_info.party_name, // Same as English for now
      party_icon_url: item.vidhayak_info.party_icon_url,
      experience: item.vidhayak_info.experience,
      education: item.vidhayak_info.metadata?.education || 'Not specified',
      net_worth: item.vidhayak_info.metadata?.net_worth || 0,
      criminal_cases: item.vidhayak_info.metadata?.criminal_cases || 0,
      attendance_percentage: parseFloat(item.vidhayak_info.metadata?.attendance) || 0,
      questions_asked: parseInt(item.vidhayak_info.metadata?.questions_asked) || 0,
      funds_utilisation: item.vidhayak_info.metadata?.funds_utilisation || 'Not specified',
      manifesto_score: item.vidhayak_info.manifesto_score || 0,
      last_election_vote_percentage: item.vidhayak_info.last_election_vote_percentage || 0,
      is_current_representative: true
    }
    candidates.push(candidate)

    // Create news
    if (item.latest_news && item.latest_news.length > 0) {
      const newsItem = {
        constituency_id: index + 1,
        title: item.latest_news[0].title,
        title_hi: item.latest_news[0].title, // Same as English for now
        content: null,
        content_hi: null,
        image_url: null,
        source: 'Charcha Manch',
        published_date: new Date().toISOString().split('T')[0] // Today's date
      }
      news.push(newsItem)
    }
  })

  return { constituencies, candidates, news }
}

// Insert data into Supabase
const insertData = async (data) => {
  try {
    console.log('Starting data migration...')

    // Insert constituencies
    console.log('Inserting constituencies...')
    const { data: constituenciesData, error: constituenciesError } = await supabase
      .from('constituencies')
      .insert(data.constituencies)
      .select()

    if (constituenciesError) {
      console.error('Error inserting constituencies:', constituenciesError)
      return false
    }
    console.log(`✅ Inserted ${constituenciesData.length} constituencies`)

    // Insert candidates
    console.log('Inserting candidates...')
    const { data: candidatesData, error: candidatesError } = await supabase
      .from('candidates')
      .insert(data.candidates)
      .select()

    if (candidatesError) {
      console.error('Error inserting candidates:', candidatesError)
      return false
    }
    console.log(`✅ Inserted ${candidatesData.length} candidates`)

    // Insert news
    if (data.news.length > 0) {
      console.log('Inserting news...')
      const { data: newsData, error: newsError } = await supabase
        .from('news')
        .insert(data.news)
        .select()

      if (newsError) {
        console.error('Error inserting news:', newsError)
        return false
      }
      console.log(`✅ Inserted ${newsData.length} news items`)
    }

    console.log('🎉 Data migration completed successfully!')
    return true

  } catch (error) {
    console.error('Error during data migration:', error)
    return false
  }
}

// Main migration function
const migrateData = async () => {
  try {
    console.log('🚀 Starting Supabase migration...')

    // Load JSON data
    const jsonData = loadJsonData()
    if (!jsonData) {
      console.error('Failed to load JSON data')
      return
    }

    console.log(`📊 Loaded ${jsonData.length} records from JSON`)

    // Transform data
    const transformedData = transformData(jsonData)
    console.log(`🔄 Transformed data: ${transformedData.constituencies.length} constituencies, ${transformedData.candidates.length} candidates, ${transformedData.news.length} news items`)

    // Insert data
    const success = await insertData(transformedData)
    
    if (success) {
      console.log('✅ Migration completed successfully!')
      console.log('\n📋 Next steps:')
      console.log('1. Verify data in Supabase dashboard')
      console.log('2. Update your .env.local with Supabase credentials')
      console.log('3. Test the application with new database')
    } else {
      console.log('❌ Migration failed!')
    }

  } catch (error) {
    console.error('❌ Migration error:', error)
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData()
}

export { migrateData } 