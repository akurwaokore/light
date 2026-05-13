import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixClubImages() {
  console.log('Populating club images...')

  const clubImages = [
    {
      name: 'Mombasa Chapter',
      image_url: '/mombasa-kenya-beach-coastal-city.jpg'
    },
    {
      name: 'Europe Chapter',
      image_url: '/berlin-germany-brandenburg-gate.jpg'
    },
    {
      name: 'Asia Chapter',
      image_url: '/kuala-lumpur-malaysia-petronas-towers.jpg'
    },
    {
        name: 'Nairobi Chapter',
        image_url: '/nairobi-kenya-skyline-cityscape.jpg'
    },
    {
        name: 'United Kingdom Chapter',
        image_url: '/london-uk-big-ben-thames-river.jpg'
    },
    {
        name: 'United States Chapter',
        image_url: '/new-york-city-skyline-manhattan.jpg'
    }
  ]

  for (const item of clubImages) {
    console.log(`Updating ${item.name}...`)
    const { data, error } = await supabase
      .from('clubs')
      .update({ image_url: item.image_url })
      .ilike('name', `%${item.name}%`)
      .select()

    if (error) {
      console.error(`Error updating ${item.name}:`, error)
    } else {
      console.log(`Updated ${item.name}:`, data?.length || 0, 'rows')
    }
  }

  // Also fix categories if they are 'cluster' to 'regional'
  console.log('Ensuring all chapters have "regional" category...')
  const { error: catError } = await supabase
    .from('clubs')
    .update({ category: 'regional' })
    .ilike('name', '%chapter%')
  
  if (catError) console.error('Error updating categories:', catError)

  console.log('Done.')
}

fixClubImages()
