import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { parsePrefix } from "../conventions";
import { customDecorationItem, decorationItems, labelItems } from "../pickerItems";

const values = <T>(items: { value?: T }[]) =>
  items.filter((i) => i.value !== undefined).map((i) => i.value);

describe("labelItems", () => {
  it("lists standard labels, then expressive ones after a separator", () => {
    const items = labelItems(undefined);
    const separator = items.findIndex((i) => i.label === "expressive");
    assert.deepEqual(
      items.slice(separator + 1).map((i) => i.label),
      ["typo", "polish", "quibble"]
    );
    assert.equal(items[0].label, "praise");
  });

  it("checks the current label and offers removal", () => {
    const items = labelItems(parsePrefix("issue (blocking): x"));
    const checked = items.filter((i) => i.checked);
    assert.deepEqual(values(checked), [{ label: "issue" }]);
    assert.equal(checked[0].label, "$(check) issue");
    const remove = items[items.length - 1];
    assert.equal(remove.value, "remove");
    assert.equal(remove.description, "issue (blocking):");
  });

  it("offers no removal without a label", () => {
    assert.ok(!values(labelItems(undefined)).includes("remove"));
  });
});

describe("decorationItems", () => {
  it("offers none and the standard decorations as full decoration lists", () => {
    assert.deepEqual(values(decorationItems([])), [[], ["non-blocking"], ["blocking"], ["if-minor"]]);
  });

  it("checks none when there is no decoration", () => {
    assert.deepEqual(values(decorationItems([]).filter((i) => i.checked)), [[]]);
  });

  it("checks the current decoration and keeps custom ones", () => {
    const items = decorationItems(["blocking", "security"]);
    assert.deepEqual(values(items.filter((i) => i.checked)), [["blocking"], ["security"]]);
  });

  it("builds a custom decoration item that always shows", () => {
    assert.deepEqual(customDecorationItem("security"), {
      label: "$(add) security",
      description: "Use as custom decoration.",
      alwaysShow: true,
      value: ["security"],
    });
  });
});
