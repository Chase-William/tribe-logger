import ElectronStore from 'electron-store';
import logger from '../../vendor/tribe-log-processor/dist/logger';
import { WindowImagetter } from '../../vendor/tribe-logger-lib/dist/index';
import { OCR, Preference, TRIBELOGGER_OCR_KEY } from './Schema';

export interface ErrorHandler {
  (errorCode: number): void;
}

export default class TribeLogger {
  #intervalHandle: NodeJS.Timeout;

  #isRunning = false;

  // Window name to use
  windowName: string;

  // Area of the window to apply OCR to
  area: WindowImagetter.Area;

  // Updates are propagated here
  updateHandler: VoidFunction;

  // Errors are propagated here
  errorHandler: ErrorHandler;

  constructor() {
    this.start = this.start.bind(this);
    this.update = this.update.bind(this);
    this.stop = this.stop.bind(this);
  }

  /**
   * Create a new TribeLogger from the saved preferences
   * @returns New TribeLogger instance created from saved preference values
   */
  static createTribeLoggerFromPrefs(
    electronStore: ElectronStore<Preference>, // The local preferences utility
    updateHandler: VoidFunction, // Successful updates are sent here
    errorHandler: ErrorHandler // Errors are sent here
  ): TribeLogger {
    // Get the preference containing all sub preferences needed for our OCR operations
    const ocrValues: OCR = electronStore.get(TRIBELOGGER_OCR_KEY) as OCR;
    const tribeLogger = new TribeLogger();

    // Update props
    tribeLogger.windowName = 'ARK: Survival Evolved';
    tribeLogger.area = ocrValues.area;
    tribeLogger.errorHandler = errorHandler;
    tribeLogger.updateHandler = updateHandler;

    return tribeLogger;
  }

  /**
   * Starts the TribeLogger.
   */
  start(): void {
    if (this.#isRunning) return;
    this.#intervalHandle = setInterval(this.update, 15000);
    this.update();
    this.#isRunning = true;
  }

  /**
   * Reponsible for getting the tribe log text and propagated the proper update depending on it's findings.
   */
  update(): void {
    console.log(
      `Area { ${this.area.left} ${this.area.top} ${this.area.width} ${this.area.height} }`
    );
    const result: WindowImagetter.TribeLogResult =
      WindowImagetter.TryGetTribeLogText(
        this.windowName,
        'C:\\Dev\\tribe-logger\\vendor\\tribe-logger-lib\\static\\tessdata', // This should be dynamically configured internally
        this.area
      );

    if (result.ErrorCode !== WindowImagetter.WinImgGetError.Success) {
      this.errorHandler(result.ErrorCode);
      return;
    }

    console.log(logger(result.TribeLogText));

    this.updateHandler();
  }

  /**
   * Stops the TribeLogger.
   */
  stop(): void {
    if (!this.#isRunning) return;
    clearInterval(this.#intervalHandle);
    this.#intervalHandle = null;
    this.#isRunning = false;
  }
}