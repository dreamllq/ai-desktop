import { autoUpdater } from 'electron-updater'

export function checkForUpdates(): void {
  autoUpdater.autoDownload = false
  autoUpdater.checkForUpdatesAndNotify()
}
