import { z } from "zod"

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain an uppercase letter")
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain a lowercase letter")
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain a number")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function sanitizeText(text: string): string {
  return text.replace(/[<>]/g, "").trim().substring(0, 5000)
}

export function validatePostContent(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: "Post content cannot be empty" }
  }
  if (content.length > 10000) {
    return { valid: false, error: "Post content exceeds maximum length" }
  }
  return { valid: true }
}

export function validateProductData(data: {
  name?: string
  description?: string
  price?: number
  category?: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.name || data.name.trim().length === 0) {
    errors.push("Product name is required")
  }
  if (!data.description || data.description.trim().length === 0) {
    errors.push("Product description is required")
  }
  if (!data.price || data.price < 0) {
    errors.push("Product price must be a positive number")
  }
  if (!data.category || data.category.trim().length === 0) {
    errors.push("Product category is required")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Alumni CV Upload Requirements Schema
export const educationSchema = z.object({
  institution: z.string().min(2, "Institution name is required"),
  degree: z.string().min(2, "Degree/Certificate is required"),
  field: z.string().min(2, "Field of study is required"),
  startYear: z.string().regex(/^\d{4}$/, "Must be a valid year"),
  endYear: z.string().regex(/^\d{4}$/, "Must be a valid year"),
  grade: z.string().optional(),
})

export const workExperienceSchema = z.object({
  company: z.string().min(2, "Company name is required"),
  title: z.string().min(2, "Job title is required"),
  period: z.string().min(2, "Employment period is required (e.g., Month/Year – Month/Year)"),
  responsibilities: z.array(z.string().min(5)).min(1, "At least one responsibility is required"),
})

export const languageSchema = z.object({
  name: z.string().min(2, "Language name is required"),
  proficiency: z.string().min(2, "Proficiency level is required"),
})

export const cvFormSchema = z.object({
  // 1. Personal Information
  fullName: z.string().min(2, "Full name is required as in ID/Passport"),
  phone: z.string().min(5, "Phone number with country code is required"),
  email: z.string().email("Valid professional email is required"),
  city: z.string().min(2, "Current city is required"),
  country: z.string().min(2, "Current country is required"),
  linkedIn: z.string().url("Must be a valid LinkedIn URL").optional().or(z.literal("")),
  graduationYear: z.string().regex(/^\d{4}$/, "Must be a valid year"),
  
  // 2. Education Background
  education: z.array(educationSchema).min(1, "At least one education entry is required"),
  
  // 3. Work Experience
  workExperience: z.array(workExperienceSchema).optional(),
  
  // 4. Skills
  technicalSkills: z.array(z.string()).min(1, "At least one technical skill is required"),
  softSkills: z.array(z.string()).min(1, "At least one soft skill is required"),
  languages: z.array(languageSchema).min(1, "At least one language is required"),
  
  // 5. Certifications & Trainings
  certifications: z.array(z.object({
    name: z.string(),
    organization: z.string(),
    year: z.string(),
  })).optional(),
  
  // 6. Volunteer Experience
  volunteerExperience: z.array(z.object({
    organization: z.string(),
    role: z.string(),
    period: z.string(),
    description: z.string(),
  })).optional(),
  
  // 7. CV File
  // Note: File validation is usually handled separately in the form or via a custom zod check for File objects
  
  // 8. Declaration
  declaration: z.boolean().refine(val => val === true, {
    message: "You must confirm that the information is accurate"
  }),
})

export type CVFormValues = z.infer<typeof cvFormSchema>
