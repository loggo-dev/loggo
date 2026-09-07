import { languages } from "@codemirror/language-data";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

export { languages };

const codeHighlightStyle = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.moduleKeyword, t.definitionKeyword], color: "var(--code-keyword)" },
  { tag: [t.string, t.docString, t.character, t.regexp, t.special(t.string)], color: "var(--code-string)" },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: "var(--code-comment)", fontStyle: "italic" },
  { tag: [t.number, t.integer, t.float, t.bool, t.null], color: "var(--code-number)" },
  { tag: [t.atom, t.contentSeparator], color: "var(--muted-foreground)" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.macroName], color: "var(--code-function)" },
  { tag: [t.propertyName, t.attributeName, t.tagName, t.typeName, t.className, t.namespace], color: "var(--code-property)" },
  { tag: [t.deleted, t.invalid], color: "var(--destructive)" },
]);

export const codeHighlighting = syntaxHighlighting(codeHighlightStyle, { fallback: true });
