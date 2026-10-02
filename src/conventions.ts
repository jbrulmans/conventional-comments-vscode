// Conventional Comments (https://conventionalcomments.org/):
//
//   <label> [decorations]: <subject>
//
// Decorations are surrounded by parentheses and comma-separated, e.g.
// `suggestion (non-blocking,if-minor): ...`. Comments can optionally use a
// shields.io badge instead of the plain prefix.
// Kept free of `vscode` imports so it can be unit tested with plain Node.

export interface Convention {
  label: string;
  desc: string;
  color: string;
  /** Optional "expressive" label from the spec. */
  expressive?: boolean;
}

export const LABELS: Convention[] = [
  { label: "praise", desc: "Highlights something positive. Be sincere.", color: "#28A745" },
  { label: "nitpick", desc: "Trivial, preference-based request. Non-blocking by nature.", color: "#F59E0B" },
  { label: "suggestion", desc: "Proposes an improvement. Explain what and why.", color: "#3B82F6" },
  { label: "issue", desc: "Highlights a specific problem. Pair it with a suggestion if you can.", color: "#EF4444" },
  { label: "todo", desc: "Small, trivial but necessary change.", color: "#D946EF" },
  { label: "question", desc: "Asks for clarification when unsure whether something is a problem.", color: "#8B5CF6" },
  { label: "thought", desc: "An idea that came up while reviewing. Non-blocking.", color: "#6B7280" },
  { label: "chore", desc: "Simple task required before the change can be accepted.", color: "#F97316" },
  { label: "note", desc: "Highlights something the reader should notice. Non-blocking.", color: "#0EA5E9" },
  { label: "typo", desc: "Like todo, for a misspelling.", color: "#EAB308", expressive: true },
  { label: "polish", desc: "Like suggestion, when nothing is wrong but quality could improve.", color: "#06B6D4", expressive: true },
  { label: "quibble", desc: "Like nitpick, without the nit.", color: "#A3A3A3", expressive: true },
];

export const DECORATIONS: Convention[] = [
  { label: "non-blocking", desc: "Should not prevent the change from being accepted.", color: "#9CA3AF" },
  { label: "blocking", desc: "Should prevent the change from being accepted until resolved.", color: "#374151" },
  { label: "if-minor", desc: "Resolve only if the change is minor or trivial.", color: "#14B8A6" },
];

const LABEL_PATTERN = LABELS.map((l) => l.label).join("|");

export const PLAIN_CC_REGEX = new RegExp(
  `^\\s*(${LABEL_PATTERN})\\s*(?:\\(([^()\\n]*)\\))?:[ \\t]*`
);
export const BADGE_CC_REGEX = new RegExp(
  `^\\s*!\\[(${LABEL_PATTERN})\\s*(?:\\(([^()\\n]*)\\))?:?\\]\\(https://img\\.shields\\.io/badge/[^)\\s]*\\)[ \\t]*(?:\\r?\\n)?`
);

/** Matches a single decoration as offered for custom input. */
export const DECORATION_REGEX = /^[\w-]+$/;

function parseDecorations(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
}

// --- Badges ---

function hex(color: string): string {
  return color.substring(1);
}

function badgeColor(decorations: string[]): string {
  const standard = decorations
    .map((d) => DECORATIONS.find((s) => s.label === d))
    .filter((d): d is Convention => !!d);
  const color =
    standard.find((d) => d.label === "blocking")?.color ?? standard[0]?.color ?? "#6B7280";
  return hex(color);
}

export function createBadgeUrl(label: string, decorations: string[] = []): string {
  const labelColor = hex(LABELS.find((l) => l.label === label)?.color ?? "#6B7280");
  // shields.io static badges use `-` and `_` as separators; escape them by doubling.
  const encode = (str: string) =>
    encodeURIComponent(str.replace(/-/g, "--").replace(/_/g, "__"));

  if (decorations.length === 0) {
    return `https://img.shields.io/badge/${encode(label)}-${labelColor}`;
  }
  return `https://img.shields.io/badge/${encode(label)}-${encode(
    decorations.join(",")
  )}-${badgeColor(decorations)}?labelColor=${labelColor}`;
}

// --- Prefix parsing / building ---

export interface ParsedPrefix {
  label: string;
  decorations: string[];
  prettified: boolean;
  /** Length of the matched prefix, including trailing whitespace. */
  length: number;
}

export function parsePrefix(text: string): ParsedPrefix | undefined {
  const plain = text.match(PLAIN_CC_REGEX);
  if (plain) {
    return {
      label: plain[1],
      decorations: parseDecorations(plain[2]),
      prettified: false,
      length: plain[0].length,
    };
  }
  const badge = text.match(BADGE_CC_REGEX);
  if (badge) {
    return {
      label: badge[1],
      decorations: parseDecorations(badge[2]),
      prettified: true,
      length: badge[0].length,
    };
  }
  return undefined;
}

/** The canonical prefix without trailing whitespace, e.g. `suggestion (non-blocking):`. */
export function formatLabel(label: string, decorations: string[] = []): string {
  return `${label}${decorations.length ? ` (${decorations.join(",")})` : ""}:`;
}

export function buildPrefix(label: string, decorations: string[], prettified: boolean): string {
  if (prettified) {
    return `![${formatLabel(label, decorations)}](${createBadgeUrl(label, decorations)})\n`;
  }
  return `${formatLabel(label, decorations)} `;
}

/** Replace the text in [0, end) with `text`. */
export interface PrefixEdit {
  end: number;
  text: string;
}

/** Replaces any existing plain/badge prefix with the new one and keeps the subject. */
export function setPrefix(
  current: string,
  label: string,
  decorations: string[],
  prettified: boolean
): PrefixEdit {
  const existing = parsePrefix(current);
  let end = existing?.length ?? 0;
  if (prettified) {
    // Badge form puts the subject on its own line, trimmed.
    end += current.substring(end).length - current.substring(end).trimStart().length;
  }
  return { end, text: buildPrefix(label, decorations, prettified) };
}

export function removePrefix(current: string): PrefixEdit | undefined {
  const existing = parsePrefix(current);
  return existing ? { end: existing.length, text: "" } : undefined;
}

export function togglePrefixFormat(current: string): PrefixEdit | undefined {
  const existing = parsePrefix(current);
  if (!existing) {
    return undefined;
  }
  return setPrefix(current, existing.label, existing.decorations, !existing.prettified);
}

export function applyEdit(current: string, edit: PrefixEdit): string {
  return edit.text + current.substring(edit.end);
}

/** Where a cursor at `offset` ends up after applying `edit`. */
export function mapOffset(offset: number, edit: PrefixEdit): number {
  return offset >= edit.end ? offset - edit.end + edit.text.length : edit.text.length;
}
