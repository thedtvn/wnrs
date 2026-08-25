import { renderWithChakra } from '@src/test/utils'
import { screen, fireEvent } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { cleanup } from '@src/test/utils'
import { DeckSelector } from './DeckSelector'
import { setLocale } from '@src/i18n'
import { DECK_REGISTRY } from '@src/decks/registry'

afterEach(() => cleanup())

const CATEGORY_LABELS = {
  main: { en: 'Main', vi: 'Chính' },
  expansion: { en: 'Expansion', vi: 'Mở rộng' },
  self: { en: 'Self', vi: 'Bản thân' },
  online: { en: 'Online', vi: 'Trực tuyến' },
  crossover: { en: 'Crossover', vi: 'Hợp tác' },
}

describe('DeckSelector', () => {
  it('groups decks by category with localized category labels', () => {
    setLocale('en')
    renderWithChakra(<DeckSelector selected={['main']} />)
    const labels = Object.values(CATEGORY_LABELS).map(l => l.en)
    labels.forEach(label => {
      expect(screen.getByText(label, { selector: 'span' })).toBeInTheDocument()
    })
  })

  it('shows "selected/total" count', () => {
    renderWithChakra(<DeckSelector selected={['main']} />)
    const countText = `1/${DECK_REGISTRY.length}`
    expect(screen.getByText(countText)).toBeInTheDocument()
  })

  it('toggles a deck on click and calls onChange with the next array', () => {
    const onChange = vi.fn()
    setLocale('en')
    renderWithChakra(<DeckSelector selected={['main']} onChange={onChange} />)
    
    // the family deck is unselected
    const btn = screen.getByRole('button', { name: /^Family Edition/ })
    fireEvent.click(btn)
    
    expect(onChange).toHaveBeenCalledTimes(1)
    
    // ensure order-consistent shape matching toggle() logic
    const calledArray = onChange.mock.calls[0][0]
    expect(calledArray).toEqual(expect.arrayContaining(['main', 'family']))
    expect(calledArray.length).toBe(2)
  })

  it('never toggles the "main" deck', () => {
    const onChange = vi.fn()
    setLocale('en')
    renderWithChakra(<DeckSelector selected={['main', 'family']} onChange={onChange} />)
    
    const mainBtn = screen.getByRole('button', { name: /^Main Card Game/ })
    fireEvent.click(mainBtn)
    
    expect(onChange).not.toHaveBeenCalled()
  })

  it('readOnly mode renders only selected decks and fires nothing on click', () => {
    const onChange = vi.fn()
    setLocale('en')
    renderWithChakra(<DeckSelector selected={['main']} onChange={onChange} readOnly />)
    
    // 'Family Edition' shouldn't be in the document because it's not selected
    expect(screen.queryByRole('button', { name: /^Family Edition/ })).not.toBeInTheDocument()
    
    const mainBtn = screen.getByRole('button', { name: /^Main Card Game/ })
    fireEvent.click(mainBtn)
    
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders localized category labels in vi when locale is vi', () => {
    setLocale('vi')
    renderWithChakra(<DeckSelector selected={['main']} />)
    
    const labels = Object.values(CATEGORY_LABELS).map(l => l.vi)
    labels.forEach(label => {
      expect(screen.getByText(label, { selector: 'span' })).toBeInTheDocument()
    })
  })
})
