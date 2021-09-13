import { PhraseType } from './KeyPhraser';

export default class PhraseResult {
  index: number;

  text: string;

  type: PhraseType;

  time: number;

  constructor(index: number, text: string, type: PhraseType) {
    this.index = index;
    this.text = text;
    this.type = type;
    this.time = Date.now();
  }
}
