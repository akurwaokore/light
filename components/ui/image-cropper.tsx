"use client"

import React, { useState, useRef } from "react"
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { RotateCw, ZoomIn } from "lucide-react"

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedImage: Blob) => void
  onCancel: () => void
  aspect?: number
  circularCrop?: boolean
}

export function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  aspect = 1,
  circularCrop = false,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const imgRef = useRef<HTMLImageElement>(null)

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    const initialCrop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        aspect,
        width,
        height,
      ),
      width,
      height,
    )
    setCrop(initialCrop)
  }

  async function getCroppedImg() {
    const image = imgRef.current
    if (!image || !completedCrop) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = completedCrop.width
    canvas.height = completedCrop.height

    ctx.imageSmoothingQuality = "high"

    const cropX = completedCrop.x * scaleX
    const cropY = completedCrop.y * scaleY

    ctx.save()

    // Move canvas to center for rotation/scaling if needed
    ctx.drawImage(
      image,
      cropX,
      cropY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    )

    ctx.restore()

    return new Promise<void>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob)
          }
          resolve()
        },
        "image/jpeg",
        0.9,
      )
    })
  }

  return (
    <Dialog open={!!imageSrc} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Crop & Resize Image</DialogTitle>
          <DialogDescription>Adjust your photo to fit perfectly.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="max-h-[400px] overflow-auto border rounded-md bg-muted/20 p-2">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop={circularCrop}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageSrc}
                onLoad={onImageLoad}
                style={{ transform: `scale(${scale}) rotate(${rotate}deg)`, maxWidth: "100%" }}
              />
            </ReactCrop>
          </div>

          <div className="w-full space-y-4 px-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <Label className="flex items-center gap-2">
                  <ZoomIn className="h-3 w-3" /> Zoom
                </Label>
                <span>{Math.round(scale * 100)}%</span>
              </div>
              <Slider
                value={[scale]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={([val]) => setScale(val)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <Label className="flex items-center gap-2">
                  <RotateCw className="h-3 w-3" /> Rotate
                </Label>
                <span>{rotate}°</span>
              </div>
              <Slider
                value={[rotate]}
                min={0}
                max={360}
                step={1}
                onValueChange={([val]) => setRotate(val)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={getCroppedImg}>Save & Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
