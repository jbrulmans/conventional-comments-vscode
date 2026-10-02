import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  BADGE_PREFIX_REGEX,
  Format,
  LABELS,
  applyToText,
  buildPrefix,
  createBadgeUrl,
  formatPrefix,
  mapOffset,
  parsePrefix,
  removalEdit,
  prefixEdit,
  otherFormat,
  reformatEdit,
} from "../conventions";

const set = (text: string, label: string, decorations: string[] = [], format: Format = "plain") =>
  applyToText(text, prefixEdit(text, label, decorations, format));

describe("labels", () => {
  it("has the spec's standard and expressive labels", () => {
    assert.deepEqual(
      LABELS.filter((l) => !l.expressive).map((l) => l.label),
      ["praise", "nitpick", "suggestion", "issue", "todo", "question", "thought", "chore", "note"]
    );
    assert.deepEqual(
      LABELS.filter((l) => l.expressive).map((l) => l.label),
      ["typo", "polish", "quibble"]
    );
  });
});

describe("formatPrefix", () => {
  it("follows `<label> [decorations]:`", () => {
    assert.equal(formatPrefix("praise"), "praise:");
    assert.equal(formatPrefix("suggestion", ["non-blocking"]), "suggestion (non-blocking):");
    assert.equal(formatPrefix("issue", ["test", "if-minor"]), "issue (test,if-minor):");
  });
});

describe("badges", () => {
  it("builds a label-only badge", () => {
    assert.equal(
      buildPrefix("praise", [], "badge"),
      "![praise:](https://img.shields.io/badge/praise-28A745)\n"
    );
  });

  it("escapes dashes and commas and uses the decoration color", () => {
    assert.equal(
      createBadgeUrl("suggestion", ["non-blocking", "if-minor"]),
      "https://img.shields.io/badge/suggestion-non--blocking%2Cif--minor-9CA3AF?labelColor=3B82F6"
    );
  });

  it("prefers the blocking color", () => {
    assert.match(createBadgeUrl("issue", ["if-minor", "blocking"]), /-374151\?labelColor=/);
  });

  it("uses gray for custom decorations", () => {
    assert.match(createBadgeUrl("issue", ["security"]), /security-6B7280\?labelColor=/);
  });

  it("is a plain image without a link, matching BADGE_PREFIX_REGEX", () => {
    const badge = buildPrefix("issue", ["blocking"], "badge");
    assert.ok(badge.startsWith("![issue (blocking):]("));
    const m = badge.match(BADGE_PREFIX_REGEX);
    assert.deepEqual([m?.[1], m?.[2]], ["issue", "blocking"]);
  });
});

describe("parsePrefix", () => {
  it("returns undefined without a prefix", () => {
    assert.equal(parsePrefix("just a comment"), undefined);
    assert.equal(parsePrefix("notes: not a label"), undefined);
  });

  it("parses the spec format", () => {
    assert.deepEqual(parsePrefix("nitpick (if-minor): rename this"), {
      label: "nitpick",
      decorations: ["if-minor"],
      format: "plain",
      end: "nitpick (if-minor): ".length,
    });
  });

  it("accepts several and custom decorations, with or without the space", () => {
    assert.deepEqual(parsePrefix("issue(ux, non-blocking): x")?.decorations, ["ux", "non-blocking"]);
    assert.deepEqual(parsePrefix("note: x")?.decorations, []);
  });

  it("parses badge prefixes", () => {
    const parsed = parsePrefix(buildPrefix("todo", ["security"], "badge") + "add tests");
    assert.equal(parsed?.label, "todo");
    assert.deepEqual(parsed?.decorations, ["security"]);
    assert.equal(parsed?.format, "badge");
  });
});

describe("prefixEdit", () => {
  it("adds a plain prefix", () => {
    assert.equal(set("use a map here", "suggestion"), "suggestion: use a map here");
  });

  it("replaces an existing prefix and keeps the subject", () => {
    assert.equal(set("suggestion (non-blocking): use a map", "issue"), "issue: use a map");
  });

  it("normalizes to the spec format", () => {
    assert.equal(
      set("suggestion(non-blocking): use a map", "suggestion", ["blocking"]),
      "suggestion (blocking): use a map"
    );
  });

  it("keeps the discussion on the following lines", () => {
    assert.equal(set("question: why?\n\ncontext", "thought"), "thought: why?\n\ncontext");
  });

  it("puts the subject on its own line in badge form", () => {
    assert.equal(
      set("question:   why?", "question", [], "badge"),
      buildPrefix("question", [], "badge") + "why?"
    );
  });
});

describe("removalEdit", () => {
  it("removes plain and badge prefixes", () => {
    const plain = "chore: bump deps";
    assert.equal(applyToText(plain, removalEdit(plain)!), "bump deps");
    const badge = buildPrefix("chore", ["if-minor"], "badge") + "bump deps";
    assert.equal(applyToText(badge, removalEdit(badge)!), "bump deps");
  });

  it("does nothing without a prefix", () => {
    assert.equal(removalEdit("bump deps"), undefined);
  });
});

describe("reformatEdit", () => {
  it("round-trips between plain and badge", () => {
    const plain = "thought (non-blocking): maybe later";
    const badge = applyToText(plain, reformatEdit(plain, "badge")!);
    assert.equal(badge, buildPrefix("thought", ["non-blocking"], "badge") + "maybe later");
    assert.equal(applyToText(badge, reformatEdit(badge, otherFormat("badge"))!), plain);
  });

  it("does nothing without a prefix", () => {
    assert.equal(reformatEdit("hello", "badge"), undefined);
  });
});

describe("mapOffset", () => {
  it("shifts cursors after the prefix and clamps cursors inside it", () => {
    const edit = prefixEdit("issue: abc", "suggestion", [], "plain");
    assert.equal(mapOffset("issue: ab".length, edit), "suggestion: ab".length);
    assert.equal(mapOffset(2, edit), "suggestion: ".length);
  });
});
