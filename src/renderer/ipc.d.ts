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
  setAreaPref(key: string, value: Area): void;
  getAreaPref(key: string): Promise<Area>;
}
