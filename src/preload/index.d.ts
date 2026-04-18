import { ElectronAPI } from '@electron-toolkit/preload'
import type { CustomAPI } from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
  }
}
