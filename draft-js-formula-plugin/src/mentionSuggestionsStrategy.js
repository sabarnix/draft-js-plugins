/* @flow */

import findWithRegex from 'find-with-regex';
import escapeRegExp from 'lodash.escaperegexp';
import getAllMatchPositions from './utils/getAllMatchPositions';

export default (trigger: string, regExp: string) => (contentBlock: Object, callback: Function) => {
  //findWithRegex(new RegExp('/`(.*?)`/', 'g'), contentBlock, callback);
  //const match = contentBlock.getText().match(/\[(.*?)\]/);

  const matches = getAllMatchPositions(contentBlock.getText(), /\[(.*?)\]/g);
  console.log(matches);
  if(matches.length) {
    matches.forEach((match) => callback(match[0], match[1]));
  }
};
