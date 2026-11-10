export type Phase = 'idle' | 'working'

declare module 'claude-code' {
  interface PluginState {
    'prompt-master': {
      /** Whether a rewrite is running. */
      phase: Phase
      /** The draft as it was before the last rewrite, for Undo. */
      original: string | null
      /** A rewrite the prompt box could not take, offered in the band. */
      pending: string | null
    }
  }
}
