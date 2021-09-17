export default class TribeLog {
  text: string;

  type: string;

  score: number;

  inGameDay: number;

  inGameHour: number;

  inGameMinute: number;

  inGameSecond: number;

  realLifeTimeStamp: Date;

  constructor(
    text: string,
    type: string,
    inGameDay: number,
    inGameHour: number,
    inGameMinute: number,
    inGameSecond: number
  ) {
    this.text = text;
    this.type = type;
    this.inGameDay = inGameDay;
    this.inGameHour = inGameHour;
    this.inGameMinute = inGameMinute;
    this.inGameSecond = inGameSecond;
  }
}
