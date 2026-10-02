import * as vscode from "vscode";
import { Commands } from "./commands";
import {
  Convention,
  DECORATIONS,
  LABELS,
  buildPrefix,
  createBadgeUrl,
  parsePrefix,
} from "./conventions";
import { COMMENT_SCHEME } from "./target";
import { isPrettified } from "./format";

// Other providers in comment boxes (e.g. GitHub issues, sorted "00000000",
// "00000001", ...) are mixed into the same list. A leading space sorts before
// any digit or letter, keeping our items on top.
function sortKey(group: number, index = 0): string {
  return ` ${group}${String(index).padStart(2, "0")}`;
}

function documentation(item: Convention, badgeUrl: string): vscode.MarkdownString {
  return new vscode.MarkdownString(`${item.desc}\n\n![${item.label}](${badgeUrl})`);
}

/**
 * Label picker inside comment input boxes:
 * - no prefix yet: offer labels at the start of the comment (also after `/`);
 * - cursor inside an existing prefix: offer decorations, other labels and removal.
 */
export class ConventionalCommentsCompletionProvider
  implements vscode.CompletionItemProvider
{
  provideCompletionItems(
    doc: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.CompletionItem[] | undefined {
    const text = doc.getText();
    const offset = doc.offsetAt(position);
    const existing = parsePrefix(text);

    if (!existing) {
      return this.labelInsertions(doc, text, offset, position);
    }
    const triggeredBySlash =
      context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter;
    if (offset > existing.length || triggeredBySlash) {
      return undefined;
    }
    return this.prefixReplacements(doc, existing.label, existing.decorations, position);
  }

  private labelInsertions(
    doc: vscode.TextDocument,
    text: string,
    offset: number,
    position: vscode.Position
  ): vscode.CompletionItem[] | undefined {
    // Only at the very start of the comment, optionally after `/` and a partial word.
    const typed = text.substring(0, offset).match(/^\s*(\/?[a-z-]*)$/i);
    if (!typed) return undefined;

    const slash = typed[1].startsWith("/");
    const range = new vscode.Range(doc.positionAt(offset - typed[1].length), position);
    const prettified = isPrettified(doc);

    return LABELS.map((l, i) => {
      const item = new vscode.CompletionItem(
        { label: l.label, description: l.desc },
        vscode.CompletionItemKind.EnumMember
      );
      item.insertText = buildPrefix(l.label, [], prettified);
      item.range = range;
      item.filterText = slash ? `/${l.label}` : l.label;
      item.sortText = sortKey(l.expressive ? 1 : 0, i);
      item.preselect = i === 0;
      item.documentation = documentation(l, createBadgeUrl(l.label));
      // Second step: offer decorations right away.
      item.command = { command: "editor.action.triggerSuggest", title: "" };
      return item;
    });
  }

  private prefixReplacements(
    doc: vscode.TextDocument,
    label: string,
    decorations: string[],
    position: vscode.Position
  ): vscode.CompletionItem[] {
    // The prefix may span lines (badge form), which a completion range cannot,
    // so items insert nothing and a command rewrites the prefix.
    const range = new vscode.Range(position, position);
    const uri = doc.uri.toString();
    const items: vscode.CompletionItem[] = [];

    const make = (
      name: string,
      description: string,
      sort: string,
      command: vscode.Command
    ) => {
      const item = new vscode.CompletionItem(
        { label: name, description },
        vscode.CompletionItemKind.EnumMember
      );
      item.insertText = "";
      item.range = range;
      item.filterText = name;
      item.sortText = sort;
      item.command = command;
      items.push(item);
      return item;
    };

    // One decoration at a time: picking one replaces the current one.
    DECORATIONS.forEach((d, i) => {
      const selected = decorations.includes(d.label);
      const item = make(
        selected ? `remove (${d.label})` : `(${d.label})`,
        d.desc,
        sortKey(0, i),
        {
          command: Commands.applyPrefix,
          title: "",
          arguments: [uri, label, selected ? undefined : d.label],
        }
      );
      item.documentation = documentation(d, createBadgeUrl(label, [d.label]));
      item.preselect = i === 0;
    });

    // Changing the label keeps the decoration.
    const decoration = decorations[0];
    LABELS.filter((l) => l.label !== label).forEach((l, i) => {
      const item = make(l.label, `change label · ${l.desc}`, sortKey(1, i), {
        command: Commands.applyPrefix,
        title: "",
        arguments: [uri, l.label, decoration],
      });
      item.documentation = documentation(l, createBadgeUrl(l.label, decorations));
    });

    make(`remove ${label}`, "Remove the conventional comment label.", sortKey(2), {
      command: Commands.removeLabel,
      title: "",
      arguments: [uri],
    });
    const prettified = isPrettified(doc);
    make(
      prettified ? "switch to plain text" : "switch to badge",
      `Currently ${prettified ? "a badge" : "plain text"}.`,
      sortKey(3),
      { command: Commands.setFormat, title: "", arguments: [uri, !prettified] }
    );

    return items;
  }
}

export function registerCompletionProvider(): vscode.Disposable {
  return vscode.languages.registerCompletionItemProvider(
    { scheme: COMMENT_SCHEME },
    new ConventionalCommentsCompletionProvider(),
    "/"
  );
}
