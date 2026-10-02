// Generates the comment editor button commands and menus in package.json from
// src/conventions.ts, mirroring the toolbar of the original browser extension.
// Run with `npm run manifest` (Node >= 22.18 for TypeScript type stripping).
import { readFileSync, writeFileSync } from "node:fs";
import { DECORATIONS, LABELS } from "../src/conventions.ts";

const pkgPath = new URL("../package.json", import.meta.url);
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

const base = "config.conventionalComments.showButtons";
const L = "conventionalComments.label";
const D = "conventionalComments.decoration";
const CL = "conventionalComments.changingLabel";
const P = "conventionalComments.prettified";

const buttons = [];
const add = (command, title, group, when) =>
  buttons.push({ command, title, group, when: `${base} && ${when}` });

LABELS.forEach(({ label }, i) => {
  // Labels: shown until one is picked, and again while changing it.
  add(`conventionalComments.button.label.${label}`, label, `1_label@${i}`, `(!${L} || ${CL} && ${L} != '${label}')`);
  add(`conventionalComments.button.labelSelected.${label}`, `✓ ${label}`, `1_label@${i}`, `${CL} && ${L} == '${label}'`);
  // Selected label: click to change it.
  add(`conventionalComments.button.changeLabel.${label}`, `${label} ›`, "1_label@99", `!${CL} && ${L} == '${label}'`);
});

DECORATIONS.forEach(({ label }, i) => {
  add(`conventionalComments.button.decoration.${label}`, label, `2_decoration@${i}`, `${L} && !${CL} && ${D} != '${label}'`);
  add(`conventionalComments.button.decorationSelected.${label}`, `✓ ${label}`, `2_decoration@${i}`, `${L} && !${CL} && ${D} == '${label}'`);
});

add("conventionalComments.button.format", "badge", "3_format", `!${P}`);
add("conventionalComments.button.formatSelected", "✓ badge", "3_format", P);

const paletteCommands = pkg.contributes.commands.filter(
  (c) => !c.command.startsWith("conventionalComments.button.")
);

pkg.contributes.commands = [
  ...paletteCommands,
  ...buttons.map(({ command, title }) => ({ command, title })),
];
pkg.contributes.menus = {
  "comments/comment/editorActions": buttons.map(({ command, group, when }) => ({ command, group, when })),
  commandPalette: buttons.map(({ command }) => ({ command, when: "false" })),
};

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Wrote ${buttons.length} button commands to package.json`);
