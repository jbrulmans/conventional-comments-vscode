import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { DECORATIONS, LABELS } from "../conventions";

// Compiled to out/test, so the package root is two levels up.
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "..", "package.json"), "utf8"));
const { commands, menus, submenus } = pkg.contributes;
const commandIds = new Set<string>(commands.map((c: { command: string }) => c.command));

describe("package.json", () => {
  it("uses no proposed API", () => {
    assert.equal(pkg.enabledApiProposals, undefined);
  });

  it("adds the submenu to the comment thread header", () => {
    assert.deepEqual(
      menus["comments/commentThread/title"].map((m: { submenu?: string }) => m.submenu),
      ["conventionalComments.menu"]
    );
    assert.ok(submenus.some((s: { id: string }) => s.id === "conventionalComments.menu"));
  });

  it("only references contributed commands in menus", () => {
    for (const [menu, items] of Object.entries(menus)) {
      for (const item of items as { command?: string }[]) {
        if (item.command) assert.ok(commandIds.has(item.command), `${menu}: ${item.command}`);
      }
    }
  });

  it("lists every label and decoration in the header menu", () => {
    const menuCommands = menus["conventionalComments.menu"].map((m: { command: string }) => m.command);
    for (const { label } of LABELS) {
      assert.ok(menuCommands.includes(`conventionalComments.menu.label.${label}`), label);
    }
    for (const { label } of DECORATIONS) {
      assert.ok(menuCommands.includes(`conventionalComments.menu.decoration.${label}`), label);
    }
  });
});
