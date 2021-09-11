import { PhraseType } from './KeyPhraser';

export default class PhraseResult {
  index: number;

  text: string;

  type: PhraseType;

  constructor(index: number, text: string, type: PhraseType) {
    this.index = index;
    this.text = text;
    this.type = type;
  }
}
