// Ported from pullpo-io/conventional-comments (src/content/badges.js, MIT).
// Kept free of `vscode` imports so it can be unit tested with plain Node.

export interface Convention {
  label: string;
  desc: string;
  color: string;
}

export const LABELS: Convention[] = [
  { label: "praise", desc: "Highlight something positive.", color: "#28A745" },
  {
    label: "nitpick",
    desc: "Minor, non-blocking issues (style, naming...).",
    color: "#F59E0B",
  },
  {
    label: "suggestion",
    desc: "Suggest specific improvements.",
    color: "#3B82F6",
  },
  {
    label: "todo",
    desc: "Mark something that needs to be done.",
    color: "#E879F9",
  },
  { label: "issue", desc: "Point out a blocking problem.", color: "#EF4444" },
  { label: "question", desc: "Ask for clarification.", color: "#8B5CF6" },
  { label: "thought", desc: "Share a reflection or idea.", color: "#6B7280" },
  { label: "chore", desc: "Request a minor, non-code task.", color: "#F97316" },
];

export const DECORATIONS: Convention[] = [
  {
    label: "non-blocking",
    desc: "Optional change, doesn't block merge.",
    color: "#9CA3AF",
  },
  {
    label: "blocking",
    desc: "Must be addressed before merge.",
    color: "#374151",
  },
  {
    label: "if-minor",
    desc: "Address if the effort is small.",
    color: "#14B8A6",
  },
];

export const PLAIN_CC_REGEX =
  /^\s*(?:(praise|nitpick|suggestion|issue|question|thought|chore|todo)\s*(?:\((non-blocking|blocking|if-minor)\))?:)\s*/;
export const BADGE_CC_REGEX =
  /^\s*\[\!\[(?:(praise|nitpick|suggestion|issue|question|thought|chore|todo)(?:\((non-blocking|blocking|if-minor)\))?)\]\(https?:\/\/img\.shields\.io\/badge\/.*?\)\]\(https?:\/\/pullpo\.io\/cc\?.*?\)\s*/;

// --- Badge Helpers ---

function getBadgeColor(type: string): string {
  const label = LABELS.find((l) => l.label === type);
  return label ? label.color.substring(1) : "6B7280";
}

export function createBadgeUrl(type: string, decoration?: string): string {
  const labelColor = getBadgeColor(type);
  const message = decoration || "";
  let decorationColor = "";

  if (decoration) {
    const decorObj = DECORATIONS.find((d) => d.label === decoration);
    if (decorObj) {
      decorationColor = decorObj.color.substring(1);
    }
  }

  const encode = (str: string) =>
    encodeURIComponent(str.replace(/-/g, "--").replace(/_/g, "__"));

  if (message) {
    if (decorationColor) {
      return `https://img.shields.io/badge/${encode(type)}-${encode(
        message
      )}-${decorationColor}?labelColor=${labelColor}`;
    }
    return `https://img.shields.io/badge/${encode(type)}-${encode(
      message
    )}-${labelColor}`;
  }
  return `https://img.shields.io/badge/${encode(type)}-${labelColor}`;
}

export function createBadgeMarkdown(type: string, decoration?: string): string {
  const badge = `![${type}${decoration ? `(${decoration})` : ""}](${createBadgeUrl(
    type,
    decoration
  )})`;
  const pullpoUrl = `https://pullpo.io/cc?l=${encodeURIComponent(type)}${
    decoration ? `&d=${encodeURIComponent(decoration)}` : ""
  }`;
  return `[${badge}](${pullpoUrl}) `;
}

// --- Prefix parsing / building ---

export interface ParsedPrefix {
  label: string;
  decoration?: string;
  prettified: boolean;
  /** Length of the matched prefix, including trailing whitespace. */
  length: number;
}

export function parsePrefix(text: string): ParsedPrefix | undefined {
  const plain = text.match(PLAIN_CC_REGEX);
  if (plain) {
    return {
      label: plain[1],
      decoration: plain[2],
      prettified: false,
      length: plain[0].length,
    };
  }
  const badge = text.match(BADGE_CC_REGEX);
  if (badge) {
    return {
      label: badge[1],
      decoration: badge[2],
      prettified: true,
      length: badge[0].length,
    };
  }
  return undefined;
}

export function buildPrefix(
  label: string,
  decoration: string | undefined,
  prettified: boolean
): string {
  if (prettified) {
    return createBadgeMarkdown(label, decoration) + "\n";
  }
  return `${label}${decoration ? `(${decoration})` : ""}: `;
}

/** Replace the text in [0, end) with `text`. */
export interface PrefixEdit {
  end: number;
  text: string;
}

/**
 * Mirrors `updateCommentPrefix` from the original: replaces any existing
 * plain/badge prefix with the new one and keeps the subject.
 */
export function setPrefix(
  current: string,
  label: string,
  decoration: string | undefined,
  prettified: boolean
): PrefixEdit {
  const existing = parsePrefix(current);
  let end = existing?.length ?? 0;
  if (prettified) {
    // Badge form puts the subject on its own line, trimmed.
    end += current.substring(end).length - current.substring(end).trimStart().length;
  }
  return { end, text: buildPrefix(label, decoration, prettified) };
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
  return setPrefix(current, existing.label, existing.decoration, !existing.prettified);
}

export function applyEdit(current: string, edit: PrefixEdit): string {
  return edit.text + current.substring(edit.end);
}

/** Where a cursor at `offset` ends up after applying `edit`. */
export function mapOffset(offset: number, edit: PrefixEdit): number {
  return offset >= edit.end ? offset - edit.end + edit.text.length : edit.text.length;
}
