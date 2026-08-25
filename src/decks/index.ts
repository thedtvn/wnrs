import type { Deck } from '@src/shared/types'

import mainJson from './mainDeck/main.json'
import mainViJson from './mainDeck/main_vi.json'

import familyJson from './expansion/family.json'
import couplesJson from './expansion/couples.json'
import honestDatingJson from './expansion/honestDating.json'
import relationshipJson from './expansion/relationship.json'
import innerCircleJson from './expansion/innerCircle.json'
import ownItJson from './expansion/ownIt.json'

import breakupJson from './self/breakup.json'
import healingJson from './self/healing.json'
import forgivenessJson from './self/forgiveness.json'
import selfReflectionJson from './self/selfReflection.json'
import selfLoveJson from './self/selfLove.json'

import exfriendJson from './online/exfriend.json'
import sneakyLinkJson from './online/sneaky.json'
import quarantineJson from './online/quarantine.json'
import raceAndPrivilegeJson from './online/raceAndPrivilege.json'
import votingJson from './online/voting.json'

import bumbleDateJson from './crossover/bumbleDate.json'
import bumbleBFFJson from './crossover/bumbleBFF.json'
import bumbleBizzJson from './crossover/bumbleBizz.json'
import cannJson from './crossover/cann.json'
import valentinoJson from './crossover/valentino.json'
import hbomaxJson from './crossover/hboMax.json'

function mergeLocale(base: Deck, localeJson: Partial<Deck>): Deck {
  return { ...base, ...localeJson }
}

export const main: Deck = mergeLocale(mainJson, mainViJson as Partial<Deck>)

export const family: Deck = familyJson
export const couples: Deck = couplesJson
export const honestDating: Deck = honestDatingJson
export const relationship: Deck = relationshipJson
export const innerCircle: Deck = innerCircleJson
export const ownIt: Deck = ownItJson

export const breakup: Deck = breakupJson
export const healing: Deck = healingJson
export const forgiveness: Deck = forgivenessJson
export const selfReflection: Deck = selfReflectionJson
export const selfLove: Deck = selfLoveJson

export const exfriend: Deck = exfriendJson
export const sneakyLink: Deck = sneakyLinkJson
export const quarantine: Deck = quarantineJson
export const raceAndPrivilege: Deck = raceAndPrivilegeJson
export const voting: Deck = votingJson

export const bumbleDate: Deck = bumbleDateJson
export const bumbleBFF: Deck = bumbleBFFJson
export const bumbleBizz: Deck = bumbleBizzJson
export const cann: Deck = cannJson
export const valentino: Deck = valentinoJson
export const hbomax: Deck = hbomaxJson
