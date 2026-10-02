import * as vscode from "vscode";
import { parsePrefix, removePrefix, setPrefix } from "./conventions";
import { isPrettified, setPrettified } from "./format";
import { pickConventionalComment } from "./picker";
import { applyPrefixEdit, getTargetDocument } from "./target";

export const Commands = {
  insertLabel: "conventionalComments.insertLabel",
  toggleFormat: "conventionalComments.toggleFormat",
  removeLabel: "conventionalComments.removeLabel",
  configureKeybinding: "conventionalComments.configureKeybinding",
  headerBadge: "conventionalComments.header.badge",
  headerPlain: "conventionalComments.header.plain",
} as const;

/** The comment box the user is in, or last typed in. */
function resolveDocument(): vscode.TextDocument | undefined {
  const doc = getTargetDocument();
  if (!doc) {
    vscode.window.showInformationMessage(
      "Conventional Comments: focus a PR review comment box first."
    );
  }
  return doc;
}

async function insertLabel(): Promise<void> {
  const doc = resolveDocument();
  if (!doc) return;
  const result = await pickConventionalComment(parsePrefix(doc.getText()));
  if (result?.kind === "remove") {
    await removeLabel();
  } else if (result) {
    const decorations = result.decoration ? [result.decoration] : [];
    await applyPrefixEdit(
      doc,
      setPrefix(doc.getText(), result.label, decorations, isPrettified(doc))
    );
  }
}

/** Switch the comment between badge and plain text, rewriting an existing label. */
async function toggleFormat(): Promise<void> {
  const doc = resolveDocument();
  if (!doc) return;
  const prettified = !isPrettified(doc);
  const current = parsePrefix(doc.getText());
  if (current) {
    await applyPrefixEdit(
      doc,
      setPrefix(doc.getText(), current.label, current.decorations, prettified)
    );
  }
  setPrettified(doc, prettified);
}

async function removeLabel(): Promise<void> {
  const doc = resolveDocument();
  if (!doc) return;
  const edit = removePrefix(doc.getText());
  if (edit) await applyPrefixEdit(doc, edit);
}

async function configureKeybinding(): Promise<void> {
  await vscode.commands.executeCommand("workbench.action.openGlobalKeybindings", Commands.insertLabel);
}

export function registerCommands(): vscode.Disposable[] {
  const register = vscode.commands.registerCommand;
  return [
    register(Commands.insertLabel, insertLabel),
    register(Commands.toggleFormat, () => toggleFormat()),
    register(Commands.removeLabel, () => removeLabel()),
    register(Commands.configureKeybinding, configureKeybinding),
    // Header buttons pass the comment thread, which can't be mapped to its input.
    register(Commands.headerBadge, () => toggleFormat()),
    register(Commands.headerPlain, () => toggleFormat()),
  ];
}
