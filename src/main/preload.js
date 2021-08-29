const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    async getAreaPref(key) {
      return ipcRenderer.invoke('get-pref', key);
    },
    setAreaPref(key, value) {
      ipcRenderer.send('set-pref', key, value);
    },
    getWindowBitmap(windowName) {
      return ipcRenderer.invoke('get-window-bitmap', windowName);
    },
  },
});
