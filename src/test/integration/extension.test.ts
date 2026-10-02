import { strict as assert } from "node:assert";
import * as vscode from "vscode";
import { LABELS, buildPrefix } from "../../conventions";

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

const labelOf = (i: vscode.CompletionItem) => (typeof i.label === "string" ? i.label : i.label.label);

async function completions(
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
async function accept(editor: vscode.TextEditor, item: vscode.CompletionItem | undefined): Promise<void> {
  assert.ok(item, "completion item not found");
  assert.equal(item.command, undefined, "prefix items must not depend on commands");
  const edit = new vscode.WorkspaceEdit();
  edit.set(editor.document.uri, item.additionalTextEdits ?? []);
  await vscode.workspace.applyEdit(edit);
}

const run = (command: string) => vscode.commands.executeCommand(command);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  it("suggests all labels at the start of a comment", async () => {
    const editor = await openComment();
    const labels = (await completions(editor, new vscode.Position(0, 0))).map(labelOf);
    for (const { label } of LABELS) {
      assert.ok(labels.includes(label), `missing ${label} in ${labels}`);
    }
  });

  it("suggests labels after typing /", async () => {
    const editor = await openComment("/");
    const labels = (await completions(editor, new vscode.Position(0, 1), "/")).map(labelOf);
    assert.ok(labels.includes("suggestion"), `got ${labels}`);
  });

  it("does not suggest labels in the middle of a comment", async () => {
    const editor = await openComment("looks good /");
    const labels = (await completions(editor, new vscode.Position(0, 12), "/")).map(labelOf);
    assert.ok(!labels.includes("suggestion"), `got ${labels}`);
  });

  it("sorts its items before other providers' (e.g. GitHub issues)", async () => {
    const issueSortText = "00000000"; // what the GitHub PR extension uses
    for (const text of ["", "nitpick: "]) {
      const editor = await openComment(text);
      const items = await completions(editor, editor.document.positionAt(text.length));
      const ours = items.filter((i) => i.kind === vscode.CompletionItemKind.EnumMember);
      assert.ok(ours.length >= LABELS.length, `only ${ours.length} items of ours`);
      for (const item of ours) {
        assert.ok(item.sortText! < issueSortText, `${labelOf(item)} sorts after issues`);
      }
    }
  });

  it("sets one decoration at a time from suggestions", async () => {
    const editor = await openComment("suggestion: use a map");
    // Right after the label, e.g. after `suggestion (non-blocking): `.
    const at = () => {
      const text = editor.document.getText();
      return completions(editor, editor.document.positionAt(text.indexOf(": ") + 2));
    };
    const find = async (label: string) => (await at()).find((i) => labelOf(i) === label);

    await accept(editor, await find("(non-blocking)"));
    assert.equal(editor.document.getText(), "suggestion (non-blocking): use a map");

    await accept(editor, await find("(if-minor)"));
    assert.equal(editor.document.getText(), "suggestion (if-minor): use a map");

    await accept(editor, await find("issue"));
    assert.equal(editor.document.getText(), "issue (if-minor): use a map");

    await accept(editor, await find("remove (if-minor)"));
    assert.equal(editor.document.getText(), "issue: use a map");
  });

  it("toggles the format from the header button", async () => {
    const editor = await openComment("thought (non-blocking): later");
    await run("conventionalComments.header.plain");
    assert.equal(
      editor.document.getText(),
      buildPrefix("thought", ["non-blocking"], true) + "later"
    );
    await run("conventionalComments.header.badge");
    assert.equal(editor.document.getText(), "thought (non-blocking): later");
  });

  it("inserts a label and decoration through the picker", async () => {
    const editor = await openComment("use a map here");
    const picking = vscode.commands.executeCommand("conventionalComments.insertLabel");

    // Label step: praise is active; move to suggestion.
    await sleep(300);
    await run("workbench.action.quickOpenSelectNext");
    await run("workbench.action.quickOpenSelectNext");
    await run("workbench.action.acceptSelectedQuickOpenItem");

    // Decoration step: "none" is active; move to non-blocking.
    await sleep(300);
    await run("workbench.action.quickOpenSelectNext");
    await run("workbench.action.acceptSelectedQuickOpenItem");
    await picking;

    assert.equal(editor.document.getText(), "suggestion (non-blocking): use a map here");
  });

  it("only offers label edits with the cursor right after the label", async () => {
    const editor = await openComment("suggestion: foo");
    const inside = (await completions(editor, new vscode.Position(0, 5))).map(labelOf);
    assert.ok(!inside.includes("(non-blocking)"), `got ${inside}`);
    const after = (await completions(editor, new vscode.Position(0, 12))).map(labelOf);
    assert.ok(after.includes("(non-blocking)"), `got ${after}`);
  });

  it("remembers the format chosen through a suggestion", async () => {
    const editor = await openComment("issue: x");
    await run("conventionalComments.toggleFormat"); // badge, remembered for this comment
    const badgeEnd = buildPrefix("issue", [], true).length;
    const items = await completions(editor, editor.document.positionAt(badgeEnd));
    await accept(editor, items.find((i) => labelOf(i) === "switch to plain text"));
    assert.equal(editor.document.getText(), "issue: x");

    await run("conventionalComments.removeLabel");
    const praise = (await completions(editor, new vscode.Position(0, 0))).find(
      (i) => labelOf(i) === "praise"
    );
    assert.equal(praise?.insertText, "praise: ");
  });

  it("removes the label from the palette", async () => {
    const editor = await openComment("chore (if-minor): bump deps");
    await run("conventionalComments.removeLabel");
    assert.equal(editor.document.getText(), "bump deps");
  });
});
