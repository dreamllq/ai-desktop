import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'

const openWindows = new Map<string, BrowserWindow>()

function getRendererUrl(hash?: string): string | URL {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const baseUrl = process.env['ELECTRON_RENDERER_URL']
    return hash ? `${baseUrl}#${hash}` : baseUrl
  }
  // In production, hash is appended to the file URL via router
  return join(__dirname, '../renderer/index.html')
}

function loadRendererWindow(window: BrowserWindow, hash?: string): void {
  const url = getRendererUrl(hash)
  if (typeof url === 'string' && !is.dev) {
    window.loadFile(url)
  } else {
    window.loadURL(url as string)
  }
}

export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  loadRendererWindow(mainWindow)

  openWindows.set('main', mainWindow)
  mainWindow.on('closed', () => {
    openWindows.delete('main')
  })

  return mainWindow
}

export function createSettingsWindow(): BrowserWindow {
  const existing = openWindows.get('settings')
  if (existing && !existing.isDestroyed()) {
    existing.focus()
    return existing
  }

  const settingsWindow = new BrowserWindow({
    width: 600,
    height: 500,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  settingsWindow.on('ready-to-show', () => {
    settingsWindow.show()
  })

  settingsWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  loadRendererWindow(settingsWindow, '/settings')

  openWindows.set('settings', settingsWindow)
  settingsWindow.on('closed', () => {
    openWindows.delete('settings')
  })

  return settingsWindow
}

export function createAboutWindow(parent: BrowserWindow): BrowserWindow {
  const existing = openWindows.get('about')
  if (existing && !existing.isDestroyed()) {
    existing.focus()
    return existing
  }

  const aboutWindow = new BrowserWindow({
    width: 400,
    height: 300,
    show: false,
    autoHideMenuBar: true,
    modal: true,
    parent,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  })

  aboutWindow.on('ready-to-show', () => {
    aboutWindow.show()
  })

  aboutWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  loadRendererWindow(aboutWindow, '/about')

  openWindows.set('about', aboutWindow)
  aboutWindow.on('closed', () => {
    openWindows.delete('about')
  })

  return aboutWindow
}

/** @deprecated Use createMainWindow instead */
export const createWindow = createMainWindow
