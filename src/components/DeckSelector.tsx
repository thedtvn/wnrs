import { useState } from 'react'
import { chakra, Stack, Flex } from '@chakra-ui/react'
import { DECK_REGISTRY, type DeckMeta } from '@src/decks/registry'
import { useLocale } from '@src/hooks/useLocale'
import type { SystemStyleObject } from '@chakra-ui/react'

const CATEGORY_LABELS: Record<DeckMeta['category'], { en: string; vi: string }> = {
  main: { en: 'Main', vi: 'Chính' },
  expansion: { en: 'Expansion', vi: 'Mở rộng' },
  self: { en: 'Self', vi: 'Bản thân' },
  online: { en: 'Online', vi: 'Trực tuyến' },
  crossover: { en: 'Crossover', vi: 'Hợp tác' },
}

const CATEGORY_STYLES: Record<DeckMeta['category'], SystemStyleObject> = {
  main: { bg: 'brand.500/20', color: 'brand.300', borderColor: 'brand.500/40' },
  expansion: { bg: 'blue.500/20', color: 'blue.300', borderColor: 'blue.500/40' },
  self: { bg: 'purple.500/20', color: 'purple.300', borderColor: 'purple.500/40' },
  online: { bg: 'green.500/20', color: 'green.300', borderColor: 'green.500/40' },
  crossover: { bg: 'orange.500/20', color: 'orange.300', borderColor: 'orange.500/40' },
}

const LEVEL_BADGE_STYLES: Record<1 | 2 | 3, SystemStyleObject> = {
  1: { bg: 'success.500/20', color: 'success.300', borderColor: 'success.500/40' },
  2: { bg: 'accent.500/20', color: 'accent.300', borderColor: 'accent.500/40' },
  3: { bg: 'brand.500/20', color: 'brand.300', borderColor: 'brand.500/40' },
}

interface DeckSelectorProps {
  selected: string[]
  onChange?: (selected: string[]) => void
  readOnly?: boolean
}

export function DeckSelector({ selected, onChange, readOnly = false }: DeckSelectorProps) {
  const { t, locale } = useLocale()
  const [levelFilter, setLevelFilter] = useState<0 | 1 | 2 | 3>(0)

  const toggle = (slug: string) => {
    if (readOnly || !onChange) return
    if (slug === 'main') return
    if (selected.includes(slug)) {
      onChange(selected.filter(s => s !== slug))
    } else {
      onChange([...selected, slug])
    }
  }

  const visible = readOnly
    ? DECK_REGISTRY.filter(d => selected.includes(d.slug))
    : DECK_REGISTRY

  const filtered = levelFilter === 0
    ? visible
    : visible.filter(d => d.level === levelFilter)

  const grouped = filtered.reduce<Record<string, DeckMeta[]>>((acc, deck) => {
    if (!acc[deck.category]) acc[deck.category] = []
    acc[deck.category].push(deck)
    return acc
  }, {})

  return (
    <Stack w="full" gap="3">
      <Flex justify="space-between" align="center">
        <chakra.span color="white" fontSize="sm" fontWeight="medium">
          {t('lobby.decks')}
        </chakra.span>
        <chakra.span color="fg.muted" fontSize="xs">
          {selected.length}/{DECK_REGISTRY.length}
        </chakra.span>
      </Flex>

      {!readOnly && (
        <Flex wrap="wrap" gap="2">
          {([0, 1, 2, 3] as const).map(lv => {
            const active = levelFilter === lv
            return (
              <chakra.button
                key={`lv-${lv}`}
                onClick={() => setLevelFilter(lv)}
                px="3"
                py="1.5"
                minHeight="32px"
                borderRadius="full"
                fontSize="xs"
                fontWeight="semibold"
                borderWidth="1px"
                transition="all 150ms"
                cursor="pointer"
                bg={active ? 'brand.solid' : 'whiteAlpha.50'}
                color={active ? 'brand.contrast' : 'fg.muted'}
                borderColor={active ? 'brand.solid' : 'whiteAlpha.100'}
                _hover={{ bg: active ? 'brand.emphasized' : 'whiteAlpha.100' }}
              >
                {lv === 0 ? t('lobby.levelAll') : `${t('lobby.level')} ${lv}`}
              </chakra.button>
            )
          })}
        </Flex>
      )}

      {Object.entries(grouped).map(([cat, decks]) => (
        <Stack key={cat} gap="2">
          <chakra.span color="fg.muted" fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
            {CATEGORY_LABELS[cat as DeckMeta['category']][locale]}
          </chakra.span>
          <Flex wrap="wrap" gap={{ base: '2', lg: '3' }}>
            {decks.map(deck => {
              const isSelected = selected.includes(deck.slug)
              const locked = readOnly || deck.slug === 'main'

              const stateProps = isSelected
                ? CATEGORY_STYLES[deck.category]
                : {
                    bg: 'whiteAlpha.50',
                    color: 'fg.muted',
                    borderColor: 'whiteAlpha.100',
                    _hover: { bg: 'whiteAlpha.100' }
                  }

              return (
                <chakra.button
                  key={deck.slug}
                  onClick={() => toggle(deck.slug)}
                  disabled={locked}
                  px="3"
                  py="2"
                  minHeight="44px"
                  borderRadius="l2"
                  fontSize="xs"
                  fontWeight="medium"
                  borderWidth="1px"
                  transition="all 150ms"
                  display="inline-flex"
                  alignItems="center"
                  gap="2"
                  {...stateProps}
                  opacity={locked ? 0.7 : undefined}
                  cursor={locked ? 'default' : 'pointer'}
                  _active={locked ? undefined : { transform: 'scale(0.95)' }}
                >
                  {t(deck.nameKey)}
                  <chakra.span
                    px="1.5"
                    py="0.5"
                    borderRadius="full"
                    fontSize="10px"
                    fontWeight="bold"
                    borderWidth="1px"
                    lineHeight="1.4"
                    {...LEVEL_BADGE_STYLES[deck.level]}
                  >
                    L{deck.level}
                  </chakra.span>
                </chakra.button>
              )
            })}
          </Flex>
        </Stack>
      ))}
    </Stack>
  )
}
