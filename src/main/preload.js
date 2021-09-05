const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    async getPref(key) {
      return ipcRenderer.invoke('get-pref', key);
    },
    setPref(key, value) {
      ipcRenderer.send('set-pref', key, value);
    },
    getWindowBitmap(windowName) {
      return ipcRenderer.invoke('get-window-bitmap', windowName);
    },
    start() {
      ipcRenderer.send('toggle-tribe-logger', true);
    },
    stop() {
      ipcRenderer.send('toggle-tribe-logger', false);
    },
  },
});
