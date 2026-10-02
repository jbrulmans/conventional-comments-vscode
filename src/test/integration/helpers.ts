import { strict as assert } from "node:assert";
import * as vscode from "vscode";
import { Format } from "../../conventions";

export const run = (command: string, ...args: unknown[]) =>
  vscode.commands.executeCommand(command, ...args);

export const labelOf = (item: vscode.CompletionItem) =>
  typeof item.label === "string" ? item.label : item.label.label;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Polls until `check` passes; fails with `what` after about two seconds. */
export async function waitFor(check: () => boolean, what: () => string): Promise<void> {
  for (let i = 0; i < 40; i++) {
    if (check()) return;
    await sleep(50);
  }
  assert.fail(`timed out waiting for ${what()}`);
}

/** Waits until the document's text is exactly `expected`. */
export function waitForText(doc: vscode.TextDocument, expected: string): Promise<void> {
  return waitFor(
    () => doc.getText() === expected,
    () => `${JSON.stringify(expected)}, got ${JSON.stringify(doc.getText())}`
  );
}

/**
 * Gives the suggest widget or a quick pick time to open and render. VS Code
 * exposes no state to wait on for either, so this is the one fixed delay.
 */
export const waitForWidget = () => sleep(400);

export async function activateExtension(): Promise<void> {
  await vscode.extensions.getExtension("jbrulmans.conventional-comments-vscode")!.activate();
}

/** Sets `conventionalComments.defaultFormat`; `undefined` resets it. */
export async function setDefaultFormat(format: Format | undefined): Promise<void> {
  await vscode.workspace
    .getConfiguration("conventionalComments")
    .update("defaultFormat", format, vscode.ConfigurationTarget.Global);
}

let commentCounter = 0;

/**
 * Opens a fresh `comment:` document, as VS Code creates for comment boxes, in a
 * regular editor. It is read-only for `TextEditor.edit` there, but workspace
 * edits apply (as the extension does).
 */
export async function openComment(text = ""): Promise<vscode.TextEditor> {
  const uri = vscode.Uri.parse(`comment://test/commentinput-${++commentCounter}.md`);
  const editor = await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));
  if (text) {
    const edit = new vscode.WorkspaceEdit();
    edit.insert(uri, new vscode.Position(0, 0), text);
    await vscode.workspace.applyEdit(edit);
  }
  return editor;
}

export async function completions(
  editor: vscode.TextEditor,
  position: vscode.Position,
  trigger?: string
): Promise<vscode.CompletionItem[]> {
  const list = await vscode.commands.executeCommand<vscode.CompletionList>(
    "vscode.executeCompletionItemProvider",
    editor.document.uri,
    position,
    trigger
  );
  return list.items;
}

/** Applies an item's edits like the suggest widget does (without its UI). */
export async function acceptEdits(
  editor: vscode.TextEditor,
  item: vscode.CompletionItem | undefined
): Promise<void> {
  assert.ok(item, "completion item not found");
  assert.equal(item.command, undefined, "prefix items must not depend on commands");
  const edit = new vscode.WorkspaceEdit();
  edit.set(editor.document.uri, item.additionalTextEdits ?? []);
  await vscode.workspace.applyEdit(edit);
}
