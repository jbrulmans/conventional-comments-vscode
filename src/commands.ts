import * as vscode from "vscode";
import { parsePrefix, removePrefix, setPrefix } from "./conventions";
import { isPrettified, setPrettified } from "./format";
import { pickConventionalComment } from "./picker";
import { applyPrefixEdit, findDocument, getTargetDocument } from "./target";

export const Commands = {
  insertLabel: "conventionalComments.insertLabel",
  toggleFormat: "conventionalComments.toggleFormat",
  removeLabel: "conventionalComments.removeLabel",
  configureKeybinding: "conventionalComments.configureKeybinding",
  headerBadge: "conventionalComments.header.badge",
  headerPlain: "conventionalComments.header.plain",
  // Internal, used by completion items.
  applyPrefix: "conventionalComments.applyPrefix",
  setFormat: "conventionalComments.setFormat",
} as const;

function resolveDocument(uri?: unknown): vscode.TextDocument | undefined {
  // Header buttons pass a CommentThread and palette invocations pass nothing;
  // only completion items pass a document URI.
  const doc = typeof uri === "string" ? findDocument(uri) : getTargetDocument();
  if (!doc) {
    vscode.window.showInformationMessage(
      "Conventional Comments: focus a PR review comment box first."
    );
  }
  return doc;
}

/** Set label + decoration on a comment, keeping its format. */
async function applyPrefix(uri: unknown, label: string, decoration?: string): Promise<void> {
  const doc = resolveDocument(uri);
  if (!doc) return;
  const decorations = decoration ? [decoration] : [];
  await applyPrefixEdit(doc, setPrefix(doc.getText(), label, decorations, isPrettified(doc)));
}

async function insertLabel(): Promise<void> {
  const doc = resolveDocument();
  if (!doc) return;
  const result = await pickConventionalComment(parsePrefix(doc.getText()));
  if (result?.kind === "remove") {
    await removeLabel();
  } else if (result) {
    await applyPrefix(undefined, result.label, result.decoration);
  }
}

/** Use badge or plain text for the comment, rewriting an existing label. */
async function setFormat(prettified: boolean, uri?: unknown): Promise<void> {
  const doc = resolveDocument(uri);
  if (!doc) return;
  const current = parsePrefix(doc.getText());
  if (current && current.prettified !== prettified) {
    await applyPrefixEdit(
      doc,
      setPrefix(doc.getText(), current.label, current.decorations, prettified)
    );
  }
  setPrettified(doc, prettified);
}

async function toggleFormat(uri?: unknown): Promise<void> {
  const doc = resolveDocument(uri);
  if (doc) await setFormat(!isPrettified(doc), uri);
}

async function removeLabel(uri?: unknown): Promise<void> {
  const doc = resolveDocument(uri);
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
    register(Commands.toggleFormat, toggleFormat),
    register(Commands.removeLabel, removeLabel),
    register(Commands.configureKeybinding, configureKeybinding),
    // Header buttons pass the comment thread, which can't be mapped to its input.
    register(Commands.headerBadge, () => toggleFormat()),
    register(Commands.headerPlain, () => toggleFormat()),
    register(Commands.applyPrefix, applyPrefix),
    register(Commands.setFormat, (uri: string, prettified: boolean) => setFormat(prettified, uri)),
  ];
}
