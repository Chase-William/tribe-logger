import React from 'react';
import { AppBar, Tab } from '@material-ui/core';
import './App.global.css';
import { TabContext, TabList, TabPanel } from '@material-ui/lab';
import { ipcRenderer } from 'electron/renderer';
import Settings from './Settings';
import Home from './Home';

export default class App extends React.Component {
  // Selection key for TabList
  #value = '0';

  constructor(props: unknown) {
    super(props);
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
  }

  /**
   * Handles new selections made in the TabList
   * @param _event React event.
   * @param newValue Key for selection.
   */
  handleSelectionChange(_event: React.ChangeEvent<unknown>, newValue: string) {
    this.#value = newValue;
    this.forceUpdate();
  }

  render() {
    return (
      <div>
        <TabContext value={this.#value}>
          <AppBar position="fixed">
            <TabList
              onChange={this.handleSelectionChange}
              aria-label="simple tabs example"
              centered
            >
              <Tab label="Home" value="0" />
              <Tab label="Settings" value="1" />
            </TabList>
          </AppBar>
          <TabPanel value="0">
            <Home />
          </TabPanel>
          <TabPanel value="1">
            <Settings />
          </TabPanel>
        </TabContext>
      </div>
    );
  }
}

// ipcRenderer.on(
//   'ocr-update',
//   (_e: Electron.IpcRendererEvent, text: string) => {
//     console.log(`error! ${text}`);
//   }
// );
