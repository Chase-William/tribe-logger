import { WindowImagetter } from '../../vendor/tribe-logger-lib/dist/index';

export interface Func {
  (...args: Array<unknown>): void;
}

export interface IPCWindowBitmap {
  getWindowBitmap(windowName: string): Promise<WindowImagetter.BitmapResult>;
}

export default interface IPCUtilities extends IPCWindowBitmap, TribeLogger {
  setPref(key: string, value: unknown): void;
  getPref(key: string): Promise<unknown>;
}

export interface TribeLogger {
  start(): void;
  stop(): void;
}
