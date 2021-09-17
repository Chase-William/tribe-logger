import { isNumber } from 'util';
import XRegExp from 'xregexp';

function getCharToNum(character: string): string {
  // OoQIiLlJjBSsZz
  switch (character) {
    case 'O':
    case 'o':
    case 'Q': // 0
      return '0';
    case 'I':
    case 'i':
    case 'L':
    case 'l':
    case 'J':
    case 'j': // 1
      return '1';
    case 'B': // 8
      return '8';
    case 'S':
    case 's': // 5
      return '5';
    case 'Z':
    case 'z': // 2
      return '2';
    default:
      return character;
    // throw new Error(
    //   'Character not support for string to number conversion within patchStringsToNumbers?!?'
    // );
  }
}

export default function patchStringsToNumbers(toBeNumber: string): number {
  let cleaned = '';
  // TODO create a better implementation... a lot of unnessesary checks in getCharToNum calls...
  // eslint-disable-next-line no-plusplus
  for (let charIndex = 0; charIndex < toBeNumber.length; charIndex++) {
    cleaned += getCharToNum(toBeNumber[charIndex]);
  }
  console.log(cleaned);
  return parseInt(cleaned, 10);
}
