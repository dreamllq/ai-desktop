import { _electron as electron } from 'playwright'
import type { ElectronApplication, Page } from 'playwright'

export async function launchApp(): Promise<ElectronApplication> {
  const app = await electron.launch({
    args: ['./out/main/index.js'],
  })
  return app
}

export async function getFirstWindow(app: ElectronApplication): Promise<Page> {
  const window = await app.firstWindow()
  return window
}
