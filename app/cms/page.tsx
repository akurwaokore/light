"use client"

import { useState } from "react"
import Link from "next/link"
import { FileText, Calendar, ShoppingCart, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function CMSDashboard() {
  const [stats] = useState({
    totalPosts: 24,
    totalEvents: 12,
    totalProducts: 18,
    totalUsers: 156,
    pendingApprovals: 5,
  })

  const cmsModules = [
    {
      title: "Posts Management",
      description: "Create, edit, and manage community feed posts",
      icon: FileText,
      href: "/cms/posts",
      count: stats.totalPosts,
      color: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Events Management",
      description: "Organize and manage alumni events",
      icon: Calendar,
      href: "/cms/events",
      count: stats.totalEvents,
      color: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      title: "Marketplace Management",
      description: "Manage product listings and approvals",
      icon: ShoppingCart,
      href: "/cms/marketplace",
      count: stats.totalProducts,
      badge: `${stats.pendingApprovals} pending`,
      color: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      title: "Users Management",
      description: "Manage alumni profiles and permissions",
      icon: Users,
      href: "/cms/users",
      count: stats.totalUsers,
      color: "bg-orange-50",
      borderColor: "border-orange-200",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">CMS Dashboard</h1>
          <p className="text-lg text-slate-600">Manage all content and platform features</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-sm text-slate-600 mb-2">Total Posts</div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalPosts}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-slate-600 mb-2">Total Events</div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalEvents}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-slate-600 mb-2">Products Listed</div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalProducts}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-slate-600 mb-2">Active Users</div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalUsers}</div>
          </Card>
          <Card className="p-6 border-orange-200 bg-orange-50">
            <div className="text-sm text-orange-700 mb-2">Pending Approvals</div>
            <div className="text-3xl font-bold text-orange-900">{stats.pendingApprovals}</div>
          </Card>
        </div>

        {/* CMS Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cmsModules.map((module) => {
            const IconComponent = module.icon
            return (
              <Link key={module.href} href={module.href}>
                <Card
                  className={`p-6 cursor-pointer hover:shadow-lg transition-shadow border-l-4 ${module.borderColor} ${module.color}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white rounded-lg">
                        <IconComponent className="w-6 h-6 text-slate-700" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{module.title}</h3>
                        <p className="text-sm text-slate-600">{module.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">{module.count}</div>
                    {module.badge && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                        {module.badge}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-12 text-base">
              <Link href="/cms/posts?action=new">Create New Post</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 text-base bg-transparent">
              <Link href="/cms/events?action=new">Create New Event</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 text-base bg-transparent">
              <Link href="/cms/marketplace?action=pending">Review Pending Products</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
