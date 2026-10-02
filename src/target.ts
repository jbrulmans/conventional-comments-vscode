import * as vscode from "vscode";

/** URI scheme VS Code uses for comment widget input boxes. */
export const COMMENT_SCHEME = "comment";

// Comment inputs are exposed to extensions as regular text editors and become
// `activeTextEditor` while focused. Header buttons and the picker take focus
// away, so commands act on the last focused comment editor instead of relying
// on `activeTextEditor` at the time they run.

let lastEditor: vscode.TextEditor | undefined;

const onDidChangeTargetEmitter = new vscode.EventEmitter<void>();
/** Fires when another comment becomes the target, or the target's text changes. */
export const onDidChangeTarget = onDidChangeTargetEmitter.event;

function isOpenComment(doc: vscode.TextDocument | undefined): doc is vscode.TextDocument {
  return !!doc && !doc.isClosed && doc.uri.scheme === COMMENT_SCHEME;
}

function track(editor: vscode.TextEditor | undefined): void {
  if (!editor || !isOpenComment(editor.document)) return;
  const changed = editor.document !== lastEditor?.document;
  lastEditor = editor;
  if (changed) onDidChangeTargetEmitter.fire();
}

/** The comment editor the user is in, or was in last. */
export function getTargetEditor(): vscode.TextEditor | undefined {
  const active = vscode.window.activeTextEditor;
  if (active && isOpenComment(active.document)) return active;
  return isOpenComment(lastEditor?.document) ? lastEditor : undefined;
}

export function getTargetDocument(): vscode.TextDocument | undefined {
  return getTargetEditor()?.document;
}

export function trackCommentEditors(): vscode.Disposable[] {
  track(vscode.window.activeTextEditor);
  return [
    onDidChangeTargetEmitter,
    vscode.window.onDidChangeActiveTextEditor(track),
    vscode.workspace.onDidChangeTextDocument(({ document }) => {
      if (document === lastEditor?.document) onDidChangeTargetEmitter.fire();
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (doc !== lastEditor?.document) return;
      lastEditor = undefined;
      onDidChangeTargetEmitter.fire();
    }),
  ];
}
