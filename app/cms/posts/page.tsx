"use client"

import { useState, useEffect, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit2, Trash2, Search } from "lucide-react"

function PostsContent() {
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: "", content: "", image_url: "" })

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts?limit=100")
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setFormData({ title: "", content: "", image_url: "" })
        setShowForm(false)
        fetchPosts()
      }
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  const handleDeletePost = async (postId) => {
    if (confirm("Are you sure?")) {
      try {
        await fetch(`/api/posts/${postId}`, { method: "DELETE" })
        fetchPosts()
      } catch (error) {
        console.error("Error deleting post:", error)
      }
    }
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Posts Management</h1>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-8">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <Input
              placeholder="Post title (optional)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Textarea
              placeholder="Post content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              required
            />
            <Input
              placeholder="Image URL (optional)"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
            <div className="flex gap-2">
              <Button type="submit">Create Post</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-slate-500">Loading posts...</Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">No posts found</Card>
          ) : (
            filteredPosts.map((post) => (
              <Card key={post.id} className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {post.author?.photo_url && (
                        <img
                          src={post.author.photo_url || "/placeholder.svg"}
                          alt={post.author.display_name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span className="font-semibold text-slate-900">{post.author?.display_name || "Anonymous"}</span>
                    </div>
                    <p className="text-slate-600">{post.content.substring(0, 150)}...</p>
                    <p className="text-sm text-slate-400 mt-2">{new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" className="gap-1" onClick={() => handleDeletePost(post.id)}>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
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

export default function PostsManagementPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <PostsContent />
    </Suspense>
  )
}
