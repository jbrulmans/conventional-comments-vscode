import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/integration/**/*.test.js",
  launchArgs: [
    "--disable-extensions",
    "--enable-proposed-api",
    "jbrulmans.conventional-comments-vscode",
  ],
  mocha: { ui: "bdd", timeout: 20000 },
});
