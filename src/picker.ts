import * as vscode from "vscode";
import { CUSTOM_DECORATION_REGEX, ParsedPrefix } from "./conventions";
import {
  LabelChoice,
  PickerItem,
  customDecorationItem,
  decorationItems,
  labelItems,
} from "./pickerItems";

export type PickResult =
  | { kind: "set"; label: string; decorations: string[] }
  | { kind: "remove" };

type Item<T> = PickerItem<T> & vscode.QuickPickItem;

/** Shows a configured quick pick; resolves with the accepted item's value, or undefined if dismissed. */
function awaitPick<T>(qp: vscode.QuickPick<Item<T>>): Promise<T | undefined> {
  return new Promise((resolve) => {
    let accepted = false;
    qp.onDidAccept(() => {
      const item = qp.selectedItems[0] ?? qp.activeItems[0];
      if (item?.value === undefined) return;
      accepted = true;
      resolve(item.value);
      qp.hide();
    });
    qp.onDidHide(() => {
      if (!accepted) resolve(undefined);
      qp.dispose();
    });
    qp.show();
  });
}

function pickLabel(current: ParsedPrefix | undefined): Promise<LabelChoice | undefined> {
  const qp = vscode.window.createQuickPick<Item<LabelChoice>>();
  qp.title = "Conventional Comment: label";
  qp.placeholder = "Pick a label";
  qp.matchOnDescription = true;
  qp.items = labelItems(current);
  const active = qp.items.find((i) => i.checked);
  if (active) qp.activeItems = [active];
  return awaitPick(qp);
}

function pickDecorations(label: string, current: string[]): Promise<string[] | undefined> {
  const qp = vscode.window.createQuickPick<Item<string[]>>();
  qp.title = `Conventional Comment: ${label} (…):`;
  qp.placeholder = "Pick a decoration, or type a custom one";
  const base = decorationItems(current);
  qp.items = base;
  const active = base.find((i) => i.checked);
  if (active) qp.activeItems = [active];

  qp.onDidChangeValue((value) => {
    const word = value.trim();
    const known = base.some((i) => i.value?.[0] === word);
    // Custom item goes last so typing part of a standard decoration still selects it first.
    qp.items =
      CUSTOM_DECORATION_REGEX.test(word) && !known ? [...base, customDecorationItem(word)] : base;
  });
  return awaitPick(qp);
}

/** Two-step picker: label, then (optional) decoration. */
export async function pickConventionalComment(
  current: ParsedPrefix | undefined
): Promise<PickResult | undefined> {
  const choice = await pickLabel(current);
  if (choice === undefined) return undefined;
  if (choice === "remove") return { kind: "remove" };

  const decorations = await pickDecorations(choice.label, current?.decorations ?? []);
  if (decorations === undefined) return undefined;
  return { kind: "set", label: choice.label, decorations };
}
