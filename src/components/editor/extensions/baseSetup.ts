import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";

import type { Extension } from "@codemirror/state";
import { highlightSpecialChars, keymap } from "@codemirror/view";

// Same as `minimalSetup` from the "codemirror" package, minus
// `drawSelection()`. drawSelection replaces the browser's native caret with
// a JS-measured overlay rectangle; in testing that overlay intermittently
// failed to render (0 DOM cursor nodes despite the editor being genuinely
// focused - e.g. right after continuing a list with Enter), leaving no
// visible caret at all with no fallback. The native caret can't silently
// fail to render like that, so it's the more robust default here.
export const baseSetup: Extension[] = [
  highlightSpecialChars(),
  history(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
];
