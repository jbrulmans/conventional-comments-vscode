import * as vscode from "vscode";
import { PrefixEdit, mapOffset } from "./conventions";

/** URI scheme VS Code uses for comment widget input boxes. */
export const COMMENT_SCHEME = "comment";

// Comment inputs are exposed to extensions as regular text editors and become
// `activeTextEditor` while focused. Clicking a comment action button moves
// focus away briefly, so remember the last focused one instead of relying on
// `activeTextEditor` at the time a command runs.

let lastEditor: vscode.TextEditor | undefined;
let lastDocument: vscode.TextDocument | undefined;

const onDidChangeTargetEmitter = new vscode.EventEmitter<{ textChanged: boolean }>();
/** Fires when the target comment changes, or its text does. */
export const onDidChangeTarget = onDidChangeTargetEmitter.event;

function isComment(doc: vscode.TextDocument | undefined): doc is vscode.TextDocument {
  return !!doc && !doc.isClosed && doc.uri.scheme === COMMENT_SCHEME;
}

function setTarget(editor: vscode.TextEditor | undefined): void {
  if (!editor || !isComment(editor.document)) return;
  const changed = editor.document !== lastDocument;
  lastEditor = editor;
  lastDocument = editor.document;
  if (changed) onDidChangeTargetEmitter.fire({ textChanged: true });
}

export function getTargetDocument(): vscode.TextDocument | undefined {
  const active = vscode.window.activeTextEditor;
  if (active && isComment(active.document)) {
    setTarget(active);
    return active.document;
  }
  return isComment(lastDocument) ? lastDocument : undefined;
}

export function findDocument(uri: string): vscode.TextDocument | undefined {
  return vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri);
}

export function trackCommentEditors(): vscode.Disposable[] {
  setTarget(vscode.window.activeTextEditor);
  return [
    onDidChangeTargetEmitter,
    vscode.window.onDidChangeActiveTextEditor(setTarget),
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document === lastDocument) onDidChangeTargetEmitter.fire({ textChanged: true });
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (doc !== lastDocument) return;
      lastEditor = undefined;
      lastDocument = undefined;
      onDidChangeTargetEmitter.fire({ textChanged: true });
    }),
  ];
}

export async function applyPrefixEdit(
  doc: vscode.TextDocument,
  edit: PrefixEdit
): Promise<void> {
  const range = new vscode.Range(doc.positionAt(0), doc.positionAt(edit.end));
  const editor = [vscode.window.activeTextEditor, lastEditor].find(
    (e) => e?.document === doc && vscode.window.visibleTextEditors.includes(e)
  );

  const anchor = editor && mapOffset(doc.offsetAt(editor.selection.anchor), edit);
  const active = editor && mapOffset(doc.offsetAt(editor.selection.active), edit);

  // `TextEditor.edit` can report success without changing a comment input
  // (e.g. when the editor is read-only), so edit the document directly.
  const wsEdit = new vscode.WorkspaceEdit();
  wsEdit.replace(doc.uri, range, edit.text);
  await vscode.workspace.applyEdit(wsEdit);

  if (editor && anchor !== undefined && active !== undefined) {
    editor.selection = new vscode.Selection(doc.positionAt(anchor), doc.positionAt(active));
  }
}
