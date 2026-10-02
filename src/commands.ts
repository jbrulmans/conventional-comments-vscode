import * as vscode from "vscode";
import {
  DECORATIONS,
  LABELS,
  parsePrefix,
  removePrefix,
  setPrefix,
} from "./conventions";
import { applyPrefixEdit, findDocument, getTargetDocument } from "./target";
import { isPrettified, setChangingLabel, setPrettified } from "./toolbar";

export const Commands = {
  insertLabel: "conventionalComments.insertLabel",
  toggleFormat: "conventionalComments.toggleFormat",
  removeLabel: "conventionalComments.removeLabel",
  applyPrefix: "conventionalComments.applyPrefix",
} as const;

/** Command ids of the comment editor buttons; must match scripts/manifest.mjs. */
export const ButtonCommands = {
  label: (label: string) => `conventionalComments.button.label.${label}`,
  labelSelected: (label: string) => `conventionalComments.button.labelSelected.${label}`,
  changeLabel: (label: string) => `conventionalComments.button.changeLabel.${label}`,
  decoration: (decoration: string) => `conventionalComments.button.decoration.${decoration}`,
  decorationSelected: (decoration: string) =>
    `conventionalComments.button.decorationSelected.${decoration}`,
  format: "conventionalComments.button.format",
  formatSelected: "conventionalComments.button.formatSelected",
};

function resolveDocument(uri?: unknown): vscode.TextDocument | undefined {
  // Buttons pass a CommentReply and palette invocations pass nothing; only
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
  setChangingLabel(false);
  await applyPrefixEdit(doc, setPrefix(doc.getText(), label, decoration, isPrettified(doc)));
}

/** Label button: select it, or remove it when it is already selected. */
async function clickLabel(label: string): Promise<void> {
  const doc = resolveDocument();
  if (!doc) return;
  if (parsePrefix(doc.getText())?.label === label) {
    setChangingLabel(false);
    await removeLabel();
  } else {
    await applyPrefix(undefined, label);
  }
}

/** Decoration button: toggle it on the current label. */
async function clickDecoration(decoration: string): Promise<void> {
  const doc = resolveDocument();
  const current = doc && parsePrefix(doc.getText());
  if (!doc || !current) return;
  const next = current.decoration === decoration ? undefined : decoration;
  await applyPrefixEdit(doc, setPrefix(doc.getText(), current.label, next, current.prettified));
}

async function toggleFormat(uri?: unknown): Promise<void> {
  const doc = resolveDocument(uri);
  if (!doc) return;
  const prettified = !isPrettified(doc);
  const current = parsePrefix(doc.getText());
  if (current) {
    await applyPrefixEdit(
      doc,
      setPrefix(doc.getText(), current.label, current.decoration, prettified)
    );
  }
  setPrettified(doc, prettified);
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
    ...LABELS.flatMap(({ label }) => [
      register(ButtonCommands.label(label), () => clickLabel(label)),
      register(ButtonCommands.labelSelected(label), () => clickLabel(label)),
      register(ButtonCommands.changeLabel(label), () => setChangingLabel(true)),
    ]),
    ...DECORATIONS.flatMap(({ label }) => [
      register(ButtonCommands.decoration(label), () => clickDecoration(label)),
      register(ButtonCommands.decorationSelected(label), () => clickDecoration(label)),
    ]),
    register(ButtonCommands.format, () => toggleFormat()),
    register(ButtonCommands.formatSelected, () => toggleFormat()),
  ];
}
