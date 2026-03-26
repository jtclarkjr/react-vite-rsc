export const defaultWelcomeMessage = 'Hello from your React RSC starter.'

export type StarterAppState = {
  welcomeMessage: string
  serverRenderedAt: string
}

export function createStarterAppState(serverRenderedAt = ''): StarterAppState {
  return {
    welcomeMessage: defaultWelcomeMessage,
    serverRenderedAt
  }
}
