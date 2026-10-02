import { strict as assert } from "node:assert";
import * as vscode from "vscode";
import { buildPrefix } from "../../conventions";

// Comment widget inputs are `comment:` documents. VS Code core provides their
// content, so tests can open one in a regular editor and drive the commands.

let counter = 0;

async function openComment(text = ""): Promise<vscode.TextEditor> {
  const uri = vscode.Uri.parse(`comment://test/commentinput-${++counter}.md`);
  const doc = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(doc);
  if (text) {
    // Opened in a regular editor these documents are read-only for
    // `TextEditor.edit`, but workspace edits apply (as the extension does).
    const edit = new vscode.WorkspaceEdit();
    edit.insert(uri, new vscode.Position(0, 0), text);
    await vscode.workspace.applyEdit(edit);
  }
  return editor;
}

async function completionLabels(
  editor: vscode.TextEditor,
  position: vscode.Position,
  trigger?: string
): Promise<string[]> {
  const list = await vscode.commands.executeCommand<vscode.CompletionList>(
    "vscode.executeCompletionItemProvider",
    editor.document.uri,
    position,
    trigger
  );
  return list.items.map((i) => (typeof i.label === "string" ? i.label : i.label.label));
}

const run = (command: string) => vscode.commands.executeCommand(command);

describe("Conventional Comments", () => {
  before(async () => {
    const ext = vscode.extensions.getExtension("jbrulmans.conventional-comments-vscode");
    await ext!.activate();
    await vscode.workspace
      .getConfiguration("conventionalComments")
      .update("prettify", false, vscode.ConfigurationTarget.Global);
  });

  after(async () => {
    await vscode.workspace
      .getConfiguration("conventionalComments")
      .update("prettify", undefined, vscode.ConfigurationTarget.Global);
  });

  it("is a comment: document opened by VS Code core", async () => {
    const editor = await openComment();
    assert.equal(editor.document.uri.scheme, "comment");
  });

  it("suggests labels at the start of a comment", async () => {
    const editor = await openComment();
    const labels = await completionLabels(editor, new vscode.Position(0, 0));
    for (const label of ["praise", "nitpick", "suggestion", "todo", "issue", "question", "thought", "chore"]) {
      assert.ok(labels.includes(label), `missing ${label} in ${labels}`);
    }
  });

  it("suggests labels after typing /", async () => {
    const editor = await openComment("/");
    const labels = await completionLabels(editor, new vscode.Position(0, 1), "/");
    assert.ok(labels.includes("suggestion"), `got ${labels}`);
  });

  it("does not suggest labels in the middle of a comment", async () => {
    const editor = await openComment("looks good /");
    const labels = await completionLabels(editor, new vscode.Position(0, 12), "/");
    assert.ok(!labels.includes("suggestion"), `got ${labels}`);
  });

  it("drives the toolbar buttons like the original", async () => {
    const editor = await openComment("use a map here");
    const text = () => editor.document.getText();

    await run("conventionalComments.button.label.suggestion");
    assert.equal(text(), "suggestion: use a map here");

    await run("conventionalComments.button.decoration.non-blocking");
    assert.equal(text(), "suggestion(non-blocking): use a map here");

    await run("conventionalComments.button.decorationSelected.non-blocking");
    assert.equal(text(), "suggestion: use a map here");

    await run("conventionalComments.button.changeLabel.suggestion");
    await run("conventionalComments.button.label.issue");
    assert.equal(text(), "issue: use a map here");

    await run("conventionalComments.button.format");
    assert.equal(text(), buildPrefix("issue", undefined, true) + "use a map here");

    await run("conventionalComments.button.formatSelected");
    assert.equal(text(), "issue: use a map here");

    await run("conventionalComments.button.changeLabel.issue");
    await run("conventionalComments.button.labelSelected.issue");
    assert.equal(text(), "use a map here");
  });

  it("keeps the badge toggle for a comment without a label", async () => {
    const editor = await openComment("hello");
    await run("conventionalComments.button.format");
    await run("conventionalComments.button.label.praise");
    assert.equal(editor.document.getText(), buildPrefix("praise", undefined, true) + "hello");
  });

  it("removes the label from the palette", async () => {
    const editor = await openComment("chore(if-minor): bump deps");
    await run("conventionalComments.removeLabel");
    assert.equal(editor.document.getText(), "bump deps");
  });
});
