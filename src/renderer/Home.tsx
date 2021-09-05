import { Paper, Typography, Button } from '@material-ui/core';
import { ipcRenderer } from 'electron/renderer';
import React from 'react';
import IPCUtilities from './ipc';

export default class Home extends React.Component {
  #isRunning = false;

  #ipc: IPCUtilities;

  constructor(props: unknown) {
    super(props);

    this.StartTribeLogger = this.StartTribeLogger.bind(this);
    this.StopTribeLogger = this.StopTribeLogger.bind(this);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.#ipc = window.electron.ipcRenderer;
  }

  /**
   * Starts the tribe logger.
   */
  StartTribeLogger(): void {
    this.#ipc.start();
  }

  /**
   * Stops the tribe logger.
   */
  StopTribeLogger(): void {
    this.#ipc.stop();
  }

  render() {
    return (
      <div>
        <Paper elevation={2}>
          <Typography>
            {this.#isRunning
              ? 'You are streaming logs'
              : 'You are not streaming logs'}
          </Typography>
        </Paper>
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <Button
          onClick={this.StartTribeLogger}
          varient="contained"
          color="secondary"
        >
          Start
        </Button>
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <Button
          onClick={this.StopTribeLogger}
          varient="contained"
          color="secondary"
        >
          Stop
        </Button>
      </div>
    );
  }
}
