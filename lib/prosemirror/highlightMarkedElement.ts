import { EditorView, Node, PluginKey, TextSelection } from '@bangle.dev/pm';
import { renderSuggestionsTooltip } from 'components/common/CharmEditor/components/@bangle.dev/tooltip/suggest-tooltip';
import { highlightDomElement } from 'lib/browser';

export function highlightMarkedElement ({
  view,
  elementId,
  markName,
  key,
  prefix
}: {view: EditorView, markName: string, key: PluginKey, elementId: string, prefix: string}) {
  const { $from, $to } = view.state.selection;
  const fromNodeAfter = $from.nodeAfter;
  const toNodeAfter = $to.nodeAfter;
  if (!toNodeAfter) {
    const tr = view.state.tr.setSelection(new TextSelection(view.state.doc.resolve(view.state.selection.$to.pos)));
    view.dispatch(tr);
    return false;
  }
  if (fromNodeAfter) {
    const inlineActionMark = view.state.doc.type.schema.marks[markName].isInSet(fromNodeAfter.marks);
    const actionId = inlineActionMark?.attrs.id;
    return highlightElement({ id: actionId, view, elementId, markName, key, prefix });
  }
  return false;
}

export function highlightElement ({ id, key, prefix, elementId, view }:
  { id: string, key: PluginKey, prefix: string, elementId: string, markName: string, view: EditorView }) {

  const pageActionListNode = document.getElementById(elementId) as HTMLDivElement;
  // Page action list node might not be present
  const isShowingActionList = pageActionListNode.style.visibility !== 'hidden';
  // Check if we are inside a card page modal
  const cardId = (new URLSearchParams(window.location.href)).get('cardId');

  if (id) {
    // If we are showing the thread list on the right, then navigate to the appropriate thread and highlight it
    if (isShowingActionList && !cardId) {
      // Use regular dom methods as we have no access to a ref inside a plugin
      // Plus this is only a cosmetic change which doesn't impact any of the state
      const actionDocument = document.getElementById(`${prefix}.${id}`);
      if (actionDocument) {
        highlightDomElement(actionDocument);
        return true;
      }
    }
    else {
      // If the page thread list isn't open, then we need to show the inline thread component
      renderSuggestionsTooltip(key, {
        ids: [id]
      })(view.state, view.dispatch, view);
      return true;
    }
  }
  return false;
}
