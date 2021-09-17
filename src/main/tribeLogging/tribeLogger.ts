import ElectronStore from 'electron-store';
import fs from 'fs';
import Fuse from 'fuse.js';
import getBestFitForAll, {
  Phrase,
  PhrasedResult,
} from 'fuzzy-phrase-classifier';
import XRegExp from 'xregexp';
import { WindowImagetter } from '../../../vendor/tribe-logger-lib/dist/index';
import { OCR, Preference, TRIBELOGGER_OCR_KEY } from '../../common/Schema';
import TribeLog from './tribeLog';
import patchStringsToNumbers from './util';

export interface ErrorHandler {
  (errorCode: number): void;
}

interface LogHeaderInfo {
  Day: string;
  Time: string;
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

      const phrases: Phrase[] = JSON.parse(
        fs.readFileSync('key_phrases.json', {
          encoding: 'utf-8',
        }) as string
      );

      const results: PhrasedResult[] = getBestFitForAll(logs, phrases);

      fs.writeFileSync('fuse_results.json', JSON.stringify(results));

      let logstr = '';
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < logs.length; i++) {
        logstr += logs[i];
      }

      fs.writeFileSync('logs.txt', logstr);

      const regexLogs = new Array<TribeLog>();
      {
        const findDateLogs: string[] = result.TribeLogText.split('\n');
        const fuse = new Fuse(findDateLogs, {
          findAllMatches: true,
        });
        const daySplitResults: Fuse.FuseResult<string>[] =
          fuse.search<string>('Day');

        const headerInfo: LogHeaderInfo[] = new Array<LogHeaderInfo>(
          findDateLogs.length
        );

        const date = XRegExp(
          `[^^]{1,5}(?<day>[OoQIiLlJjBSsZz0-9]{5})[^^]{1,4}(?<hour>[OoQIiLlJjBSsZz0-9]{2})[^^]{0,3}(?<minute>[OoQIiLlJjBSsZz0-9]{2})[^^]{0,3}(?<second>[OoQIiLlJjBSsZz0-9]{2})`
        );
        // eslint-disable-next-line no-plusplus
        for (let index = 0; index < daySplitResults.length; index++) {
          const match = XRegExp.exec(daySplitResults[index].item, date);
          if (match == null) {
            console.log(`Index: ${index} had no matches...\n
              ${daySplitResults[index].item}\n
              ^^ Won't be added to output collection...
            `);

            // eslint-disable-next-line no-continue
            continue;
          }
          console.log(
            `day: ${match.groups.day} hour: ${match.groups.hour} minute: ${match.groups.minute} second: ${match.groups.second}`
          );

          regexLogs.push(
            new TribeLog(
              daySplitResults[index].item,
              'Not Available Yet',
              patchStringsToNumbers(match.groups.day),
              patchStringsToNumbers(match.groups.hour),
              patchStringsToNumbers(match.groups.minute),
              patchStringsToNumbers(match.groups.second)
            )
          );
        }
      }

      fs.writeFileSync('regexed_logs.json', JSON.stringify(regexLogs));
    }
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
