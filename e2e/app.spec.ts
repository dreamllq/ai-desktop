import { test, expect } from '@playwright/test'
import { launchApp, getFirstWindow } from './helpers'
import type { ElectronApplication } from 'playwright'

let app: ElectronApplication

test.beforeAll(async () => {
  app = await launchApp()
})

test.afterAll(async () => {
  if (app) await app.close()
})

test('app launches and shows window', async () => {
  const window = await getFirstWindow(app)
  expect(window).toBeTruthy()
  const title = await window.title()
  expect(title).toBeTruthy()
})

test('window contains expected content', async () => {
  const window = await getFirstWindow(app)
  const body = await window.waitForSelector('body')
  expect(body).toBeTruthy()
})
