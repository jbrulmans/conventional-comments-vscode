// Pre-publish checks, run by the release workflow:
// - the pushed tag (if any) matches package.json's version
// - CHANGELOG.md has a section for that version (written to release-notes.md)
// - every relative image the README references exists (they're shown on the Marketplace)
// Usage: node scripts/check-release.mjs [tag]
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const errors = [];
const { version } = JSON.parse(readFileSync("package.json", "utf8"));

const tag = process.argv[2];
if (tag && tag !== `v${version}`) {
  errors.push(`Tag ${tag} doesn't match package.json version ${version} (expected v${version}).`);
}

const changelog = readFileSync("CHANGELOG.md", "utf8");
const section = changelog.match(new RegExp(`^## ${version.replace(/\./g, "\\.")}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m"));
if (section) {
  writeFileSync("release-notes.md", section[1].trim() + "\n");
} else {
  errors.push(`CHANGELOG.md has no "## ${version}" section.`);
}

const readme = readFileSync("README.md", "utf8");
for (const [, src] of readme.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) {
  if (!/^[a-z]+:/i.test(src) && !existsSync(src)) {
    errors.push(`README.md references missing image ${src}.`);
  }
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join("\n"));
  process.exit(1);
}
console.log(`✓ Ready to release ${version}`);
