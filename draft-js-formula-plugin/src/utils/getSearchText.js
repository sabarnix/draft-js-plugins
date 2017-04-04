import getWordAt from './getWordAt';
import getAllMatchPositions from './getAllMatchPositions';

const getSearchText = (editorState, selection) => {
  const anchorKey = selection.getAnchorKey();
  const anchorOffset = selection.getAnchorOffset() - 1;
  const currentContent = editorState.getCurrentContent();
  const currentBlock = currentContent.getBlockForKey(anchorKey);
  const blockText = currentBlock.getText() + '';

  const regex = /\[(.*?)\]/g;

  const matchingPositions = getAllMatchPositions(blockText, regex);

  const searchPosition = matchingPositions.find((position) => anchorOffset >=position[0] && anchorOffset <=position[1]);

  return {begin: searchPosition[0], end: searchPosition[1], searchValue: blockText.slice(searchPosition[0] + 1, searchPosition[1] - 1)}

  // console.log(blockText, anchorOffset);
  // return getWordAt(blockText, anchorOffset);
};

export default getSearchText;
