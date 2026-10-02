import * as vscode from "vscode";
import { parsePrefix } from "./conventions";
import { getTargetDocument, onDidChangeTarget } from "./target";

// Exposes the state of the focused comment (label, decoration, format) as
// context keys, which drive the checkmarks in the header menu.

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

export function updateContext(): void {
  const doc = getTargetDocument();
  const prefix = doc && parsePrefix(doc.getText());
  const set = (key: string, value: unknown) =>
    vscode.commands.executeCommand("setContext", `conventionalComments.${key}`, value);

  set("label", prefix?.label ?? "");
  set("decoration", prefix?.decoration ?? "");
  set("prettified", doc ? isPrettified(doc) : true);
}

export function registerToolbarState(): vscode.Disposable[] {
  updateContext();
  return [
    onDidChangeTarget(updateContext),
    vscode.workspace.onDidCloseTextDocument((doc) => prettifiedByUri.delete(doc.uri.toString())),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("conventionalComments.prettify")) updateContext();
    }),
  ];
}
