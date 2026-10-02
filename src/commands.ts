import * as vscode from "vscode";
import {
  PrefixEdit,
  otherFormat,
  parsePrefix,
  prefixEdit,
  reformatEdit,
  removalEdit,
} from "./conventions";
import { applyPrefixEdit } from "./edits";
import { formatOf, rememberFormat } from "./format";
import { pickConventionalComment } from "./picker";
import { getTargetDocument } from "./target";

export const Commands = {
  insertLabel: "conventionalComments.insertLabel",
  toggleFormat: "conventionalComments.toggleFormat",
  removeLabel: "conventionalComments.removeLabel",
  configureKeybinding: "conventionalComments.configureKeybinding",
  headerBadge: "conventionalComments.header.badge",
  headerPlain: "conventionalComments.header.plain",
} as const;

/** The comment box the user is in, or last typed in; tells the user when there is none. */
function requireTargetDocument(): vscode.TextDocument | undefined {
  const doc = getTargetDocument();
  if (!doc) {
    vscode.window.showInformationMessage(
      "Conventional Comments: focus a PR review comment box first."
    );
  }
  return doc;
}

type EditFor = (doc: vscode.TextDocument) => PrefixEdit | undefined | Promise<PrefixEdit | undefined>;

/** Computes an edit for the target comment and applies it. */
async function editTarget(editFor: EditFor): Promise<void> {
  const doc = requireTargetDocument();
  if (!doc) return;
  const edit = await editFor(doc);
  if (edit) await applyPrefixEdit(doc, edit);
}

function insertLabel(): Promise<void> {
  return editTarget(async (doc) => {
    const result = await pickConventionalComment(parsePrefix(doc.getText()));
    if (result?.kind === "remove") return removalEdit(doc.getText());
    if (result) return prefixEdit(doc.getText(), result.label, result.decorations, formatOf(doc));
    return undefined;
  });
}

/** Switches the comment between badge and plain text, rewriting an existing label. */
function toggleFormat(): Promise<void> {
  return editTarget((doc) => {
    const format = otherFormat(formatOf(doc));
    rememberFormat(doc, format);
    return reformatEdit(doc.getText(), format);
  });
}

function removeLabel(): Promise<void> {
  return editTarget((doc) => removalEdit(doc.getText()));
}

async function configureKeybinding(): Promise<void> {
  await vscode.commands.executeCommand(
    "workbench.action.openGlobalKeybindings",
    Commands.insertLabel
  );
}

export function registerCommands(): vscode.Disposable[] {
  // Arguments are ignored: header buttons pass the comment thread, which can't
  // be mapped to its input box, so every command acts on the target comment.
  const register = (id: string, handler: () => Promise<void>) =>
    vscode.commands.registerCommand(id, () => handler());
  return [
    register(Commands.insertLabel, insertLabel),
    register(Commands.toggleFormat, toggleFormat),
    register(Commands.removeLabel, removeLabel),
    register(Commands.configureKeybinding, configureKeybinding),
    register(Commands.headerBadge, toggleFormat),
    register(Commands.headerPlain, toggleFormat),
  ];
}
