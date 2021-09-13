import Fuse from 'fuse.js';
import KeyPhraser, { PhraseType } from './KeyPhraser';
import PhraseResult from './PhraseResult';

/**
 * Normalizes the phrases found by judging them off their weight and putting them into the outputPhrases collection.
 * @param phraseType The phraseType to be normalized.
 * @param inputPhrases All the phrases found acting as our source data collection.
 * @param outputPhrases The normalized output data collection.
 */
function normalizePhraseType(
  phraseType: PhraseType,
  inputPhrases: Map<PhraseType, Fuse.FuseResult<string>[]>,
  outputPhrases: Map<number, PhraseResult>
): void {
  const sourceCollection: Fuse.FuseResult<string>[] =
    inputPhrases.get(phraseType);
  // If there are no phrases that matched this type skip
  if (sourceCollection.length === 0) return;
  const indices: Array<number> = [];
  // Collect all the indices for simplier future use
  sourceCollection.forEach((item) => {
    indices.push(item.refIndex);
  });

  let currentPhrase: PhraseType;
  let currentResults: Fuse.FuseResult<string>[];
  let currentResult: Fuse.FuseResult<string>;
  // eslint-disable-next-line no-plusplus
  for (let phrase = 0; phrase < inputPhrases.size; phrase++) {
    currentPhrase = phrase as PhraseType;
    // Do not iterate over the source collection
    // eslint-disable-next-line no-continue
    if (currentPhrase === phraseType) continue;
    currentResults = inputPhrases.get(currentPhrase);
    // Skip to next result collection if this one is empty
    // eslint-disable-next-line no-continue
    if (currentResults.length === 0) continue;
    // eslint-disable-next-line no-plusplus
    for (
      let resultIndex = 0;
      resultIndex < currentResults.length;
      // eslint-disable-next-line no-plusplus
      resultIndex++
    ) {
      currentResult = currentResults[resultIndex];
      // Determine which PhraseType this log should be based off it's predicted value
      if (indices.includes(currentResult.refIndex)) {
        // Found a better score so save it
        if (sourceCollection[resultIndex].score < currentResult.score) {
          // Update existing
          if (outputPhrases.has(currentResult.refIndex)) {
            const r = outputPhrases.get(currentResult.refIndex);
            r.type = phraseType;
          }
          // Insert new
          else {
            outputPhrases.set(
              currentResult.refIndex,
              new PhraseResult(
                currentResult.refIndex,
                currentResult.item,
                phraseType
              )
            );
          }
        }
        // The other score is worse
        // else {
        //   currentResults.
        // }
      }
    }

    sourceCollection.forEach((item) => {
      if (!outputPhrases.has(item.refIndex)) {
        outputPhrases.set(
          item.refIndex,
          new PhraseResult(item.refIndex, item.item, phraseType)
        );
      }
    });
  }
}

/**
 * Performs phrase finding techniques on a collection of text given.
 */
export default class PhraseFinder {
  #keyPhraser: KeyPhraser;

  /**
   * Creates a new instance of the PhraseFinder class.
   * @param keyPhraser A KeyPhraser to be used with phrase finding.
   */
  constructor(keyPhraser: KeyPhraser) {
    this.#keyPhraser = keyPhraser;
  }

  /**
   * Creates a initialized PhraseFinder using the default KeyPhraser.
   * @returns A new PhraseFinder based off the default KeyPhraser.
   */
  static createDefaultPhraseFinder(): PhraseFinder {
    return new PhraseFinder(KeyPhraser.getDefaultKeyPhraser());
  }

  /**
   * Gets a map containing the best cased normalized results from the logs given.
   * @param logs Data source.
   * @returns Map containing all the logs and their PhaseType, plus other data.
   */
  getBestClassifiedPhrases(logs: string[]): Map<number, PhraseResult> {
    const phraseResults = new Map<PhraseType, Fuse.FuseResult<string>[]>();
    const outputPhrases = new Map<number, PhraseResult>();

    const options = {
      includeScore: true,
      shouldSort: false,
      findAllMatches: true,
    };
    const fuse = new Fuse(logs, options);

    let currentPhrase: PhraseType;
    // Get predictions for each line for every possible phrase
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < this.#keyPhraser.count; i++) {
      currentPhrase = i as PhraseType;
      phraseResults.set(
        currentPhrase,
        fuse.search(this.#keyPhraser.getPhrasePattern(currentPhrase))
      );
    }

    // Condense phrases to a single instance via the highest scores
    // eslint-disable-next-line no-plusplus
    for (let row = 0; row < this.#keyPhraser.count; row++) {
      normalizePhraseType(row as PhraseType, phraseResults, outputPhrases);
    }

    return outputPhrases;
  }
}
