import * as vscode from "vscode";
import { ConventionalCommentsCompletionProvider } from "../../completion";
import { Format, buildPrefix } from "../../conventions";
import {
  activateExtension,
  run,
  setDefaultFormat,
  waitFor,
  waitForText,
  waitForWidget,
} from "./helpers";

// Accepts suggestions through the real suggest widget. `comment:` documents
// open read-only in a regular editor, so the provider is also registered for
// untitled documents here.

describe("Suggest widget", () => {
  let registration: vscode.Disposable;

  before(async () => {
    await activateExtension();
    registration = vscode.languages.registerCompletionItemProvider(
      { scheme: "untitled" },
      new ConventionalCommentsCompletionProvider(),
      "/"
    );
  });

  after(async () => {
    registration.dispose();
    await setDefaultFormat(undefined);
  });

  async function pickIssueThenDecorations(format: Format): Promise<vscode.TextDocument> {
    await setDefaultFormat(format);
    const doc = await vscode.workspace.openTextDocument({ language: "markdown", content: "" });
    await vscode.window.showTextDocument(doc);

    // `/` opens the labels; praise, nitpick, suggestion, issue.
    await run("type", { text: "/" });
    await waitForWidget();
    await run("selectNextSuggestion");
    await run("selectNextSuggestion");
    await run("selectNextSuggestion");
    await run("acceptSelectedSuggestion");
    await waitFor(
      () => doc.getText().startsWith(buildPrefix("issue", [], format)),
      () => `issue label, got ${JSON.stringify(doc.getText())}`
    );

    // The decoration list opens right after, with (non-blocking) preselected.
    await waitForWidget();
    await run("acceptSelectedSuggestion");
    return doc;
  }

  for (const format of ["plain", "badge"] as const) {
    it(`applies a decoration picked after a / label (${format})`, async () => {
      const doc = await pickIssueThenDecorations(format);
      await waitForText(doc, buildPrefix("issue", ["non-blocking"], format));

      // Picking another decoration replaces it.
      await run("editor.action.triggerSuggest");
      await waitForWidget();
      await run("selectNextSuggestion"); // (blocking)
      await run("selectNextSuggestion"); // (if-minor)
      await run("acceptSelectedSuggestion");
      await waitForText(doc, buildPrefix("issue", ["if-minor"], format));

      await run("workbench.action.revertAndCloseActiveEditor");
    });
  }

  it("keeps the label intact when typing to filter the decorations", async () => {
    await setDefaultFormat("plain");
    const doc = await vscode.workspace.openTextDocument({
      language: "markdown",
      content: "suggestion: foo",
    });
    const editor = await vscode.window.showTextDocument(doc);
    const end = doc.positionAt("suggestion: ".length);
    editor.selection = new vscode.Selection(end, end);

    await run("editor.action.triggerSuggest");
    await waitForWidget();
    await run("type", { text: "if" });
    await waitForWidget();
    await run("acceptSelectedSuggestion");
    await waitForText(doc, "suggestion (if-minor): foo");
    await run("workbench.action.revertAndCloseActiveEditor");
  });
});
