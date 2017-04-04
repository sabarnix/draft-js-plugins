import decorateComponentWithProps from 'decorate-component-with-props';
import { Map } from 'immutable';
import {
  ContentBlock,
  ContentState,
  EditorState,
  SelectionState,
  genKey,
  getDefaultKeyBinding,
  KeyBindingUtil,
  Modifier,
} from 'draft-js'
import Mention from './Mention';
import MentionSuggestions from './MentionSuggestions';
import MentionSuggestionsPortal from './MentionSuggestionsPortal';
import defaultRegExp from './defaultRegExp';
import mentionStrategy from './mentionStrategy';
import mentionSuggestionsStrategy from './mentionSuggestionsStrategy';
import mentionStyles from './mentionStyles.css';
import mentionSuggestionsStyles from './mentionSuggestionsStyles.css';
import mentionSuggestionsEntryStyles from './mentionSuggestionsEntryStyles.css';
import suggestionsFilter from './utils/defaultSuggestionsFilter';
import defaultPositionSuggestions from './utils/positionSuggestions';
import getAllMatchPositions from './utils/getAllMatchPositions';

export default (config = {}) => {
  const defaultTheme = {
    // CSS class for mention text
    mention: mentionStyles.mention,
    // CSS class for suggestions component
    mentionSuggestions: mentionSuggestionsStyles.mentionSuggestions,
    // CSS classes for an entry in the suggestions component
    mentionSuggestionsEntry: mentionSuggestionsEntryStyles.mentionSuggestionsEntry,
    mentionSuggestionsEntryFocused: mentionSuggestionsEntryStyles.mentionSuggestionsEntryFocused,
    mentionSuggestionsEntryText: mentionSuggestionsEntryStyles.mentionSuggestionsEntryText,
    mentionSuggestionsEntryAvatar: mentionSuggestionsEntryStyles.mentionSuggestionsEntryAvatar,
  };

  const callbacks = {
    keyBindingFn: undefined,
    handleKeyCommand: undefined,
    onDownArrow: undefined,
    onUpArrow: undefined,
    onTab: undefined,
    onEscape: undefined,
    handleReturn: undefined,
    onChange: undefined,
  };

  const ariaProps = {
    ariaHasPopup: 'false',
    ariaExpanded: 'false',
    ariaOwneeID: undefined,
    ariaActiveDescendantID: undefined,
  };

  let searches = Map();
  let escapedSearch;
  let clientRectFunctions = Map();

  const store = {
    getEditorState: undefined,
    setEditorState: undefined,
    getPortalClientRect: (offsetKey) => clientRectFunctions.get(offsetKey)(),
    getAllSearches: () => searches,
    isEscaped: (offsetKey) => escapedSearch === offsetKey,
    escapeSearch: (offsetKey) => {
      escapedSearch = offsetKey;
    },

    resetEscapedSearch: () => {
      escapedSearch = undefined;
    },

    register: (offsetKey) => {
      searches = searches.set(offsetKey, offsetKey);
    },

    updatePortalClientRect: (offsetKey, func) => {
      clientRectFunctions = clientRectFunctions.set(offsetKey, func);
    },

    unregister: (offsetKey) => {
      searches = searches.delete(offsetKey);
      clientRectFunctions = clientRectFunctions.delete(offsetKey);
    },
  };

  // Styles are overwritten instead of merged as merging causes a lot of confusion.
  //
  // Why? Because when merging a developer needs to know all of the underlying
  // styles which needs a deep dive into the code. Merging also makes it prone to
  // errors when upgrading as basically every styling change would become a major
  // breaking change. 1px of an increased padding can break a whole layout.
  const {
    mentionPrefix = '',
    theme = defaultTheme,
    positionSuggestions = defaultPositionSuggestions,
    mentionComponent,
    entityMutability = 'IMMUTABLE',
    mentionTrigger = '@',
    mentionRegExp = defaultRegExp,
  } = config;
  const mentionSearchProps = {
    ariaProps,
    callbacks,
    theme,
    store,
    entityMutability,
    positionSuggestions,
    mentionTrigger,
    mentionPrefix,
  };
  return {
    MentionSuggestions: decorateComponentWithProps(MentionSuggestions, mentionSearchProps),
    decorators: [
      {
        strategy: mentionStrategy(mentionTrigger),
        component: decorateComponentWithProps(Mention, { theme, mentionComponent }),
      },
      {
        strategy: mentionSuggestionsStrategy(mentionTrigger, mentionRegExp),
        component: decorateComponentWithProps(MentionSuggestionsPortal, { store }),
      },
    ],
    getAccessibilityProps: () => (
      {
        role: 'combobox',
        ariaAutoComplete: 'list',
        ariaHasPopup: ariaProps.ariaHasPopup,
        ariaExpanded: ariaProps.ariaExpanded,
        ariaActiveDescendantID: ariaProps.ariaActiveDescendantID,
        ariaOwneeID: ariaProps.ariaOwneeID,
      }
    ),

    initialize: ({ getEditorState, setEditorState }) => {
      store.getEditorState = getEditorState;
      store.setEditorState = setEditorState;
    },

    onDownArrow: (keyboardEvent) => callbacks.onDownArrow && callbacks.onDownArrow(keyboardEvent),
    onTab: (keyboardEvent) => callbacks.onTab && callbacks.onTab(keyboardEvent),
    onUpArrow: (keyboardEvent) => callbacks.onUpArrow && callbacks.onUpArrow(keyboardEvent),
    onEscape: (keyboardEvent) => callbacks.onEscape && callbacks.onEscape(keyboardEvent),
    handleReturn: (keyboardEvent) => callbacks.handleReturn && callbacks.handleReturn(keyboardEvent),
    handleBeforeInput: (chars, { getEditorState, setEditorState }) => {
      //console.log(getEditorState(), command.keyCode);
            
      let editorState = getEditorState();

      const contentState = editorState.getCurrentContent();
      const blocks = contentState.getBlocksAsArray();
      const selectionState = editorState.getSelection();

      const anchorKey = selectionState.getAnchorKey();
      const anchorOffset = selectionState.getAnchorOffset();

      const plainText = contentState.getPlainText();
      const currentContentBlock = contentState.getBlockForKey(anchorKey);
      const currentOffset = selectionState.getAnchorOffset();

      if(chars === '[') {
        let endSelection = new SelectionState({
          anchorKey: selectionState.getAnchorKey(),
          anchorOffset: selectionState.getAnchorOffset(),
          focusKey: selectionState.getFocusKey(),
          focusOffset: selectionState.getFocusOffset()
        });
        const newContentState = Modifier.replaceText(contentState, endSelection, '[]');
        editorState = EditorState.push(editorState, newContentState, 'insert-characters');
        editorState = EditorState.forceSelection(editorState, new SelectionState({
          anchorKey: selectionState.getAnchorKey(),
          anchorOffset: selectionState.getAnchorOffset() + 1,
          focusKey: selectionState.getFocusKey(),
          focusOffset: selectionState.getFocusOffset() + 1
        }));

        setEditorState(editorState);
        return 'handled';
      }

      const regex = /\[(.*?)\]/g;

      const matchingPositions = getAllMatchPositions(plainText, regex);

      if(matchingPositions.some((position) => currentOffset > position[0] && currentOffset < position[1])) {
        return true;
      }

      const operatorPattern = /(?:[-0-9 .%^&*()_+\"'\/])/;
      return operatorPattern.test(chars)? false : 'handled';

      return true;
    },
    onChange: (editorState) => {
      
      const selection = editorState.getSelection();

      const startKey = selection.getStartKey();
      const startOffset = selection.getStartOffset();
      const endKey = selection.getEndKey();
      const endOffset = selection.getEndOffset();
      const prevOffset = startOffset - 1;
      const block = editorState.getCurrentContent().getBlockForKey(startKey);
      const characterList = block.getCharacterList();
      
      
      if(selection.isCollapsed()) {
        const prevChar = characterList.get(prevOffset);
        const nextChar = characterList.get(startOffset);

        if (!prevChar || !nextChar) {
          if (callbacks.onChange) return callbacks.onChange(editorState);
          return editorState;
        }
        
        const prevEntity = prevChar.getEntity();
        const nextEntity = nextChar.getEntity();
        const entity = prevEntity === nextEntity && prevEntity;

        if (!entity) {
          if (callbacks.onChange) return callbacks.onChange(editorState);
          return editorState;
        }

        let finalPrevOffset = prevOffset;
        let finalNextOffset = startOffset;

        while(finalPrevOffset > 0) {
          finalPrevOffset--;
          const char = characterList.get(finalPrevOffset);
          if (char.getEntity() !== entity) {
            finalPrevOffset++;
            break;
          }
        }

        const blockLength = block.getLength();
        while(finalNextOffset < blockLength) {
          finalNextOffset++;
          const char = characterList.get(finalNextOffset);
          if (char.getEntity() !== entity) {
            break;
          }
        }

        editorState = EditorState.forceSelection(editorState, new SelectionState({
          anchorKey: selection.getAnchorKey(),
          anchorOffset: finalPrevOffset,
          focusKey: selection.getFocusKey(),
          focusOffset: finalNextOffset
        }));
      } else {
        let selectionStart = startOffset;
        let selectionEnd = endOffset;

        const startEntity = selectionStart && characterList.get(selectionStart) && characterList.get(selectionStart).getEntity();

        if(startEntity) {
          while(selectionStart > 0) {
            selectionStart--;
            const char = characterList.get(selectionStart);
            if (char.getEntity() !== startEntity) {
              selectionStart++;
              break;
            }
          }
        }

        const endEntity = selectionEnd && characterList.get(selectionEnd) && characterList.get(selectionEnd).getEntity();

        if(endEntity) {
          while(selectionEnd > 0) {
            selectionEnd++;
            const char = characterList.get(selectionEnd);
            if (char.getEntity() !== endEntity) {
              break;
            }
          }
        }

        editorState = EditorState.forceSelection(editorState, new SelectionState({
          anchorKey: selection.getAnchorKey(),
          anchorOffset: selectionStart,
          focusKey: selection.getFocusKey(),
          focusOffset: selectionEnd
        }));
      }

      

      if (callbacks.onChange) return callbacks.onChange(editorState);
      return editorState;
    },
  };
};

export const defaultSuggestionsFilter = suggestionsFilter;
