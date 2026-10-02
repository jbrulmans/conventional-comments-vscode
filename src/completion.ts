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
import { isPrettified } from "./toolbar";

function documentation(item: Convention, badgeUrl: string): vscode.MarkdownString {
  return new vscode.MarkdownString(`${item.desc}\n\n![${item.label}](${badgeUrl})`);
}

/**
 * Plays the role of the original toolbar inside comment input boxes:
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
    return this.prefixReplacements(doc, existing.label, existing.decoration, position);
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
      item.insertText = buildPrefix(l.label, undefined, prettified);
      item.range = range;
      item.filterText = slash ? `/${l.label}` : l.label;
      item.sortText = String(i).padStart(2, "0");
      item.documentation = documentation(l, createBadgeUrl(l.label));
      // Second step: offer decorations right away, like the original toolbar.
      item.command = { command: "editor.action.triggerSuggest", title: "" };
      return item;
    });
  }

  private prefixReplacements(
    doc: vscode.TextDocument,
    label: string,
    decoration: string | undefined,
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

    DECORATIONS.forEach((d, i) => {
      const selected = d.label === decoration;
      const item = make(
        `(${d.label})`,
        selected ? `remove decoration · ${d.desc}` : d.desc,
        `0${i}`,
        {
          command: Commands.applyPrefix,
          title: "",
          arguments: [uri, label, selected ? undefined : d.label],
        }
      );
      item.documentation = documentation(d, createBadgeUrl(label, d.label));
    });

    LABELS.filter((l) => l.label !== label).forEach((l, i) => {
      const item = make(l.label, `change label · ${l.desc}`, `1${i}`, {
        command: Commands.applyPrefix,
        title: "",
        arguments: [uri, l.label, undefined],
      });
      item.documentation = documentation(l, createBadgeUrl(l.label));
    });

    make(`remove ${label}`, "Remove the conventional comment label.", "2", {
      command: Commands.removeLabel,
      title: "",
      arguments: [uri],
    });
    make("toggle format", "Switch between badge and plain text.", "3", {
      command: Commands.toggleFormat,
      title: "",
      arguments: [uri],
    });

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
