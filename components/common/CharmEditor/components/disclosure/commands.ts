import type { Command, Node } from '@bangle.dev/pm';
import { Fragment, TextSelection } from '@bangle.dev/pm';
import { findParentNodeOfTypeClosestToPos } from '@bangle.dev/utils';

// Backspace Use case: When a user hits 'backspace' at the beginning of a summary node
// Action: Remove the disclosure node
// Command: Grab all the child nodes inside summary and details, then replace
// the disclosure range with the children.
export const backspaceCmd: Command = (state, dispatch) => {
  const { tr } = state;
  // @ts-ignore types package is missing $cursor property as of 1.2.8
  const { $cursor } = state.selection;
  if (!$cursor) {
    return false;
  }

  const summaryNode = findParentNodeOfTypeClosestToPos($cursor, state.schema.nodes.disclosureSummary);
  const disclosureNode = findParentNodeOfTypeClosestToPos($cursor, state.schema.nodes.disclosureDetails);

  // if we are inside a summary node and at the beginning, delete the disclosure
  if ($cursor.parentOffset === 0 && disclosureNode && summaryNode) {
    const nodes: Node[] = [];

    summaryNode.node.descendants((node) => {
      nodes.push(node);
      return false;
    });

    disclosureNode.node.descendants((node) => {
      if (node.type.name !== 'disclosureSummary') {
        nodes.push(node);
      }
      return false;
    });

    const disclosureStart = disclosureNode.pos;
    const disclosureEnd = disclosureStart + disclosureNode.node.nodeSize;
    const nakedNodes = tr.doc.copy(Fragment.from(nodes));
    tr.replaceWith(disclosureStart, disclosureEnd, nakedNodes);
    // try to set cursor to first node, doesnt seem to work in FF
    tr.setSelection(new TextSelection(tr.doc.resolve(disclosureNode.pos)));
    if (dispatch) {
      dispatch(tr);
    }

    return true;
  }
  return false;
};

// TODO: we should move cursor to the content section when hitting Enter

export const moveDownCmd: Command = (state, dispatch) => {
  let { tr } = state;
  // @ts-ignore types package is missing $cursor property as of 1.2.8
  const { $cursor } = state.selection;
  const summaryNode = findParentNodeOfTypeClosestToPos($cursor, state.schema.nodes.disclosureSummary);
  const detailsNode = findParentNodeOfTypeClosestToPos($cursor, state.schema.nodes.disclosureDetails);
  // Must be in summary node for enter to take effect
  if (detailsNode && summaryNode) {
    const emptyParagraphNode = state.schema.nodes.paragraph.create();
    const summaryNodePosition = tr.doc.resolve(detailsNode.pos + summaryNode.node.nodeSize);
    tr = tr.setSelection(new TextSelection(summaryNodePosition)).replaceSelectionWith(emptyParagraphNode, false);
    tr.setSelection(new TextSelection(tr.doc.resolve(detailsNode.pos + summaryNode.node.nodeSize)));
    if (dispatch) {
      dispatch(tr);
    }
    return true;
  }
  return false;
};
