// Generates the comment thread header menu (commands, submenu and menu items)
// in package.json from src/conventions.ts. Checkmarks are separate command
// variants, because extensions can't set `toggled` on menu items.
// Run with `npm run manifest` (Node >= 22.18 for TypeScript type stripping).
import { readFileSync, writeFileSync } from "node:fs";
import { DECORATIONS, LABELS } from "../src/conventions.ts";

const pkgPath = new URL("../package.json", import.meta.url);
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

const MENU = "conventionalComments.menu";
const L = "conventionalComments.label";
const D = "conventionalComments.decoration";
const P = "conventionalComments.prettified";

const items = [];
const add = (command, title, group, when, enablement) =>
  items.push({ command, title, group, when, enablement });

LABELS.forEach(({ label, desc }, i) => {
  add(`conventionalComments.menu.label.${label}`, `${label} — ${desc}`, `1_label@${i}`, `${L} != '${label}'`);
  add(`conventionalComments.menu.labelSelected.${label}`, `✓ ${label} — ${desc}`, `1_label@${i}`, `${L} == '${label}'`);
});

DECORATIONS.forEach(({ label, desc }, i) => {
  add(`conventionalComments.menu.decoration.${label}`, `(${label}) — ${desc}`, `2_decoration@${i}`, `${D} != '${label}'`, L);
  add(`conventionalComments.menu.decorationSelected.${label}`, `✓ (${label}) — ${desc}`, `2_decoration@${i}`, `${D} == '${label}'`, L);
});

add("conventionalComments.menu.format.badge", "Badge", "3_format@0", `!${P}`);
add("conventionalComments.menu.format.badgeSelected", "✓ Badge", "3_format@0", P);
add("conventionalComments.menu.format.plain", "Plain text", "3_format@1", P);
add("conventionalComments.menu.format.plainSelected", "✓ Plain text", "3_format@1", `!${P}`);

add("conventionalComments.menu.remove", "Remove label", "4_remove", undefined, L);

const paletteCommands = pkg.contributes.commands.filter(
  (c) => !/^conventionalComments\.(menu|button)\./.test(c.command)
);

pkg.contributes.commands = [
  ...paletteCommands,
  ...items.map(({ command, title, enablement }) => ({ command, title, enablement })),
];
pkg.contributes.submenus = [{ id: MENU, label: "Conventional Comment", icon: "$(tag)" }];
pkg.contributes.menus = {
  "comments/commentThread/title": [
    { submenu: MENU, group: "navigation@0", when: "config.conventionalComments.showHeaderMenu" },
  ],
  [MENU]: items.map(({ command, group, when }) => ({ command, group, when })),
  commandPalette: items.map(({ command }) => ({ command, when: "false" })),
};

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Wrote ${items.length} menu commands to package.json`);
