import { strict as assert } from "node:assert";
import * as vscode from "vscode";
import { LABELS, buildPrefix } from "../../conventions";
import {
  acceptEdits,
  activateExtension,
  completions,
  labelOf,
  openComment,
  run,
  setDefaultFormat,
  waitForWidget,
} from "./helpers";

describe("Conventional Comments", () => {
  before(async () => {
    await activateExtension();
    await setDefaultFormat("plain");
  });

  after(() => setDefaultFormat(undefined));

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

    await acceptEdits(editor, await find("(non-blocking)"));
    assert.equal(editor.document.getText(), "suggestion (non-blocking): use a map");

    await acceptEdits(editor, await find("(if-minor)"));
    assert.equal(editor.document.getText(), "suggestion (if-minor): use a map");

    await acceptEdits(editor, await find("issue"));
    assert.equal(editor.document.getText(), "issue (if-minor): use a map");

    await acceptEdits(editor, await find("remove (if-minor)"));
    assert.equal(editor.document.getText(), "issue: use a map");
  });

  it("toggles the format from the header button", async () => {
    const editor = await openComment("thought (non-blocking): later");
    await run("conventionalComments.header.plain");
    assert.equal(
      editor.document.getText(),
      buildPrefix("thought", ["non-blocking"], "badge") + "later"
    );
    await run("conventionalComments.header.badge");
    assert.equal(editor.document.getText(), "thought (non-blocking): later");
  });

  it("inserts a label and decoration through the picker", async () => {
    const editor = await openComment("use a map here");
    const picking = run("conventionalComments.insertLabel");

    // Label step: praise is active; move to suggestion.
    await waitForWidget();
    await run("workbench.action.quickOpenSelectNext");
    await run("workbench.action.quickOpenSelectNext");
    await run("workbench.action.acceptSelectedQuickOpenItem");

    // Decoration step: "none" is active; move to non-blocking.
    await waitForWidget();
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
    const badgeEnd = buildPrefix("issue", [], "badge").length;
    const items = await completions(editor, editor.document.positionAt(badgeEnd));
    await acceptEdits(editor, items.find((i) => labelOf(i) === "switch to plain text"));
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
