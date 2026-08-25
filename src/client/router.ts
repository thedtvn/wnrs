export interface HomeRoute {
  view: 'home'
}

export interface GameRoute {
  view: 'game'
  seed: string
  names?: string[]
}

export type Route = HomeRoute | GameRoute

const parseGameHash = (query: string): Route => {
  const params = new URLSearchParams(query)
  const seed = params.get('seed')
  if (!seed) return { view: 'home' }
  const names = params.get('names')
  return {
    view: 'game',
    seed,
    names: names ? decodeURIComponent(names).split(',') : undefined,
  }
}

export const parseRoute = (): Route => {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash.startsWith('/game')) return { view: 'home' }
  return parseGameHash(hash.split('?')[1] ?? '')
}

export const routeToHash = (route: Route): string => {
  if (route.view === 'home') return '#/'
  const params = new URLSearchParams({ seed: route.seed })
  if (route.names?.length) params.set('names', route.names.join(','))
  return `#/game?${params.toString()}`
}

export const navigate = (route: Route): void => {
  window.location.hash = routeToHash(route)
}
