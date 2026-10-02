import * as vscode from "vscode";
import { DECORATIONS, DECORATION_REGEX, LABELS, ParsedPrefix, formatLabel } from "./conventions";

export type PickResult =
  | { kind: "set"; label: string; decoration?: string }
  | { kind: "remove" };

interface Item<T> extends vscode.QuickPickItem {
  value?: T;
}

const separator = <T>(label: string): Item<T> => ({
  label,
  kind: vscode.QuickPickItemKind.Separator,
});

const check = (selected: boolean, label: string) => (selected ? `$(check) ${label}` : label);

/** Shows a configured quick pick; resolves with the accepted item's value, or undefined. */
function show<T>(qp: vscode.QuickPick<Item<T>>): Promise<T | undefined> {
  return new Promise((resolve) => {
    let accepted = false;
    qp.onDidAccept(() => {
      const item = qp.selectedItems[0] ?? qp.activeItems[0];
      if (!item || item.value === undefined) return;
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

type LabelValue = { label: string } | "remove";

export function labelItems(current: ParsedPrefix | undefined): Item<LabelValue>[] {
  const toItem = (l: (typeof LABELS)[number]): Item<LabelValue> => ({
    label: check(l.label === current?.label, l.label),
    description: l.desc,
    value: { label: l.label },
  });
  const items = [
    ...LABELS.filter((l) => !l.expressive).map(toItem),
    separator<LabelValue>("expressive"),
    ...LABELS.filter((l) => l.expressive).map(toItem),
  ];
  if (current) {
    items.push(separator("current label"), {
      label: "$(trash) Remove label",
      description: formatLabel(current.label, current.decorations),
      value: "remove",
    });
  }
  return items;
}

/** `null` stands for "no decoration". */
export function decorationItems(current: string[]): Item<string | null>[] {
  const custom = current.filter((d) => !DECORATIONS.some((s) => s.label === d));
  return [
    { label: check(current.length === 0, "none"), description: "No decoration.", value: null },
    ...DECORATIONS.map((d) => ({
      label: check(current.includes(d.label), d.label),
      description: d.desc,
      value: d.label,
    })),
    ...custom.map((d) => ({ label: check(true, d), description: "Custom decoration.", value: d })),
  ];
}

function customDecorationItem(value: string): Item<string | null> {
  return {
    label: `$(add) ${value}`,
    description: "Use as custom decoration.",
    alwaysShow: true,
    value,
  };
}

async function pickLabel(current: ParsedPrefix | undefined): Promise<LabelValue | undefined> {
  const qp = vscode.window.createQuickPick<Item<LabelValue>>();
  qp.title = "Conventional Comment: label";
  qp.placeholder = "Pick a label";
  qp.matchOnDescription = true;
  qp.items = labelItems(current);
  const active = qp.items.find(
    (i) => typeof i.value === "object" && i.value.label === current?.label
  );
  if (active) qp.activeItems = [active];
  return show(qp);
}

async function pickDecoration(
  label: string,
  current: string[]
): Promise<string | null | undefined> {
  const qp = vscode.window.createQuickPick<Item<string | null>>();
  qp.title = `Conventional Comment: ${label} (…):`;
  qp.placeholder = "Pick a decoration, or type a custom one";
  const base = decorationItems(current);
  qp.items = base;
  const active = base.find((i) => (i.value === null ? current.length === 0 : current.includes(i.value!)));
  if (active) qp.activeItems = [active];

  qp.onDidChangeValue((value) => {
    const word = value.trim();
    const known = base.some((i) => i.value === word);
    // Custom item goes last so typing part of a standard decoration still selects it first.
    qp.items = DECORATION_REGEX.test(word) && !known ? [...base, customDecorationItem(word)] : base;
  });
  return show(qp);
}

/** Two-step picker: label, then (optional) decoration. */
export async function pickConventionalComment(
  current: ParsedPrefix | undefined
): Promise<PickResult | undefined> {
  const label = await pickLabel(current);
  if (label === undefined) return undefined;
  if (label === "remove") return { kind: "remove" };

  const decoration = await pickDecoration(label.label, current?.decorations ?? []);
  if (decoration === undefined) return undefined;
  return { kind: "set", label: label.label, decoration: decoration ?? undefined };
}
