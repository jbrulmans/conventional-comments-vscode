import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  BADGE_CC_REGEX,
  LABELS,
  applyEdit,
  buildPrefix,
  createBadgeUrl,
  formatLabel,
  mapOffset,
  parsePrefix,
  removePrefix,
  setPrefix,
  togglePrefixFormat,
} from "../conventions";

const set = (text: string, label: string, decorations: string[] = [], prettified = false) =>
  applyEdit(text, setPrefix(text, label, decorations, prettified));

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

describe("formatLabel", () => {
  it("follows `<label> [decorations]:`", () => {
    assert.equal(formatLabel("praise"), "praise:");
    assert.equal(formatLabel("suggestion", ["non-blocking"]), "suggestion (non-blocking):");
    assert.equal(formatLabel("issue", ["test", "if-minor"]), "issue (test,if-minor):");
  });
});

describe("badges", () => {
  it("builds a label-only badge", () => {
    assert.equal(
      buildPrefix("praise", [], true),
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

  it("is a plain image without a link, matching BADGE_CC_REGEX", () => {
    const badge = buildPrefix("issue", ["blocking"], true);
    assert.ok(badge.startsWith("![issue (blocking):]("));
    const m = badge.match(BADGE_CC_REGEX);
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
      prettified: false,
      length: "nitpick (if-minor): ".length,
    });
  });

  it("accepts several and custom decorations, with or without the space", () => {
    assert.deepEqual(parsePrefix("issue(ux, non-blocking): x")?.decorations, ["ux", "non-blocking"]);
    assert.deepEqual(parsePrefix("note: x")?.decorations, []);
  });

  it("parses badge prefixes", () => {
    const parsed = parsePrefix(buildPrefix("todo", ["security"], true) + "add tests");
    assert.equal(parsed?.label, "todo");
    assert.deepEqual(parsed?.decorations, ["security"]);
    assert.equal(parsed?.prettified, true);
  });
});

describe("setPrefix", () => {
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
      set("question:   why?", "question", [], true),
      buildPrefix("question", [], true) + "why?"
    );
  });
});

describe("removePrefix", () => {
  it("removes plain and badge prefixes", () => {
    const plain = "chore: bump deps";
    assert.equal(applyEdit(plain, removePrefix(plain)!), "bump deps");
    const badge = buildPrefix("chore", ["if-minor"], true) + "bump deps";
    assert.equal(applyEdit(badge, removePrefix(badge)!), "bump deps");
  });

  it("does nothing without a prefix", () => {
    assert.equal(removePrefix("bump deps"), undefined);
  });
});

describe("togglePrefixFormat", () => {
  it("round-trips between plain and badge", () => {
    const plain = "thought (non-blocking): maybe later";
    const badge = applyEdit(plain, togglePrefixFormat(plain)!);
    assert.equal(badge, buildPrefix("thought", ["non-blocking"], true) + "maybe later");
    assert.equal(applyEdit(badge, togglePrefixFormat(badge)!), plain);
  });
});

describe("mapOffset", () => {
  it("shifts cursors after the prefix and clamps cursors inside it", () => {
    const edit = setPrefix("issue: abc", "suggestion", [], false);
    assert.equal(mapOffset("issue: ab".length, edit), "suggestion: ab".length);
    assert.equal(mapOffset(2, edit), "suggestion: ".length);
  });
});
