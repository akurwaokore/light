"use client"

import { Canvas } from "@react-three/fiber"
import { SodaCan } from "./soda-can"

export function ScrollCanvas({ scrollProgress }: { scrollProgress: number }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ alpha: true, antialias: true }}>
        <SodaCan scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  )
}
