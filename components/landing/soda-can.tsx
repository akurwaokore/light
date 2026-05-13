"use client"

import { useRef } from "react"
import { useFrame, useLoader } from "@react-three/fiber"
import { Environment } from "@react-three/drei"
import * as THREE from "three"

export function SodaCan({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const texture = useLoader(THREE.TextureLoader, "/light-alumni-logo.png")

  // Configure texture for proper wrapping on cylinder
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 1)

  useFrame((state) => {
    if (!meshRef.current) return

    meshRef.current.rotation.y = state.clock.elapsedTime * 0.5

    // Animate position based on scroll - moves along z-axis
    meshRef.current.position.z = scrollProgress * 8 - 4
    meshRef.current.position.y = Math.sin(scrollProgress * Math.PI) * 0.5

    // Scale effect
    const scale = 1 + Math.sin(scrollProgress * Math.PI) * 0.2
    meshRef.current.scale.set(scale, scale, scale)
  })

  return (
    <group>
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={1.2} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#60a5fa" />
      <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.3} />

      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.3, 64]} />
        <meshStandardMaterial map={texture} metalness={0.3} roughness={0.4} envMapIntensity={1} />
      </mesh>

      <mesh ref={meshRef} position={[0, 0, 0]}>
        <torusGeometry args={[1.7, 0.05, 16, 100]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      <Environment preset="city" />
    </group>
  )
}
