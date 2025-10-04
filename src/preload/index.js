import {contextBridge, ipcRenderer} from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
    getPrinters: () => ipcRenderer.invoke('get-printers'),
    printReceipt: (config) => ipcRenderer.invoke('print-receipt', config),
    saveLogo: (fileBase64) => ipcRenderer.invoke('save-logo', fileBase64),
    getLogoPath: () => ipcRenderer.invoke('get-logo-path')
})