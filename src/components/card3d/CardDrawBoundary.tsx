import { Component, type ReactNode } from 'react'
import { CardDrawFallback } from './CardDrawFallback'

interface Props {
  readonly question: string
  readonly children: ReactNode
}

interface State {
  readonly failed: boolean
}

export class CardDrawBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('3D card renderer unavailable', error)
  }

  render() {
    if (this.state.failed) {
      return <CardDrawFallback question={this.props.question} />
    }

    return this.props.children
  }
}
