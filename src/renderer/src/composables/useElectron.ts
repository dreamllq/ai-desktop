export function useElectron(): {
  send: (channel: string, ...args: unknown[]) => void
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
} {
  const api = window.electron

  function send(channel: string, ...args: unknown[]): void {
    api.ipcRenderer.send(channel, ...args)
  }

  function invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    return api.ipcRenderer.invoke(channel, ...args)
  }

  function on(channel: string, callback: (...args: unknown[]) => void): () => void {
    const unsubscribe = api.ipcRenderer.on(channel, callback)
    return () => {
      unsubscribe()
    }
  }

  return { send, invoke, on }
}
