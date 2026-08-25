import type { Deck } from '@src/shared/types'
import {
  main, family, couples, honestDating, relationship, innerCircle, ownIt,
  breakup, healing, forgiveness, selfReflection, selfLove,
  exfriend, sneakyLink, quarantine, raceAndPrivilege, voting,
  bumbleDate, bumbleBFF, bumbleBizz, cann, valentino, hbomax,
} from './index'

export interface DeckCategory {
  displayName: string
  decks: Record<string, Deck>
}

const pick = (...slugs: string[]): Record<string, Deck> => {
  const all: Record<string, Deck> = {
    main, family, couples, honestDating, relationship, innerCircle, ownIt,
    breakup, healing, forgiveness, selfReflection, selfLove,
    exfriend, sneakyLink, quarantine, raceAndPrivilege, voting,
    bumbleDate, bumbleBFF, bumbleBizz, cann, valentino, hbomax,
  }
  return Object.fromEntries(slugs.filter(s => s in all).map(s => [s, all[s]]))
}

export const Main: DeckCategory = {
  displayName: 'Main Deck',
  decks: pick('main'),
}

export const Expansions: DeckCategory = {
  displayName: 'Expansion',
  decks: pick('family', 'couples', 'honestDating', 'relationship', 'innerCircle', 'ownIt'),
}

export const Self: DeckCategory = {
  displayName: 'One Player +',
  decks: pick('breakup', 'healing', 'forgiveness', 'selfReflection', 'selfLove'),
}

export const Online: DeckCategory = {
  displayName: 'Online Released',
  decks: pick('exfriend', 'sneakyLink', 'quarantine', 'raceAndPrivilege', 'voting'),
}

export const Crossover: DeckCategory = {
  displayName: 'Crossover',
  decks: pick('bumbleDate', 'bumbleBFF', 'bumbleBizz', 'cann', 'valentino', 'hbomax'),
}
