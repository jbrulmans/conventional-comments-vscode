import * as vscode from "vscode";
import { Format, parsePrefix } from "./conventions";
import { COMMENT_SCHEME, getTargetDocument, onDidChangeTarget } from "./target";

// Tracks whether each comment uses the badge or plain text format, and exposes
// the focused comment's format as a context key for the header toggle icon.

const formatByUri = new Map<string, Format>();

function defaultFormat(): Format {
  return vscode.workspace
    .getConfiguration("conventionalComments")
    .get<Format>("defaultFormat", "badge");
}

/** A comment's format: its existing prefix wins, then the remembered one, then the setting. */
export function formatOf(doc: vscode.TextDocument): Format {
  return (
    parsePrefix(doc.getText())?.format ?? formatByUri.get(doc.uri.toString()) ?? defaultFormat()
  );
}

export function rememberFormat(doc: vscode.TextDocument, format: Format): void {
  formatByUri.set(doc.uri.toString(), format);
  updateContext();
}

function updateContext(): void {
  const doc = getTargetDocument();
  const format = doc ? formatOf(doc) : defaultFormat();
  vscode.commands.executeCommand("setContext", "conventionalComments.format", format);
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
      if (prefix) formatByUri.set(document.uri.toString(), prefix.format);
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => formatByUri.delete(doc.uri.toString())),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("conventionalComments.defaultFormat")) updateContext();
    }),
  ];
}
