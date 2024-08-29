import { react } from '@nytimes/react-prosemirror';
import type { Schema } from 'prosemirror-model';
import type { Plugin } from 'prosemirror-state';

import { buildPlugins } from './buildPlugins';
import { plugins as historyPlugins } from './plugins/history';
import { plugins as listItemPlugins } from './plugins/listItem/listItemPlugins';
import { plugins as tabIndentPlugins } from './plugins/tabIndent';

export const plugins = (schema: Schema): Plugin[] => [
  // You must add the react plugin if you use
  // the useNodeViews or useNodePos hook.
  react(),
  ...buildPlugins(schema, [
    historyPlugins(),
    listItemPlugins(),
    // tabIndent should be triggered last so other plugins can override the keymap
    tabIndentPlugins()
  ])
];
