import * as vscode from "vscode";
import {
  DECORATIONS,
  LABELS,
  PrefixEdit,
  mapOffset,
  parsePrefix,
  removePrefix,
  setPrefix,
  togglePrefixFormat,
} from "./conventions";

/** URI scheme VS Code uses for comment widget input boxes. */
export const COMMENT_SCHEME = "comment";

export const Commands = {
  insertLabel: "conventionalComments.insertLabel",
  toggleFormat: "conventionalComments.toggleFormat",
  removeLabel: "conventionalComments.removeLabel",
  applyPrefix: "conventionalComments.applyPrefix",
} as const;

// --- Target tracking ---
// Comment inputs are embedded editors that are not always exposed as
// `activeTextEditor`, so remember the comment document the user last touched.

let lastCommentDocument: vscode.TextDocument | undefined;

export function rememberCommentDocument(doc: vscode.TextDocument): void {
  if (doc.uri.scheme === COMMENT_SCHEME) {
    lastCommentDocument = doc;
  }
}

function trackCommentDocuments(): vscode.Disposable[] {
  return [
    vscode.workspace.onDidOpenTextDocument(rememberCommentDocument),
    vscode.workspace.onDidChangeTextDocument((e) =>
      rememberCommentDocument(e.document)
    ),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) rememberCommentDocument(editor.document);
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (doc === lastCommentDocument) lastCommentDocument = undefined;
    }),
  ];
}

function isCommentReply(arg: unknown): arg is vscode.CommentReply {
  return (
    typeof arg === "object" &&
    arg !== null &&
    "thread" in arg &&
    typeof (arg as vscode.CommentReply).text === "string"
  );
}

function findDocument(uri: string): vscode.TextDocument | undefined {
  return vscode.workspace.textDocuments.find((d) => d.uri.toString() === uri);
}

function resolveTarget(arg?: unknown): vscode.TextDocument | undefined {
  const isLive = (d?: vscode.TextDocument): d is vscode.TextDocument =>
    !!d && !d.isClosed && d.uri.scheme === COMMENT_SCHEME;

  if (typeof arg === "string") {
    return findDocument(arg);
  }
  if (isCommentReply(arg)) {
    // Invoked from the comment thread's action row: match the reply text.
    if (isLive(lastCommentDocument) && lastCommentDocument.getText() === arg.text) {
      return lastCommentDocument;
    }
    const match = vscode.workspace.textDocuments.find(
      (d) => isLive(d) && d.getText() === arg.text
    );
    if (match) return match;
  }
  const active = vscode.window.activeTextEditor?.document;
  if (isLive(active)) return active;
  return isLive(lastCommentDocument) ? lastCommentDocument : undefined;
}

function prettifyDefault(): boolean {
  return vscode.workspace
    .getConfiguration("conventionalComments")
    .get<boolean>("prettify", true);
}

async function applyPrefixEdit(
  doc: vscode.TextDocument,
  edit: PrefixEdit
): Promise<void> {
  const range = new vscode.Range(doc.positionAt(0), doc.positionAt(edit.end));
  const editor = [
    vscode.window.activeTextEditor,
    ...vscode.window.visibleTextEditors,
  ].find((e) => e?.document === doc);

  if (editor) {
    const anchor = mapOffset(doc.offsetAt(editor.selection.anchor), edit);
    const active = mapOffset(doc.offsetAt(editor.selection.active), edit);
    await editor.edit((b) => b.replace(range, edit.text));
    editor.selection = new vscode.Selection(
      doc.positionAt(anchor),
      doc.positionAt(active)
    );
    return;
  }

  const wsEdit = new vscode.WorkspaceEdit();
  wsEdit.replace(doc.uri, range, edit.text);
  await vscode.workspace.applyEdit(wsEdit);
}

function noTarget(): void {
  vscode.window.showInformationMessage(
    "Conventional Comments: focus a PR review comment box first."
  );
}

// --- Commands ---

/** Set label + decoration on a document, keeping its current format. */
async function applyPrefix(
  target: string | vscode.TextDocument | undefined,
  label: string,
  decoration?: string
): Promise<void> {
  const doc = typeof target === "string" ? findDocument(target) : target;
  if (!doc) return;
  const text = doc.getText();
  const prettified = parsePrefix(text)?.prettified ?? prettifyDefault();
  await applyPrefixEdit(doc, setPrefix(text, label, decoration, prettified));
}

async function insertLabel(arg?: unknown): Promise<void> {
  const doc = resolveTarget(arg);
  if (!doc) return noTarget();

  const current = parsePrefix(doc.getText());

  const labelPick = await vscode.window.showQuickPick(
    LABELS.map((l) => ({
      label: l.label === current?.label ? `$(check) ${l.label}` : l.label,
      description: l.desc,
      value: l.label,
    })),
    { title: "Conventional Comments: label", placeHolder: "Pick a label" }
  );
  if (!labelPick) return;

  // Keep the decoration only when the label stays the same, like the original.
  const currentDecoration =
    labelPick.value === current?.label ? current.decoration : undefined;
  const decorationPick = await vscode.window.showQuickPick(
    [
      {
        label: currentDecoration ? "none" : "$(check) none",
        description: "No decoration.",
        value: undefined as string | undefined,
      },
      ...DECORATIONS.map((d) => ({
        label: d.label === currentDecoration ? `$(check) ${d.label}` : d.label,
        description: d.desc,
        value: d.label as string | undefined,
      })),
    ],
    {
      title: `Conventional Comments: ${labelPick.value} › decoration`,
      placeHolder: "Pick a decoration (optional)",
    }
  );
  if (!decorationPick) return;

  await applyPrefix(doc, labelPick.value, decorationPick.value);
}

async function toggleFormat(arg?: unknown): Promise<void> {
  const doc = resolveTarget(arg);
  if (!doc) return noTarget();
  const edit = togglePrefixFormat(doc.getText());
  if (edit) await applyPrefixEdit(doc, edit);
}

async function removeLabel(arg?: unknown): Promise<void> {
  const doc = resolveTarget(arg);
  if (!doc) return noTarget();
  const edit = removePrefix(doc.getText());
  if (edit) await applyPrefixEdit(doc, edit);
}

export function registerCommands(): vscode.Disposable[] {
  return [
    ...trackCommentDocuments(),
    vscode.commands.registerCommand(Commands.insertLabel, insertLabel),
    vscode.commands.registerCommand(Commands.toggleFormat, toggleFormat),
    vscode.commands.registerCommand(Commands.removeLabel, removeLabel),
    vscode.commands.registerCommand(
      Commands.applyPrefix,
      (uri: string, label: string, decoration?: string) =>
        applyPrefix(uri, label, decoration)
    ),
  ];
}
