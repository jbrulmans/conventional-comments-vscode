import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  BADGE_CC_REGEX,
  applyEdit,
  buildPrefix,
  createBadgeMarkdown,
  mapOffset,
  parsePrefix,
  removePrefix,
  setPrefix,
  togglePrefixFormat,
} from "../conventions";

const set = (text: string, label: string, decoration?: string, prettified = false) =>
  applyEdit(text, setPrefix(text, label, decoration, prettified));

describe("createBadgeMarkdown", () => {
  it("builds a label-only badge", () => {
    assert.equal(
      createBadgeMarkdown("praise"),
      "[![praise](https://img.shields.io/badge/praise-28A745)](https://pullpo.io/cc?l=praise) "
    );
  });

  it("escapes dashes and uses the decoration color", () => {
    assert.equal(
      createBadgeMarkdown("suggestion", "non-blocking"),
      "[![suggestion(non-blocking)](https://img.shields.io/badge/suggestion-non--blocking-9CA3AF?labelColor=3B82F6)](https://pullpo.io/cc?l=suggestion&d=non-blocking) "
    );
  });

  it("matches BADGE_CC_REGEX", () => {
    const m = createBadgeMarkdown("issue", "blocking").match(BADGE_CC_REGEX);
    assert.deepEqual([m?.[1], m?.[2]], ["issue", "blocking"]);
  });
});

describe("parsePrefix", () => {
  it("returns undefined without a prefix", () => {
    assert.equal(parsePrefix("just a comment"), undefined);
  });

  it("parses plain prefixes", () => {
    assert.deepEqual(parsePrefix("nitpick(if-minor): rename this"), {
      label: "nitpick",
      decoration: "if-minor",
      prettified: false,
      length: "nitpick(if-minor): ".length,
    });
  });

  it("parses badge prefixes", () => {
    const parsed = parsePrefix(buildPrefix("todo", undefined, true) + "add tests");
    assert.equal(parsed?.label, "todo");
    assert.equal(parsed?.decoration, undefined);
    assert.equal(parsed?.prettified, true);
  });
});

describe("setPrefix", () => {
  it("adds a plain prefix", () => {
    assert.equal(set("use a map here", "suggestion"), "suggestion: use a map here");
  });

  it("replaces an existing prefix and keeps the subject", () => {
    assert.equal(
      set("suggestion(non-blocking): use a map here", "issue"),
      "issue: use a map here"
    );
  });

  it("adds a decoration", () => {
    assert.equal(
      set("suggestion: use a map here", "suggestion", "blocking"),
      "suggestion(blocking): use a map here"
    );
  });

  it("puts the subject on its own line in badge form", () => {
    assert.equal(
      set("question:   why?", "question", undefined, true),
      createBadgeMarkdown("question") + "\nwhy?"
    );
  });
});

describe("removePrefix", () => {
  it("removes plain and badge prefixes", () => {
    const plain = "chore: bump deps";
    assert.equal(applyEdit(plain, removePrefix(plain)!), "bump deps");
    const badge = buildPrefix("chore", "if-minor", true) + "bump deps";
    assert.equal(applyEdit(badge, removePrefix(badge)!), "bump deps");
  });

  it("does nothing without a prefix", () => {
    assert.equal(removePrefix("bump deps"), undefined);
  });
});

describe("togglePrefixFormat", () => {
  it("round-trips between plain and badge", () => {
    const plain = "thought(non-blocking): maybe later";
    const badge = applyEdit(plain, togglePrefixFormat(plain)!);
    assert.equal(badge, buildPrefix("thought", "non-blocking", true) + "maybe later");
    assert.equal(applyEdit(badge, togglePrefixFormat(badge)!), plain);
  });
});

describe("mapOffset", () => {
  it("shifts cursors after the prefix and clamps cursors inside it", () => {
    const edit = setPrefix("issue: abc", "suggestion", undefined, false);
    assert.equal(mapOffset("issue: ab".length, edit), "suggestion: ab".length);
    assert.equal(mapOffset(2, edit), "suggestion: ".length);
  });
});
