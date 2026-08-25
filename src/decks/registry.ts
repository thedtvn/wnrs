export interface DeckMeta {
  slug: string
  nameKey: string
  category: 'main' | 'expansion' | 'self' | 'online' | 'crossover'
  isExpansion: boolean
  level: 1 | 2 | 3
}

export const DECK_REGISTRY: DeckMeta[] = [
  { slug: 'main', nameKey: 'decks.main', category: 'main', isExpansion: false, level: 1 },

  { slug: 'family', nameKey: 'decks.family', category: 'expansion', isExpansion: true, level: 1 },
  { slug: 'couples', nameKey: 'decks.couples', category: 'expansion', isExpansion: true, level: 1 },
  { slug: 'honestDating', nameKey: 'decks.honestDating', category: 'expansion', isExpansion: true, level: 2 },
  { slug: 'relationship', nameKey: 'decks.relationship', category: 'expansion', isExpansion: true, level: 2 },
  { slug: 'innerCircle', nameKey: 'decks.innerCircle', category: 'expansion', isExpansion: true, level: 2 },
  { slug: 'ownIt', nameKey: 'decks.ownIt', category: 'expansion', isExpansion: true, level: 2 },

  { slug: 'breakup', nameKey: 'decks.breakup', category: 'self', isExpansion: true, level: 2 },
  { slug: 'healing', nameKey: 'decks.healing', category: 'self', isExpansion: true, level: 2 },
  { slug: 'forgiveness', nameKey: 'decks.forgiveness', category: 'self', isExpansion: true, level: 2 },
  { slug: 'selfReflection', nameKey: 'decks.selfReflection', category: 'self', isExpansion: true, level: 3 },
  { slug: 'selfLove', nameKey: 'decks.selfLove', category: 'self', isExpansion: true, level: 3 },

  { slug: 'exfriend', nameKey: 'decks.exfriend', category: 'online', isExpansion: true, level: 2 },
  { slug: 'sneakyLink', nameKey: 'decks.sneakyLink', category: 'online', isExpansion: true, level: 3 },
  { slug: 'quarantine', nameKey: 'decks.quarantine', category: 'online', isExpansion: true, level: 1 },
  { slug: 'raceAndPrivilege', nameKey: 'decks.raceAndPrivilege', category: 'online', isExpansion: true, level: 3 },
  { slug: 'voting', nameKey: 'decks.voting', category: 'online', isExpansion: true, level: 2 },

  { slug: 'bumbleDate', nameKey: 'decks.bumbleDate', category: 'crossover', isExpansion: true, level: 2 },
  { slug: 'bumbleBFF', nameKey: 'decks.bumbleBFF', category: 'crossover', isExpansion: true, level: 1 },
  { slug: 'bumbleBizz', nameKey: 'decks.bumbleBizz', category: 'crossover', isExpansion: true, level: 2 },
  { slug: 'cann', nameKey: 'decks.cann', category: 'crossover', isExpansion: true, level: 3 },
  { slug: 'valentino', nameKey: 'decks.valentino', category: 'crossover', isExpansion: true, level: 2 },
  { slug: 'hbomax', nameKey: 'decks.hbomax', category: 'crossover', isExpansion: true, level: 2 },
]

export const DEFAULT_SELECTED_DECKS = ['main']
