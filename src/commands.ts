import * as vscode from "vscode";
import {
  DECORATIONS,
  LABELS,
  parsePrefix,
  removePrefix,
  setPrefix,
} from "./conventions";
import { applyPrefixEdit, findDocument, getTargetDocument } from "./target";
import { isPrettified, setPrettified } from "./toolbar";

export const Commands = {
  insertLabel: "conventionalComments.insertLabel",
  toggleFormat: "conventionalComments.toggleFormat",
  removeLabel: "conventionalComments.removeLabel",
  applyPrefix: "conventionalComments.applyPrefix",
  setFormat: "conventionalComments.setFormat",
} as const;

/** Command ids of the header menu items; must match scripts/manifest.mjs. */
export const MenuCommands = {
  label: (label: string) => `conventionalComments.menu.label.${label}`,
  labelSelected: (label: string) => `conventionalComments.menu.labelSelected.${label}`,
  decoration: (decoration: string) => `conventionalComments.menu.decoration.${decoration}`,
  decorationSelected: (decoration: string) =>
    `conventionalComments.menu.decorationSelected.${decoration}`,
  badge: "conventionalComments.menu.format.badge",
  badgeSelected: "conventionalComments.menu.format.badgeSelected",
  plain: "conventionalComments.menu.format.plain",
  plainSelected: "conventionalComments.menu.format.plainSelected",
  remove: "conventionalComments.menu.remove",
};

function resolveDocument(uri?: unknown): vscode.TextDocument | undefined {
  // Menu items pass a CommentThread and palette invocations pass nothing; only
  // completion items pass a document URI.
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
  await applyPrefixEdit(doc, setPrefix(doc.getText(), label, decoration, isPrettified(doc)));
}

/** Label menu item: select it, or remove it when it is already selected. */
async function clickLabel(label: string): Promise<void> {
  const doc = resolveDocument();
  if (!doc) return;
  if (parsePrefix(doc.getText())?.label === label) {
    await removeLabel();
  } else {
    await applyPrefix(undefined, label);
  }
}

/** Decoration menu item: toggle it on the current label. */
async function clickDecoration(decoration: string): Promise<void> {
  const doc = resolveDocument();
  const current = doc && parsePrefix(doc.getText());
  if (!doc || !current) return;
  const next = current.decoration === decoration ? undefined : decoration;
  await applyPrefixEdit(doc, setPrefix(doc.getText(), current.label, next, current.prettified));
}

/** Use badge or plain text for the comment, rewriting an existing label. */
async function setFormat(prettified: boolean, uri?: unknown): Promise<void> {
  const doc = resolveDocument(uri);
  if (!doc) return;
  const current = parsePrefix(doc.getText());
  if (current && current.prettified !== prettified) {
    await applyPrefixEdit(
      doc,
      setPrefix(doc.getText(), current.label, current.decoration, prettified)
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

/** Opens the inline label/decoration suggestions; keeps focus in the comment box. */
async function insertLabel(): Promise<void> {
  if (resolveDocument()) {
    await vscode.commands.executeCommand("editor.action.triggerSuggest");
  }
}

export function registerCommands(): vscode.Disposable[] {
  const register = vscode.commands.registerCommand;
  return [
    register(Commands.insertLabel, insertLabel),
    register(Commands.toggleFormat, toggleFormat),
    register(Commands.removeLabel, removeLabel),
    register(Commands.applyPrefix, applyPrefix),
    register(Commands.setFormat, (uri: string, prettified: boolean) => setFormat(prettified, uri)),
    ...LABELS.flatMap(({ label }) => [
      register(MenuCommands.label(label), () => clickLabel(label)),
      register(MenuCommands.labelSelected(label), () => clickLabel(label)),
    ]),
    ...DECORATIONS.flatMap(({ label }) => [
      register(MenuCommands.decoration(label), () => clickDecoration(label)),
      register(MenuCommands.decorationSelected(label), () => clickDecoration(label)),
    ]),
    register(MenuCommands.badge, () => setFormat(true)),
    register(MenuCommands.badgeSelected, () => setFormat(true)),
    register(MenuCommands.plain, () => setFormat(false)),
    register(MenuCommands.plainSelected, () => setFormat(false)),
    register(MenuCommands.remove, () => removeLabel()),
  ];
}
