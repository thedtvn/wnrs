import seedrandom from 'seedrandom'

export const shuffle = <T>(array: T[], seed: string): T[] => {
  if (!Array.isArray(array)) return []
  const copy = array.slice()
  const rng = seedrandom(seed)
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export const getRawQuestion = (question: string): string => {
  const _question = question.replaceAll('\n', '')
  const _ownItRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const withoutOwnIt = _question.replaceAll(_ownItRegex, (_m, _p1, p2) => p2)
  const _hboRegex = / <(.+)>/g
  return withoutOwnIt.replaceAll(_hboRegex, '')
}
