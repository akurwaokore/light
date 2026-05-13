"use client"

import { useState, useEffect } from "react"

export function useLogo() {
  const [logo, setLogo] = useState({ url: "/logo.png", alt: "Light Alumni Association" })

  const fetchLogo = async () => {
    try {
      const response = await fetch(`/api/cms/settings?key=logo&t=${Date.now()}`)
      if (response.ok) {
        const data = await response.json()
        if (data && data.url) {
          setLogo(data)
        }
      }
    } catch (err) {
      console.error("Failed to load logo:", err)
    }
  }

  useEffect(() => {
    fetchLogo()
  }, [])

  return { logo, refreshLogo: fetchLogo }
}
