import { strict as assert } from "node:assert";
import * as vscode from "vscode";
import { ConventionalCommentsCompletionProvider } from "../../completion";
import { buildPrefix } from "../../conventions";

// Accepts suggestions through the real suggest widget. `comment:` documents
// open read-only in a regular editor, so the provider is also registered for
// untitled documents here.

const run = (command: string, ...args: unknown[]) => vscode.commands.executeCommand(command, ...args);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor(check: () => boolean, what: string): Promise<void> {
  for (let i = 0; i < 40; i++) {
    if (check()) return;
    await sleep(50);
  }
  assert.fail(`timed out waiting for ${what}`);
}

describe("Suggest widget", () => {
  let registration: vscode.Disposable;

  before(async () => {
    await vscode.extensions.getExtension("jbrulmans.conventional-comments-vscode")!.activate();
    registration = vscode.languages.registerCompletionItemProvider(
      { scheme: "untitled" },
      new ConventionalCommentsCompletionProvider(),
      "/"
    );
  });

  after(async () => {
    registration.dispose();
    await vscode.workspace
      .getConfiguration("conventionalComments")
      .update("prettify", undefined, vscode.ConfigurationTarget.Global);
  });

  async function pickIssueThenDecorations(prettify: boolean): Promise<vscode.TextDocument> {
    await vscode.workspace
      .getConfiguration("conventionalComments")
      .update("prettify", prettify, vscode.ConfigurationTarget.Global);
    const doc = await vscode.workspace.openTextDocument({ language: "markdown", content: "" });
    await vscode.window.showTextDocument(doc);

    // `/` opens the labels; praise, nitpick, suggestion, issue.
    await run("type", { text: "/" });
    await sleep(400);
    await run("selectNextSuggestion");
    await run("selectNextSuggestion");
    await run("selectNextSuggestion");
    await run("acceptSelectedSuggestion");
    await waitFor(() => doc.getText().startsWith(buildPrefix("issue", [], prettify)), "issue label");

    // The decoration list opens right after, with (non-blocking) preselected.
    await sleep(400);
    await run("acceptSelectedSuggestion");
    return doc;
  }

  for (const prettify of [false, true]) {
    it(`applies a decoration picked after a / label (${prettify ? "badge" : "plain"})`, async () => {
      const doc = await pickIssueThenDecorations(prettify);
      await waitFor(
        () => doc.getText() === buildPrefix("issue", ["non-blocking"], prettify),
        `issue (non-blocking), got ${JSON.stringify(doc.getText())}`
      );

      // Picking another decoration replaces it.
      await run("editor.action.triggerSuggest");
      await sleep(400);
      await run("selectNextSuggestion"); // (blocking)
      await run("selectNextSuggestion"); // (if-minor)
      await run("acceptSelectedSuggestion");
      await waitFor(
        () => doc.getText() === buildPrefix("issue", ["if-minor"], prettify),
        `issue (if-minor), got ${JSON.stringify(doc.getText())}`
      );

      await run("workbench.action.revertAndCloseActiveEditor");
    });
  }

  it("keeps the label intact when typing to filter the decorations", async () => {
    await vscode.workspace
      .getConfiguration("conventionalComments")
      .update("prettify", false, vscode.ConfigurationTarget.Global);
    const doc = await vscode.workspace.openTextDocument({ language: "markdown", content: "suggestion: foo" });
    const editor = await vscode.window.showTextDocument(doc);
    const end = doc.positionAt("suggestion: ".length);
    editor.selection = new vscode.Selection(end, end);

    await run("editor.action.triggerSuggest");
    await sleep(400);
    await run("type", { text: "if" });
    await sleep(400);
    await run("acceptSelectedSuggestion");
    await waitFor(
      () => doc.getText() === "suggestion (if-minor): foo",
      `suggestion (if-minor): foo, got ${JSON.stringify(doc.getText())}`
    );
    await run("workbench.action.revertAndCloseActiveEditor");
  });
});
