"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Users, Laptop, HeartPulse, Rocket, BookOpen, Dumbbell, Palette, MapPin, GraduationCap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const clubSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  icon: z.string().min(1, "Icon is required"),
})

type ClubForm = z.infer<typeof clubSchema>

interface CreateClubDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  userId?: string
}

const icons = [
  { value: "users", label: "Users", icon: Users },
  { value: "laptop", label: "Technology", icon: Laptop },
  { value: "heart-pulse", label: "Health", icon: HeartPulse },
  { value: "rocket", label: "Startup", icon: Rocket },
  { value: "book-open", label: "Education", icon: BookOpen },
  { value: "dumbbell", label: "Fitness", icon: Dumbbell },
  { value: "palette", label: "Arts", icon: Palette },
  { value: "map-pin", label: "Regional", icon: MapPin },
  { value: "graduation-cap", label: "Academic", icon: GraduationCap },
]

export function CreateClubDialog({ open, onOpenChange, onSuccess, userId }: CreateClubDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ClubForm>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "interest",
      icon: "users",
    },
  })

  const selectedIcon = watch("icon")

  const onSubmit = async (data: ClubForm) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to create a club.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/clubs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown server error" }))
        throw new Error(errorData.error || `Server returned ${response.status}`)
      }

      toast({
        title: "Success! 🎉",
        description: "Club created successfully! You've been added as the first member.",
      })

      reset()
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Failed to create club",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create New Club</DialogTitle>
            <DialogDescription>
              Start a new community for fellow alumni. You'll earn 15 bonus points when your club reaches 10 members.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Club Name</Label>
              <Input
                id="name"
                placeholder="e.g. Nairobi Tech Alumni"
                {...register("name")}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                onValueChange={(value) => setValue("category", value)} 
                defaultValue="interest"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="interest">Interest</SelectItem>
                  <SelectItem value="regional">Regional</SelectItem>
                  <SelectItem value="batch">Batch-wise</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-5 gap-2">
                {icons.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.value}
                      type="button"
                      variant={selectedIcon === item.value ? "default" : "outline"}
                      className="h-10 w-10 p-0"
                      onClick={() => setValue("icon", item.value)}
                      title={item.label}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  )
                })}
              </div>
              {errors.icon && <p className="text-sm text-destructive">{errors.icon.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this club about? Who should join?"
                className="min-h-[100px]"
                {...register("description")}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Club"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
