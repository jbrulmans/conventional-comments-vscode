import * as vscode from "vscode";
import { parsePrefix } from "./conventions";
import { COMMENT_SCHEME, getTargetDocument, onDidChangeTarget } from "./target";

// Tracks whether each comment uses the badge or plain text format, and exposes
// the focused comment's format as a context key for the header toggle icon.

const prettifiedByUri = new Map<string, boolean>();

/** Format for a comment: its existing prefix wins, then the toggle, then the setting. */
export function isPrettified(doc: vscode.TextDocument): boolean {
  return (
    parsePrefix(doc.getText())?.prettified ??
    prettifiedByUri.get(doc.uri.toString()) ??
    vscode.workspace.getConfiguration("conventionalComments").get<boolean>("prettify", true)
  );
}

export function setPrettified(doc: vscode.TextDocument, prettified: boolean): void {
  prettifiedByUri.set(doc.uri.toString(), prettified);
  updateContext();
}

function updateContext(): void {
  const doc = getTargetDocument();
  const prettified = doc
    ? isPrettified(doc)
    : vscode.workspace.getConfiguration("conventionalComments").get<boolean>("prettify", true);
  vscode.commands.executeCommand("setContext", "conventionalComments.prettified", prettified);
}

export function registerFormatState(): vscode.Disposable[] {
  updateContext();
  return [
    onDidChangeTarget(updateContext),
    // Remember the format of a label however it was written (picker, suggestion,
    // header button or by hand), so the next label uses the same one.
    vscode.workspace.onDidChangeTextDocument(({ document }) => {
      if (document.uri.scheme !== COMMENT_SCHEME) return;
      const prefix = parsePrefix(document.getText());
      if (prefix) prettifiedByUri.set(document.uri.toString(), prefix.prettified);
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => prettifiedByUri.delete(doc.uri.toString())),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("conventionalComments.prettify")) updateContext();
    }),
  ];
}
