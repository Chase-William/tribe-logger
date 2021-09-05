import { WindowImagetter } from '../../vendor/tribe-logger-lib/dist/index';

export const TRIBELOGGER_AREA_KEY = 'tribeLogger.ocr.area';
export const TRIBELOGGER_OCR_KEY = 'tribeLogger.ocr';

export interface Preference {
  ocr: OCR;
  test: string;
}

export interface OCR {
  area: WindowImagetter.Area;
}

export default function getPrefSchema() {
  return {
    tribeLogger: {
      ocr: {
        area: {
          left: {
            type: 'number',
            default: 0,
          },
          top: {
            type: 'number',
            default: 0,
          },
          width: {
            type: 'number',
            default: 0,
          },
          height: {
            type: 'number',
            default: 0,
          },
        },
      },
    },
  };
}
