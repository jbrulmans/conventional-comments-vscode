import * as vscode from "vscode";
import {
  DECORATIONS,
  Format,
  LABELS,
  ParsedPrefix,
  PrefixEdit,
  Term,
  buildPrefix,
  createBadgeUrl,
  otherFormat,
  parsePrefix,
  prefixEdit,
  removalEdit,
} from "./conventions";
import { formatOf } from "./format";
import { COMMENT_SCHEME } from "./target";

/** Text before the cursor at the start of a comment: optional `/` and a partial label. */
const LABEL_TRIGGER_REGEX = /^\s*(\/?[a-z-]*)$/i;

// Other providers in comment boxes (e.g. GitHub issues, sorted "00000000",
// "00000001", ...) are mixed into the same list. A leading space sorts before
// any digit or letter, keeping our items on top.
function sortKey(group: number, index = 0): string {
  return ` ${group}${String(index).padStart(2, "0")}`;
}

function documentation(term: Term, badgeUrl: string): vscode.MarkdownString {
  return new vscode.MarkdownString(`${term.desc}\n\n![${term.label}](${badgeUrl})`);
}

/** Labels offered at the start of a comment that has none yet. */
function labelInsertions(
  doc: vscode.TextDocument,
  position: vscode.Position
): vscode.CompletionItem[] | undefined {
  const beforeCursor = doc.getText(new vscode.Range(new vscode.Position(0, 0), position));
  const typed = beforeCursor.match(LABEL_TRIGGER_REGEX);
  if (!typed) return undefined;

  const word = typed[1];
  const range = new vscode.Range(position.translate(0, -word.length), position);
  const format = formatOf(doc);

  return LABELS.map((term, i) => {
    const item = new vscode.CompletionItem(
      { label: term.label, description: term.desc },
      vscode.CompletionItemKind.EnumMember
    );
    item.insertText = buildPrefix(term.label, [], format);
    item.range = range;
    item.filterText = word.startsWith("/") ? `/${term.label}` : term.label;
    item.sortText = sortKey(term.expressive ? 1 : 0, i);
    item.preselect = i === 0;
    item.documentation = documentation(term, createBadgeUrl(term.label));
    // Second step: offer decorations right away.
    item.command = { command: "editor.action.triggerSuggest", title: "" };
    return item;
  });
}

interface PrefixItemOptions {
  name: string;
  description: string;
  sortText: string;
  edit: PrefixEdit | undefined;
  documentation?: vscode.MarkdownString;
  preselect?: boolean;
}

/**
 * An item that rewrites the existing prefix. It inserts nothing at the cursor
 * and rewrites the prefix through an additional edit, since the prefix may span
 * lines (badge form). It must not rely on a command with arguments: VS Code
 * releases the completion list (and the cached arguments) before running an
 * accepted item's command.
 */
function prefixItem(position: vscode.Position, options: PrefixItemOptions): vscode.CompletionItem {
  const item = new vscode.CompletionItem(
    { label: options.name, description: options.description },
    vscode.CompletionItemKind.EnumMember
  );
  item.insertText = "";
  item.range = new vscode.Range(position, position);
  item.filterText = options.name;
  item.sortText = options.sortText;
  item.documentation = options.documentation;
  item.preselect = options.preselect;
  if (options.edit) {
    // The cursor sits right after the prefix; typed filter text goes there.
    const range = new vscode.Range(new vscode.Position(0, 0), position);
    item.additionalTextEdits = [vscode.TextEdit.replace(range, options.edit.text)];
  }
  return item;
}

interface PrefixContext {
  text: string;
  prefix: ParsedPrefix;
  format: Format;
  position: vscode.Position;
}

/** One decoration at a time: picking one replaces the current one, picking it again removes it. */
function decorationItems({ text, prefix, format, position }: PrefixContext): vscode.CompletionItem[] {
  return DECORATIONS.map((term, i) => {
    const selected = prefix.decorations.includes(term.label);
    return prefixItem(position, {
      name: selected ? `remove (${term.label})` : `(${term.label})`,
      description: term.desc,
      sortText: sortKey(0, i),
      edit: prefixEdit(text, prefix.label, selected ? [] : [term.label], format),
      documentation: documentation(term, createBadgeUrl(prefix.label, [term.label])),
      preselect: i === 0,
    });
  });
}

/** Changing the label keeps the (first) decoration. */
function labelChangeItems({ text, prefix, format, position }: PrefixContext): vscode.CompletionItem[] {
  const kept = prefix.decorations.slice(0, 1);
  return LABELS.filter((term) => term.label !== prefix.label).map((term, i) =>
    prefixItem(position, {
      name: term.label,
      description: `change label · ${term.desc}`,
      sortText: sortKey(1, i),
      edit: prefixEdit(text, term.label, kept, format),
      documentation: documentation(term, createBadgeUrl(term.label, kept)),
    })
  );
}

function removeItem({ text, prefix, position }: PrefixContext): vscode.CompletionItem {
  return prefixItem(position, {
    name: `remove ${prefix.label}`,
    description: "Remove the conventional comment label.",
    sortText: sortKey(2),
    edit: removalEdit(text),
  });
}

function formatSwitchItem({ text, prefix, format, position }: PrefixContext): vscode.CompletionItem {
  const target = otherFormat(format);
  return prefixItem(position, {
    name: target === "plain" ? "switch to plain text" : "switch to badge",
    description: `Currently ${format === "badge" ? "a badge" : "plain text"}.`,
    sortText: sortKey(3),
    edit: prefixEdit(text, prefix.label, prefix.decorations, target),
  });
}

/**
 * Label picker inside comment input boxes:
 * - no prefix yet: offer labels at the start of the comment (also after `/`);
 * - cursor right after an existing prefix: offer decorations, other labels and removal.
 */
export class ConventionalCommentsCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    doc: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.CompletionItem[] | undefined {
    const text = doc.getText();
    const prefix = parsePrefix(text);
    if (!prefix) return labelInsertions(doc, position);

    const triggeredBySlash = context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter;
    // Only right after the label: anything typed to filter the list then lands
    // after it, so the precomputed prefix edits stay valid.
    if (doc.offsetAt(position) !== prefix.end || triggeredBySlash) return undefined;

    const prefixContext: PrefixContext = { text, prefix, format: formatOf(doc), position };
    return [
      ...decorationItems(prefixContext),
      ...labelChangeItems(prefixContext),
      removeItem(prefixContext),
      formatSwitchItem(prefixContext),
    ];
  }
}

export function registerCompletionProvider(): vscode.Disposable {
  return vscode.languages.registerCompletionItemProvider(
    { scheme: COMMENT_SCHEME },
    new ConventionalCommentsCompletionProvider(),
    "/"
  );
}
