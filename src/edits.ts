import * as vscode from "vscode";
import { PrefixEdit, mapOffset } from "./conventions";
import { getTargetEditor } from "./target";

/** Applies a prefix edit to a comment and keeps the cursor where the user had it. */
export async function applyPrefixEdit(doc: vscode.TextDocument, edit: PrefixEdit): Promise<void> {
  const range = new vscode.Range(doc.positionAt(0), doc.positionAt(edit.end));
  const editor = getTargetEditor();
  const selection =
    editor?.document === doc && vscode.window.visibleTextEditors.includes(editor)
      ? {
          anchor: mapOffset(doc.offsetAt(editor.selection.anchor), edit),
          active: mapOffset(doc.offsetAt(editor.selection.active), edit),
        }
      : undefined;

  // `TextEditor.edit` can report success without changing a comment input
  // (e.g. when the editor is read-only), so edit the document directly.
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.replace(doc.uri, range, edit.text);
  await vscode.workspace.applyEdit(workspaceEdit);

  if (editor && selection) {
    editor.selection = new vscode.Selection(
      doc.positionAt(selection.anchor),
      doc.positionAt(selection.active)
    );
  }
}
