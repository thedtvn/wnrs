import { lazy, Suspense, useEffect, useState } from 'react'
import { CardDrawBoundary } from './CardDrawBoundary'
import { CardDrawFallback } from './CardDrawFallback'
import { hasWebGL } from './webglProbe'

const CardDrawCanvas = lazy(() => import('./CardDrawCanvas'))

export interface CardDrawProps {
  readonly question: string
  readonly onDone: () => void
  readonly durationMs?: number
}

export function CardDraw({ question, onDone, durationMs = 2000 }: CardDrawProps) {
  const [webgl] = useState(hasWebGL)

  useEffect(() => {
    const id = setTimeout(onDone, durationMs)

    return () => clearTimeout(id)
  }, [onDone, durationMs])

  if (!webgl) {
    return <CardDrawFallback question={question} />
  }

  return (
    <CardDrawBoundary question={question}>
      <Suspense fallback={<CardDrawFallback question={question} />}>
        <CardDrawCanvas question={question} />
      </Suspense>
    </CardDrawBoundary>
  )
}
