import ElectronStore from 'electron-store';
import fs from 'fs';
import { WindowImagetter } from '../../vendor/tribe-logger-lib/dist/index';
import { OCR, Preference, TRIBELOGGER_OCR_KEY } from '../common/Schema';
import PhraseFinder from './PhraseFinder';
import PhraseResult from './PhraseResult';

const phraseFinder = PhraseFinder.createDefaultPhraseFinder();

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
    this.Start = this.Start.bind(this);
    this.Update = this.Update.bind(this);
    this.Stop = this.Stop.bind(this);
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
  Start(): void {
    if (this.#isRunning) return;
    this.#intervalHandle = setInterval(this.Update, 15000);
    this.Update();
    this.#isRunning = true;
  }

  /**
   * Reponsible for getting the tribe log text and propagated the proper update depending on it's findings.
   */
  Update(): void {
    // console.log(
    //   `Area { ${this.area.left} ${this.area.top} ${this.area.width} ${this.area.height} }`
    // );
    const result: WindowImagetter.TribeLogResult =
      WindowImagetter.TryGetTribeLogText(
        this.windowName,
        'C:\\Dev\\tribe-logger\\vendor\\tribe-logger-lib\\static\\tessdata', // This should be dynamically configured internally
        this.area
      );

    if (result.ErrorCode !== WindowImagetter.WinImgGetError.Success) {
      this.errorHandler(result.ErrorCode);
    } else {
      // Process Tribe Log Text here then call updateHandler
      this.updateHandler();
      const logs: string[] = result.TribeLogText.split('Day');
      // call method on following obj to get all the needed info
      const phrase = phraseFinder.getBestClassifiedPhrases(logs);
      const results: PhraseResult[] = Array.from(phrase.values());
      results.sort((r1: PhraseResult, r2: PhraseResult) => {
        if (r1.index < r2.index) {
          return -1;
        }
        return 1;
      });
      console.log(results);
      fs.writeFileSync('fuse_results.json', JSON.stringify(results));

      let logstr = '';
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < logs.length; i++) {
        logstr += logs[i];
      }

      fs.writeFileSync('logs.txt', logstr);
    }
  }

  /**
   * Stops the TribeLogger.
   */
  Stop(): void {
    if (!this.#isRunning) return;
    clearInterval(this.#intervalHandle);
    this.#intervalHandle = null;
    this.#isRunning = false;
  }
}
