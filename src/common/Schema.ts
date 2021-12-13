import { WindowImagetter } from '../../vendor/tribe-logger-lib/dist/index';

export const TRIBELOGGER_LOGSELECTION_KEY = 'tribeLogger.logSelection';

export interface LogSelection {
  name: string;
  baseImageRect: {
    width: number;
    height: number;
  };
  selectionRect: WindowImagetter.Area;
}

export interface AppPreferences {
  tribeLogger: {
    logSelection: LogSelection;
  };
}

export default function getPrefSchema() {
  return {
    tribeLogger: {
      logSelection: {
        name: {
          type: 'string',
          default: 'provided',
        },
        baseImageRect: {
          width: {
            type: 'number',
            default: 0,
          },
          height: {
            type: 'number',
            default: 0,
          },
        },
        selectionRect: {
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
