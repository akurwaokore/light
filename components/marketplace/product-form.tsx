"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, Loader2, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const productSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.string().min(1, "Price is required"),
  category: z.string().min(1, "Category is required"),
})

type ProductForm = z.infer<typeof productSchema>

interface ExistingProduct {
  id: string
  title: string
  description: string
  price: number
  category: string
  images: string[]
}

interface ProductFormProps {
  productType: "product" | "service"
  onSuccess?: () => void
  editMode?: boolean
  existingProduct?: ExistingProduct
}

export function ProductFormComponent({ productType, onSuccess, editMode = false, existingProduct }: ProductFormProps) {
  const [images, setImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues:
      editMode && existingProduct
        ? {
            title: existingProduct.title,
            description: existingProduct.description,
            price: existingProduct.price.toString(),
            category: existingProduct.category,
          }
        : undefined,
  })

  useEffect(() => {
    if (editMode && existingProduct) {
      const existingImages = (existingProduct as any).image_urls || existingProduct.images
      if (existingImages && existingImages.length > 0) {
        setImages(existingImages)
      }
    }
  }, [editMode, existingProduct])

  const title = watch("title")
  const category = watch("category")

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || "Upload failed")
        }

        const data = await response.json()
        setImages((prev) => [...prev, data.url])
      }

      toast({
        title: "Images uploaded",
        description: "Your images have been uploaded successfully",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const generateAIDescription = async () => {
    if (!title || !category) {
      toast({
        title: "Missing information",
        description: "Please enter a title and select a category first",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/marketplace/ai-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          productType,
        }),
      })

      if (!response.ok) throw new Error("Generation failed")

      const data = await response.json()
      setValue("description", data.description)

      toast({
        title: "Description generated",
        description: "AI has created a catchy description for you!",
      })
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate description. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const onSubmit = async (data: ProductForm) => {
    if (images.length === 0) {
      toast({
        title: "Images Required",
        description: "Please upload at least one image for your listing.",
        variant: "destructive",
      })
      // Scroll to top to show image upload area if missing
      document.querySelector("label[for='image-upload']")?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setIsSubmitting(true)

    try {
      const url =
        editMode && existingProduct ? `/api/marketplace/products/${existingProduct.id}` : "/api/marketplace/products"

      const method = editMode ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: editMode ? existingProduct?.id : undefined,
          title: data.title,
          description: data.description,
          price: Number.parseFloat(data.price),
          category: data.category,
          image_urls: images,
          product_type: productType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown server error" }))
        throw new Error(errorData.error || `Server returned ${response.status}`)
      }

      toast({
        title: "Success! 🎉",
        description: editMode
          ? "Your listing has been updated successfully!"
          : "Your item has been posted to the marketplace successfully!",
        className: "bg-green-50 border-green-200 text-green-800",
      })

      onSuccess?.()
    } catch (error: any) {
      toast({
        title: editMode ? "Failed to update listing" : "Failed to create listing",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">
          {editMode ? "Edit" : "Add"} {productType === "product" ? "Product" : "Service"}
        </CardTitle>
        <CardDescription>
          {editMode
            ? "Update your listing. Changes require admin approval."
            : productType === "product"
              ? "List a product for sale to fellow alumni"
              : "Offer your services to the alumni community"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>{productType === "product" ? "Product" : "Service"} Images</Label>
            <div className="rounded-lg border-2 border-dashed border-border p-6">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
              />
              <label htmlFor="image-upload" className="block cursor-pointer text-center">
                {isUploading ? (
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground">First image will be the thumbnail</p>
              </label>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="group relative aspect-square">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Upload ${index + 1}`}
                        className="h-full w-full rounded-lg object-cover"
                      />
                      {index === 0 && (
                        <div className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                          Thumbnail
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-destructive p-1 opacity-0 transition-opacity group-hover:opacity-100"
                        title="Remove image"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4 text-destructive-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder={`What ${productType} are you offering?`} {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          {/* Price and Category */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Price (KES)</Label>
              <Input id="price" type="number" placeholder="0" {...register("price")} />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => setValue("category", value)} defaultValue={existingProduct?.category}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Fashion">Fashion</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Vehicles">Vehicles</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Books & Media">Books & Media</SelectItem>
                  <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>
          </div>

          {/* Description with AI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateAIDescription}
                disabled={isGenerating || !title || !category}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="description"
              placeholder={`Describe your ${productType} in detail...`}
              className="min-h-[120px]"
              {...register("description")}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="pt-4 border-t border-border/50">
            <Button 
              type="submit" 
              className={`w-full h-12 rounded-2xl text-lg font-bold shadow-lg transition-all ${
                isSubmitting 
                  ? "bg-muted cursor-not-allowed" 
                  : "bg-primary hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
              }`} 
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {editMode ? "Updating..." : "Creating Listing..."}
                </>
              ) : editMode ? (
                "Update Listing"
              ) : (
                <>
                  {productType === "product" ? "Post Product" : "Offer Service"}
                  <Sparkles className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-4">
              All listings are reviewed by administrators before going public.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
