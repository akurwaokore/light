"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, X } from "lucide-react"

export default function MarketplaceManagement() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("pending")

  useEffect(() => {
    fetchProducts()
  }, [filterStatus])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/marketplace/products?status=${filterStatus}`)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveProduct = async (productId) => {
    try {
      await fetch(`/api/admin/products/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ product_id: productId, status: "approved" }),
      })
      fetchProducts()
    } catch (error) {
      console.error("Error approving product:", error)
    }
  }

  const handleRejectProduct = async (productId) => {
    try {
      await fetch(`/api/admin/products/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ product_id: productId, status: "rejected" }),
      })
      fetchProducts()
    } catch (error) {
      console.error("Error rejecting product:", error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Marketplace Management</h1>

      <div className="flex gap-2 mb-8">
        {["pending", "approved", "rejected"].map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? "default" : "outline"}
            onClick={() => setFilterStatus(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-slate-500">Loading products...</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.length === 0 ? (
            <Card className="p-8 text-center text-slate-500 col-span-full">No {filterStatus} products</Card>
          ) : (
            products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                {product.images?.[0] && (
                  <img
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-1">{product.title}</h3>
                  <p className="text-sm text-slate-600 mb-2">{product.description.substring(0, 60)}...</p>
                  <p className="text-lg font-bold text-slate-900 mb-4">KES {product.price.toLocaleString()}</p>
                  <div className="flex gap-2">
                    {filterStatus === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 gap-1"
                          onClick={() => handleApproveProduct(product.id)}
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 gap-1"
                          onClick={() => handleRejectProduct(product.id)}
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
