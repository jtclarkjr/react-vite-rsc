'use client'

import * as React from 'react'
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import {
  createStarterAppState,
  defaultWelcomeMessage,
  type StarterAppState
} from '@/features/starter/state.ts'

type StarterAppActions = {
  resetWelcomeMessage: () => void
  setServerRenderedAt: (timestamp: string) => void
  setWelcomeMessage: (message: string) => void
}

export type StarterAppStore = StarterAppState & StarterAppActions

export function createStarterAppStore(initialState: StarterAppState) {
  return createStore<StarterAppStore>()((set) => ({
    ...initialState,
    setWelcomeMessage: (message) => set({ welcomeMessage: message }),
    resetWelcomeMessage: () => set({ welcomeMessage: defaultWelcomeMessage }),
    setServerRenderedAt: (serverRenderedAt) => set({ serverRenderedAt })
  }))
}

export function useStarterAppStoreRef(initialState: StarterAppState) {
  const storeRef = React.useRef<ReturnType<typeof createStarterAppStore> | null>(null)

  if (!storeRef.current) {
    storeRef.current = createStarterAppStore(initialState)
  }

  React.useEffect(() => {
    storeRef.current?.setState((state) => ({
      ...state,
      ...initialState
    }))
  }, [initialState.serverRenderedAt, initialState.welcomeMessage])

  return storeRef.current
}

export function useStarterAppSelector<T>(
  store: ReturnType<typeof createStarterAppStore>,
  selector: (state: StarterAppStore) => T
) {
  return useStore(store, selector)
}

if (import.meta.vitest) {
  const { describe, expect, it } = import.meta.vitest

  describe('createStarterAppStore', () => {
    it('starts with the default state', () => {
      const store = createStarterAppStore(createStarterAppState())

      expect(store.getState().welcomeMessage).toBe(defaultWelcomeMessage)
      expect(store.getState().serverRenderedAt).toBe('')
    })

    it('updates and resets the welcome message', () => {
      const store = createStarterAppStore(createStarterAppState())

      store.getState().setWelcomeMessage('Updated from a test')
      expect(store.getState().welcomeMessage).toBe('Updated from a test')

      store.getState().resetWelcomeMessage()
      expect(store.getState().welcomeMessage).toBe(defaultWelcomeMessage)
    })

    it('records the SSR timestamp', () => {
      const store = createStarterAppStore(createStarterAppState())

      store.getState().setServerRenderedAt('2026-03-25T00:00:00.000Z')
      expect(store.getState().serverRenderedAt).toBe('2026-03-25T00:00:00.000Z')
    })
  })
}
