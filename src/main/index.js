import {app, BrowserWindow, ipcMain, shell} from 'electron'
import {join} from 'path'
import {electronApp, is, optimizer} from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import {printReceipt} from '../preload/printer'
import * as fs from "node:fs";
import * as path from "node:path";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: icon
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('print-receipt', async (_, config) => {
  await printReceipt(config)
  return 'Printed successfully!'
})

ipcMain.handle('get-printers', async () => {
  try {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) {
      console.warn('No browser window found — cannot get printers.')
      return []
    }

    const printers = await win.webContents.getPrintersAsync()

    if (!Array.isArray(printers)) {
      console.warn('Unexpected printer list:', printers)
      return []
    }

    return printers.filter(p =>
        !/pdf|xps|fax|onenote/i.test(p.name)
    ).sort((a, b) => {
      const aUsb = a.portName?.toLowerCase().startsWith('usb')
      const bUsb = b.portName?.toLowerCase().startsWith('usb')

      if (aUsb && !bUsb) return 1
      if (!aUsb && bUsb) return -1
      return a.name.localeCompare(b.name)
    }).map(p => ({
      name: p.name
    }))
  } catch (err) {
    console.error('Error getting printers:', err)
    return []
  }
})

ipcMain.handle('save-logo', async (_, fileBase64) => {
  try {
    if (!fileBase64) throw new Error('No file data provided')

    const userDataPath = app.getPath('userData')
    const dest = path.join(userDataPath, 'logo.png')

    // fileBase64 looks like: "data:image/png;base64,iVBORw0KGgoAAA..."
    const base64Data = fileBase64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    fs.writeFileSync(dest, buffer)
    console.log('✅ Logo saved to:', dest)
    return dest
  } catch (err) {
    console.error('❌ Failed to save logo:', err)
    throw err
  }
})

ipcMain.handle('get-logo-path', async () => {
  const userDataPath = app.getPath('userData')
  const logoPath = path.join(userDataPath, 'logo.png')

  if (!fs.existsSync(logoPath)) {
    return null
  }

  try {
    // Read the file and convert to base64
    const imageData = fs.readFileSync(logoPath)
    const base64 = `data:image/png;base64,${imageData.toString('base64')}`
    return base64
  } catch (err) {
    console.error('Failed to read logo:', err)
    return null
  }
})