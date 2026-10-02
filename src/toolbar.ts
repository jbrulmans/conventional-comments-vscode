import * as vscode from "vscode";
import { parsePrefix } from "./conventions";
import { getTargetDocument, onDidChangeTarget } from "./target";

// Mirrors the toolbar states of the original (`renderToolbar` in badges.js) as
// context keys, which drive the `when` clauses of the comment editor buttons.

const prettifiedByUri = new Map<string, boolean>();
let changingLabel = false;

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

export function setChangingLabel(value: boolean): void {
  changingLabel = value;
  updateContext();
}

export function updateContext(): void {
  const doc = getTargetDocument();
  const prefix = doc && parsePrefix(doc.getText());
  const set = (key: string, value: unknown) =>
    vscode.commands.executeCommand("setContext", `conventionalComments.${key}`, value);

  set("label", prefix?.label ?? "");
  set("decoration", prefix?.decoration ?? "");
  set("changingLabel", changingLabel && !!prefix);
  set("prettified", doc ? isPrettified(doc) : true);
}

export function registerToolbarState(): vscode.Disposable[] {
  updateContext();
  return [
    onDidChangeTarget(({ textChanged }) => {
      if (textChanged) changingLabel = false;
      updateContext();
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => prettifiedByUri.delete(doc.uri.toString())),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("conventionalComments.prettify")) updateContext();
    }),
  ];
}
