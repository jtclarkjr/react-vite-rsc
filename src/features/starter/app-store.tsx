'use client'

import { map } from 'nanostores'
import {
  createStarterAppState,
  defaultWelcomeMessage,
  type StarterAppState
} from '@/features/starter/state.ts'

export const $starterApp = map<StarterAppState>(createStarterAppState())

export function hydrateStarterAppState(state: StarterAppState) {
  $starterApp.set(state)
}

export function setWelcomeMessage(message: string) {
  $starterApp.setKey('welcomeMessage', message)
}

export function resetWelcomeMessage() {
  $starterApp.setKey('welcomeMessage', defaultWelcomeMessage)
}

export function setServerRenderedAt(timestamp: string) {
  $starterApp.setKey('serverRenderedAt', timestamp)
}

if (import.meta.vitest) {
  const { beforeEach, describe, expect, it } = import.meta.vitest

  describe('starter-app-store', () => {
    beforeEach(() => {
      hydrateStarterAppState(createStarterAppState())
    })

    it('starts with the default state', () => {
      expect($starterApp.get().welcomeMessage).toBe(defaultWelcomeMessage)
      expect($starterApp.get().serverRenderedAt).toBe('')
    })

    it('updates and resets the welcome message', () => {
      setWelcomeMessage('Updated from a test')
      expect($starterApp.get().welcomeMessage).toBe('Updated from a test')
      expect($starterApp.get().serverRenderedAt).toBe('')

      resetWelcomeMessage()
      expect($starterApp.get().welcomeMessage).toBe(defaultWelcomeMessage)
    })

    it('records the SSR timestamp', () => {
      setServerRenderedAt('2026-03-25T00:00:00.000Z')
      expect($starterApp.get().serverRenderedAt).toBe('2026-03-25T00:00:00.000Z')
      expect($starterApp.get().welcomeMessage).toBe(defaultWelcomeMessage)
    })

    it('hydrates the store from a server snapshot', () => {
      const state = {
        welcomeMessage: 'Hydrated from the server',
        serverRenderedAt: '2026-03-26T00:00:00.000Z'
      } satisfies StarterAppState

      hydrateStarterAppState(state)

      expect($starterApp.get()).toEqual(state)
    })
  })
}
