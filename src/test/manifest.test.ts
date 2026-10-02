import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

// Compiled to out/test, so the package root is two levels up.
const raw = readFileSync(join(__dirname, "..", "..", "package.json"), "utf8");
const pkg = JSON.parse(raw);
const { commands, menus, keybindings } = pkg.contributes;
const commandIds = new Set<string>(commands.map((c: { command: string }) => c.command));

describe("package.json", () => {
  it("uses no proposed API", () => {
    assert.equal(pkg.enabledApiProposals, undefined);
  });

  it("adds the + and format buttons to the comment thread header", () => {
    assert.deepEqual(
      menus["comments/commentThread/title"].map((m: { command: string }) => m.command),
      [
        "conventionalComments.insertLabel",
        "conventionalComments.header.badge",
        "conventionalComments.header.plain",
      ]
    );
  });

  it("only references contributed commands in menus", () => {
    for (const [menu, items] of Object.entries(menus)) {
      for (const item of items as { command?: string }[]) {
        if (item.command) assert.ok(commandIds.has(item.command), `${menu}: ${item.command}`);
      }
    }
  });

  it("binds a default, user-changeable shortcut inside comment boxes", () => {
    assert.deepEqual(keybindings, [
      {
        command: "conventionalComments.insertLabel",
        key: "ctrl+alt+c",
        mac: "cmd+alt+c",
        when: "commentEditorFocused",
      },
    ]);
    assert.ok(commandIds.has("conventionalComments.configureKeybinding"));
  });
});
