"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { cvFormSchema, type CVFormValues } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus, 
  Trash2, 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Briefcase,
  GraduationCap,
  User,
  Wrench,
  Award,
  Heart
} from "lucide-react"

export function AlumniCVForm() {
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CVFormValues>({
    resolver: zodResolver(cvFormSchema),
    defaultValues: {
      education: [{ institution: "", degree: "", field: "", startYear: "", endYear: "" }],
      workExperience: [{ company: "", title: "", period: "", responsibilities: [""] }],
      technicalSkills: [""],
      softSkills: [""],
      languages: [{ name: "", proficiency: "" }],
      declaration: false,
      certifications: [],
      volunteerExperience: []
    },
  })

  // Field arrays for dynamic sections
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control,
    name: "education",
  })

  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({
    control,
    name: "workExperience",
  })

  const { fields: techFields, append: appendTech, remove: removeTech } = useFieldArray({
    control,
    name: "technicalSkills" as any,
  })

  const { fields: softFields, append: appendSoft, remove: removeSoft } = useFieldArray({
    control,
    name: "softSkills" as any,
  })

  const { fields: langFields, append: appendLang, remove: removeLang } = useFieldArray({
    control,
    name: "languages",
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        setSubmitError("Only PDF files are allowed")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError("File size must be less than 5MB")
        return
      }
      setCvFile(file)
      setSubmitError("")
    }
  }

  const onSubmit = async (values: CVFormValues) => {
    if (!cvFile) {
      setSubmitError("Please upload your CV in PDF format")
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

    try {
      const formData = new FormData()
      formData.append("file", cvFile)
      formData.append("data", JSON.stringify(values))
      
      // Auto-naming according to requirements: FullName_GraduationYear_CV.pdf
      const safeName = values.fullName.replace(/\s+/g, "")
      const preferredFileName = `${safeName}_${values.graduationYear}_CV.pdf`
      formData.append("preferredFileName", preferredFileName)

      const response = await fetch("/api/cv/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitSuccess(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setSubmitError(result.error || "Failed to submit CV")
      }
    } catch (error) {
      setSubmitError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <Card className="mx-auto max-w-2xl text-center">
        <CardContent className="pt-10 pb-10">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">CV Submitted Successfully!</h2>
          <p className="text-muted-foreground mb-6">
            Your profile has been updated and your CV is now searchable by alumni employers.
          </p>
          <Button onClick={() => window.location.reload()}>Submit Another CV</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-10">
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* 1. Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>1. Personal Information</CardTitle>
          </div>
          <CardDescription>Required details as per official documents</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name (as in ID/Passport)</Label>
            <Input id="fullName" {...register("fullName")} placeholder="Ali Hassan" />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (with country code)</Label>
            <Input id="phone" {...register("phone")} placeholder="+254 700 000 000" />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" {...register("email")} placeholder="ali.hassan@example.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="graduationYear">Graduation Year</Label>
            <Input id="graduationYear" {...register("graduationYear")} placeholder="2020" />
            {errors.graduationYear && <p className="text-xs text-destructive">{errors.graduationYear.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Current City</Label>
            <Input id="city" {...register("city")} placeholder="Nairobi" />
            {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Current Country</Label>
            <Input id="country" {...register("country")} placeholder="Kenya" />
            {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="linkedIn">LinkedIn Profile (URL)</Label>
            <Input id="linkedIn" {...register("linkedIn")} placeholder="https://linkedin.com/in/alihassan" />
            {errors.linkedIn && <p className="text-xs text-destructive">{errors.linkedIn.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* 2. Education Background */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <CardTitle>2. Education Background</CardTitle>
          </div>
          <CardDescription>List in chronological order (latest first)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {eduFields.map((field, index) => (
            <div key={field.id} className="relative border p-4 rounded-md space-y-4">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2" 
                onClick={() => removeEdu(index)}
                disabled={eduFields.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Institution Name</Label>
                  <Input {...register(`education.${index}.institution`)} placeholder="Light International School" />
                  {errors.education?.[index]?.institution && <p className="text-xs text-destructive">{errors.education[index]?.institution?.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Degree / Certificate</Label>
                  <Input {...register(`education.${index}.degree`)} placeholder="High School Diploma" />
                  {errors.education?.[index]?.degree && <p className="text-xs text-destructive">{errors.education[index]?.degree?.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Field of Study</Label>
                  <Input {...register(`education.${index}.field`)} placeholder="Science" />
                  {errors.education?.[index]?.field && <p className="text-xs text-destructive">{errors.education[index]?.field?.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Start Year</Label>
                    <Input {...register(`education.${index}.startYear`)} placeholder="2018" />
                    {errors.education?.[index]?.startYear && <p className="text-xs text-destructive">{errors.education[index]?.startYear?.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>End Year</Label>
                    <Input {...register(`education.${index}.endYear`)} placeholder="2022" />
                    {errors.education?.[index]?.endYear && <p className="text-xs text-destructive">{errors.education[index]?.endYear?.message}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendEdu({ institution: "", degree: "", field: "", startYear: "", endYear: "" })}>
            <Plus className="h-4 w-4 mr-2" /> Add Education
          </Button>
        </CardContent>
      </Card>

      {/* 3. Work Experience */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle>3. Work Experience</CardTitle>
          </div>
          <CardDescription>Optional but recommended (latest first)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {workFields.map((field, index) => (
            <div key={field.id} className="relative border p-4 rounded-md space-y-4">
              <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeWork(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input {...register(`workExperience.${index}.company`)} />
                </div>
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input {...register(`workExperience.${index}.title`)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Employment Period (e.g. June 2022 – Present)</Label>
                  <Input {...register(`workExperience.${index}.period`)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Key Responsibilities (one per line)</Label>
                  <Textarea 
                    placeholder="• Developed new features...&#10;• Managed team of 5..." 
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(l => l.trim() !== '');
                      setValue(`workExperience.${index}.responsibilities`, lines);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => appendWork({ company: "", title: "", period: "", responsibilities: [""] })}>
            <Plus className="h-4 w-4 mr-2" /> Add Experience
          </Button>
        </CardContent>
      </Card>

      {/* 4. Skills */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <CardTitle>4. Skills</CardTitle>
          </div>
          <CardDescription>Separate into categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Technical Skills (e.g. JavaScript, Python)</Label>
            <div className="flex flex-wrap gap-2">
              {techFields.map((field, index) => (
                <div key={field.id} className="flex gap-1">
                  <Input className="w-32 h-8 text-xs" {...register(`technicalSkills.${index}` as any)} />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeTech(index)} disabled={techFields.length === 1}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => appendTech("")}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {errors.technicalSkills && <p className="text-xs text-destructive">Technical skills are required</p>}
          </div>

          <div className="space-y-4">
            <Label>Soft Skills (e.g. Leadership, Communication)</Label>
            <div className="flex flex-wrap gap-2">
              {softFields.map((field, index) => (
                <div key={field.id} className="flex gap-1">
                  <Input className="w-32 h-8 text-xs" {...register(`softSkills.${index}` as any)} />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeSoft(index)} disabled={softFields.length === 1}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => appendSoft("")}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {errors.softSkills && <p className="text-xs text-destructive">Soft skills are required</p>}
          </div>

          <div className="space-y-4">
            <Label>Languages & Proficiency</Label>
            <div className="space-y-2">
              {langFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input placeholder="Language" {...register(`languages.${index}.name`)} />
                  <Input placeholder="Proficiency (Native, Fluent, etc.)" {...register(`languages.${index}.proficiency`)} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLang(index)} disabled={langFields.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => appendLang({ name: "", proficiency: "" })}>
                <Plus className="h-4 w-4 mr-2" /> Add Language
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Certifications & 6. Volunteer */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle>5. Certifications (Optional)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-sm text-muted-foreground italic">Add any certifications or trainings you have completed.</p>
             <Button type="button" variant="outline" size="sm">Coming Soon</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <CardTitle>6. Volunteer (Optional)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground italic">List any volunteer work or community service.</p>
            <Button type="button" variant="outline" size="sm">Coming Soon</Button>
          </CardContent>
        </Card>
      </div>

      {/* 7. CV File Format Requirements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            <CardTitle>7. CV File Attachment</CardTitle>
          </div>
          <CardDescription>File format: PDF only, Max 5MB</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="rounded-lg border-2 border-dashed border-border p-4 md:p-8 text-center">
            <FileText className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-sm md:text-base">Upload your CV PDF</h3>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground">PDF only, up to 5MB</p>
            <div className="mt-4">
              <label htmlFor="cv-pdf-upload">
                <input
                  id="cv-pdf-upload"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button variant="outline" asChild type="button" className="w-full sm:w-auto">
                  <span className="cursor-pointer">Browse & Choose PDF</span>
                </Button>
              </label>
            </div>
            {cvFile && (
              <div className="mt-4 p-2 bg-primary/10 rounded flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{cvFile.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 8. Declaration */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="declaration" 
              onCheckedChange={(checked) => setValue("declaration", checked === true)} 
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="declaration"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                8. Declaration
              </label>
              <p className="text-sm text-muted-foreground">
                I confirm that the information provided is accurate and up to date.
              </p>
              {errors.declaration && <p className="text-xs text-destructive">{errors.declaration.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Submitting Profile...
          </>
        ) : (
          "Submit CV & Profile"
        )}
      </Button>
    </form>
  )
}
