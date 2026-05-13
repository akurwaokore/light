import { createServerClient } from "@/lib/supabase/server"

const seedData = {
  profiles: [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      email: "sarah@example.com",
      display_name: "Sarah Kimani",
      photo_url: "/african-woman-professional.jpg",
      campus: "Light Academy Nairobi",
      graduation_year: 2012,
      job_title: "Product Manager",
      company: "Google",
      location: "San Francisco",
      city: "San Francisco",
      country: "USA",
      is_admin: false,
    },
  ],
}

export async function seedDatabase() {
  try {
    const supabase = await createServerClient()

    console.log("Starting database seed...")

    // Seed profiles
    for (const profile of seedData.profiles) {
      const { error } = await supabase.from("profiles").upsert([profile], { onConflict: "id" })
      if (error) {
        console.error("Error seeding profile:", error)
      }
    }

    console.log("Database seeded successfully!")
    return true
  } catch (error) {
    console.error("Error seeding database:", error)
    return false
  }
}
