// Items for the label/decoration picker. Kept free of `vscode` imports (items
// are plain objects compatible with `QuickPickItem`) so they can be unit tested.
import { DECORATIONS, LABELS, ParsedPrefix, Term, formatPrefix } from "./conventions";

/** Mirrors `vscode.QuickPickItemKind.Separator`. */
const SEPARATOR_KIND = -1;

export interface PickerItem<T> {
  label: string;
  description?: string;
  kind?: number;
  alwaysShow?: boolean;
  /** The comment's current choice; shown with a check mark. */
  checked?: boolean;
  /** Missing for separators. */
  value?: T;
}

export type LabelChoice = { label: string } | "remove";

const separator = <T>(label: string): PickerItem<T> => ({ label, kind: SEPARATOR_KIND });

function choice<T>(label: string, description: string, value: T, checked: boolean): PickerItem<T> {
  return { label: checked ? `$(check) ${label}` : label, description, value, checked };
}

export function labelItems(current: ParsedPrefix | undefined): PickerItem<LabelChoice>[] {
  const toItem = (term: Term) =>
    choice<LabelChoice>(term.label, term.desc, { label: term.label }, term.label === current?.label);
  const items = [
    ...LABELS.filter((l) => !l.expressive).map(toItem),
    separator<LabelChoice>("expressive"),
    ...LABELS.filter((l) => l.expressive).map(toItem),
  ];
  if (current) {
    items.push(separator("current label"), {
      label: "$(trash) Remove label",
      description: formatPrefix(current.label, current.decorations),
      value: "remove",
    });
  }
  return items;
}

/** Each item's value is the full list of decorations to use; `[]` is "none". */
export function decorationItems(current: string[]): PickerItem<string[]>[] {
  const custom = current.filter((d) => !DECORATIONS.some((s) => s.label === d));
  return [
    choice<string[]>("none", "No decoration.", [], current.length === 0),
    ...DECORATIONS.map((d) => choice(d.label, d.desc, [d.label], current.includes(d.label))),
    ...custom.map((d) => choice(d, "Custom decoration.", [d], true)),
  ];
}

export function customDecorationItem(decoration: string): PickerItem<string[]> {
  return {
    label: `$(add) ${decoration}`,
    description: "Use as custom decoration.",
    alwaysShow: true,
    value: [decoration],
  };
}
