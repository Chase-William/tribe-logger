import { WindowImgetter } from '../../vendor/tribe-logger-lib/dist';

export interface Func {
  (...args: Array<unknown>): void;
}

export interface Area {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface IPCWindowBitmap {
  getWindowBitmap(windowName: string): Promise<WindowImgetter.BitmapResult>;
}

export default interface IPCSettings extends IPCWindowBitmap {
  myPing(): void;
  on(channel: string, func: Func): void;
  once(channel: string, func: Func): void;
  // setAreaPref(key: string, value: Area): void;
  getAreaPref(key: string): Promise<Area>;
}
