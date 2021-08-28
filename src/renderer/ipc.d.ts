export interface Func {
  (...args: Array<unknown>): void;
}

export interface Area {
  left: number;
  top: number;
  width: number;
  height: number;
}

export default interface IPCSettings {
  myPing(): void;
  on(channel: string, func: Func): void;
  once(channel: string, func: Func): void;
  // setAreaPref(key: string, value: Area): void;
  getAreaPref(key: string): Promise<Area>;
}
