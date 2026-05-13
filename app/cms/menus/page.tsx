"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Trash2 } from "lucide-react"

interface MenuItem {
  label: string
  href: string
  icon?: string
}

interface Menu {
  id: string
  menu_name: string
  menu_items: MenuItem[]
}

export default function MenuManager() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [showForm, setShowForm] = useState(false)
  const [menuName, setMenuName] = useState("")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      const res = await fetch("/api/cms/menus")
      if (res.ok) {
        const data = await res.json()
        setMenus(data)
      }
    } catch (error) {
      console.error("[akurwas] Error fetching menus:", error)
    }
  }

  const handleSaveMenu = async () => {
    try {
      const res = await fetch("/api/cms/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_name: menuName, menu_items: menuItems }),
      })
      if (res.ok) {
        await fetchMenus()
        setMenuName("")
        setMenuItems([])
        setShowForm(false)
      }
    } catch (error) {
      console.error("[akurwas] Error saving menu:", error)
    }
  }

  const addMenuItem = () => {
    setMenuItems([...menuItems, { label: "", href: "" }])
  }

  const updateMenuItem = (index: number, field: string, value: string) => {
    const updated = [...menuItems]
    updated[index] = { ...updated[index], [field]: value }
    setMenuItems(updated)
  }

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index))
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Navigation Menus</h1>
            <p className="text-slate-600 mt-2">Create and manage navigation menus</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Menu
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Create Menu</h2>
            <div className="space-y-4">
              <Input
                placeholder="Menu Name (e.g., Main Navigation)"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
              />

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Menu Items</h3>
                {menuItems.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      placeholder="Label"
                      value={item.label}
                      onChange={(e) => updateMenuItem(index, "label", e.target.value)}
                    />
                    <Input
                      placeholder="URL (e.g., /about)"
                      value={item.href}
                      onChange={(e) => updateMenuItem(index, "href", e.target.value)}
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeMenuItem(index)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addMenuItem} className="w-full mt-2 bg-transparent">
                  Add Item
                </Button>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleSaveMenu}>Save Menu</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-4">
          {menus.map((menu) => (
            <Card key={menu.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-slate-900">{menu.menu_name}</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <ul className="space-y-1">
                {menu.menu_items.map((item, index) => (
                  <li key={index} className="text-sm text-slate-600">
                    <a href={item.href} className="text-blue-600 hover:underline">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
