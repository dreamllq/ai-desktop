# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> app launches and shows window
- Location: e2e/app.spec.ts:15:5

# Error details

```
Error: electron.launch: Electron failed to install correctly, please delete node_modules/electron and try installing again
```

# Test source

```ts
  1  | import { _electron as electron } from 'playwright'
  2  | import type { ElectronApplication, Page } from 'playwright'
  3  | 
  4  | export async function launchApp(): Promise<ElectronApplication> {
> 5  |   const app = await electron.launch({
     |               ^ Error: electron.launch: Electron failed to install correctly, please delete node_modules/electron and try installing again
  6  |     args: ['./out/main/index.js'],
  7  |   })
  8  |   return app
  9  | }
  10 | 
  11 | export async function getFirstWindow(app: ElectronApplication): Promise<Page> {
  12 |   const window = await app.firstWindow()
  13 |   return window
  14 | }
  15 | 
```