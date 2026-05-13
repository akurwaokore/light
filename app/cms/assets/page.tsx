"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Trash2, Copy, ImageIcon } from "lucide-react"
import Image from "next/image"

interface Asset {
  id: string
  asset_name: string
  public_url: string
  asset_type: string
  file_size: number
  alt_text: string
}

export default function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/cms/assets")
      if (res.ok) {
        const data = await res.json()
        setAssets(data)
      }
    } catch (error) {
      console.error("[akurwas] Error fetching assets:", error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files) return

    setUploading(true)
    try {
      const file = files[0]
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/cms/upload", {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        const result = await res.json()
        setAssets([result, ...assets])
      }
    } catch (error) {
      console.error("[akurwas] Error uploading file:", error)
    }
    setUploading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/cms/assets/${id}`, { method: "DELETE" })
      if (res.ok) {
        setAssets(assets.filter((a) => a.id !== id))
      }
    } catch (error) {
      console.error("[akurwas] Error deleting asset:", error)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Asset Manager</h1>
            <p className="text-slate-600 mt-2">Upload and manage images and files</p>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload Asset"}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {asset.asset_type.startsWith("image") ? (
                <div className="relative h-40 bg-slate-100">
                  <Image
                    src={asset.public_url || "/placeholder.svg"}
                    alt={asset.alt_text || asset.asset_name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-40 bg-slate-100 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                </div>
              )}

              <div className="p-4">
                <h3 className="font-semibold text-slate-900 truncate">{asset.asset_name}</h3>
                <p className="text-xs text-slate-500 mt-1">{(asset.file_size / 1024).toFixed(2)} KB</p>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => copyToClipboard(asset.public_url)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {copied === asset.public_url ? "Copied!" : "Copy URL"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(asset.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {assets.length === 0 && (
          <Card className="p-12 text-center">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No assets uploaded yet</p>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mt-4">
              Upload Your First Asset
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
