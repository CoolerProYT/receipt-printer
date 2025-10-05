import { app } from 'electron'
import * as path from 'node:path'
import * as fs from 'node:fs'
import sharp from 'sharp'

const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer')
const printerDriver = require('@thesusheer/electron-printer')

export async function printReceipt(config) {
  let printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: `printer:${config.printer}`,
    driver: printerDriver
  })

  const logoPath = path.join(app.getPath('userData'), 'logo.png')
  if (fs.existsSync(logoPath)) {
    const maxWidth = 384
    const resizedPath = path.join(app.getPath("userData"), "logo_resized.png")

    await sharp(logoPath)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .toFile(resizedPath)

    await printer.printImage(resizedPath)
    printer.newLine()
  }

  if (config.title) {
    printer.alignCenter()
    printer.bold(true)
    printer.println(config.title)
    printer.bold(false)
  }

  printer.println('-'.repeat(32))

  config.items.forEach((item, index) => {
    printer.tableCustom([
      { text: item.name, align: 'LEFT', width: 0.5 },
      { text: item.price, align: 'RIGHT', cols: 8 }
    ])
    if (index !== config.items.length - 1) {
      printer.newLine()
    }
  })

  printer.println('-'.repeat(32))
  printer.bold(true)
  const totals = config.totals || []

  for (let i = 0; i < totals.length; i++) {
    const row = totals[i]

    if (i === totals.length - 1 && totals.length > 1) {
      printer.println('-'.repeat(32))
    }

    printer.tableCustom([
      { text: row.label, align: 'LEFT', width: 0.5 },
      { text: row.value, align: 'RIGHT', cols: 8 }
    ])
  }

  printer.bold(false)
  printer.cut()
  await printer.execute()
}

export async function getPrinters() {
  return printerDriver.getPrinters()
}
