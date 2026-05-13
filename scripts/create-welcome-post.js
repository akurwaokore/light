
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manual env parsing since dotenv isn't available to the script
const envPath = path.resolve(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) {
    env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1')
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createPost() {
  const userId = "ee7f6d28-0c59-4cf1-b020-08a699c7d06a"
  const content = "Welcome to the Light Alumni Connect community! We are excited to have you here. Share your professional updates, network with fellow alumni, and stay connected with the Light Group of Schools community. #Alumni #Networking #LightAlumni"

  console.log("Creating welcome post for user:", userId)

  const { data, error } = await supabase
    .from('posts')
    .insert([
      {
        author_id: userId,
        content: content,
        visibility: 'public',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select()

  if (error) {
    console.error("Error creating post:", error)
    
    // Check if it's a schema issue and try fallback
    console.log("Retrying with minimal schema...")
    const { data: data2, error: error2 } = await supabase
      .from('posts')
      .insert([
        {
          author_id: userId,
          content: content
        }
      ])
      .select()
      
    if (error2) {
      console.error("Fallback failed too:", error2)
    } else {
      console.log("Post created successfully (fallback):", data2)
    }
  } else {
    console.log("Post created successfully:", data)
  }
}

createPost()
