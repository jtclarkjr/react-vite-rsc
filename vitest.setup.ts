const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}

// React requires an explicit opt-in in test runtimes that don't auto-configure act().
reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true
