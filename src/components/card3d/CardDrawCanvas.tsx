import React, { useMemo, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createQuestionTexture } from './questionTexture'
import { fanTransform, dealAlpha, FLIP_TARGET_Y, FACE_OFFSET_Z } from './cardTransforms'

const TARGET_POS = new THREE.Vector3(0, 0.15, 0.45)

function ActiveCard({ question, startTransform }: { question: string, startTransform: { x: number, y: number, z: number, rotZ: number } }) {
  const groupRef = useRef<THREE.Group>(null)

  const tex = useMemo(() => createQuestionTexture(question), [question])
  useEffect(() => {
    return () => {
      tex.dispose()
    }
  }, [tex])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const active = groupRef.current
    active.position.lerp(TARGET_POS, dealAlpha(delta, 5))
    active.rotation.y = THREE.MathUtils.damp(active.rotation.y, FLIP_TARGET_Y, 2.2, delta)
  })

  return (
    <group
      ref={groupRef}
      position={[startTransform.x, startTransform.y, startTransform.z]}
      rotation={[0, 0, startTransform.rotZ]}
    >
      <mesh position={[0, 0, FACE_OFFSET_Z]}>
        <planeGeometry args={[1, 1.4]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -FACE_OFFSET_Z]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1, 1.4]} />
        <meshStandardMaterial color="#fa2828" />
      </mesh>
    </group>
  )
}

export default function CardDrawCanvas({ question }: { question: string }) {
  const cards = []

  for (let i = 0; i < 5; i++) {
    if (i === 2) continue

    const t = fanTransform(i, 2)
    cards.push(
      <group key={i} position={[t.x, t.y, t.z]} rotation={[0, 0, t.rotZ]}>
        <mesh>
          <planeGeometry args={[1, 1.4]} />
          <meshStandardMaterial color="#fa2828" />
        </mesh>
      </group>
    )
  }

  const activeStart = fanTransform(2, 2)

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 3], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#272727']} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 4]} intensity={0.6} />
      {cards}
      <ActiveCard question={question} startTransform={activeStart} />
    </Canvas>
  )
}
