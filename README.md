# Conventional Comments for PR Reviews

Label your pull request review comments in VS Code with [Conventional Comments](https://conventionalcomments.org/): `praise`, `nitpick`, `suggestion`, `todo`, `issue`, `question`, `thought`, `chore`, optionally decorated with `(non-blocking)`, `(blocking)` or `(if-minor)`.

This is a VS Code port of the [Conventional Comments browser extension by Pullpo](https://github.com/pullpo-io/conventional-comments). It works in the comment boxes of the [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) and [GitLab Workflow](https://marketplace.visualstudio.com/items?itemName=GitLab.gitlab-workflow) extensions, and in any other extension that uses VS Code's comments API.

<!-- TODO: add screenshot of the button row -->

## Install

1. Download the `.vsix` from the [latest release](https://github.com/jbrulmans/conventional-comments-vscode/releases/latest) and run `code --install-extension conventional-comments-vscode-<version>.vsix`.
2. To get the button row, enable the proposed API it relies on:
   1. Run **Preferences: Configure Runtime Arguments** from the Command Palette.
   2. Add this entry to `argv.json`:
      ```jsonc
      "enable-proposed-api": ["jbrulmans.conventional-comments-vscode"]
      ```
   3. Restart VS Code. A reload isn't enough.

Without step 2, everything except the buttons still works.

## Usage

### Buttons

The button row sits below the comment box and works like the browser toolbar:

1. Click a label (`praise`, `suggestion`, …) to add it to the start of your comment.
2. The row switches to `suggestion ›` followed by the decorations. Click a decoration to add it, and click it again (`✓ non-blocking`) to remove it.
3. Click `suggestion ›` to pick a different label. Clicking the current one (`✓ suggestion`) removes the label.
4. `badge` / `✓ badge` switches between the badge and plain text formats.

VS Code only lets extensions add buttons to the comment box's action row, not above it.

### Keyboard

- Type `/` at the start of a comment, or press <kbd>Cmd</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> on Windows/Linux), then pick a label. The decoration list opens right after.
- Put the cursor inside an existing label and press <kbd>Cmd</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> to change the decoration or label, remove the label, or toggle the format.

Command Palette: **Conventional Comments: Toggle Badge / Plain Format** and **Remove Label**.

## Formats

Plain text:

```
suggestion(non-blocking): extract this into a helper
```

Badge (the default, same as the browser extension), rendered as a colored shields.io badge on GitHub/GitLab:

```
[![suggestion(non-blocking)](https://img.shields.io/badge/suggestion-non--blocking-9CA3AF?labelColor=3B82F6)](https://pullpo.io/cc?l=suggestion&d=non-blocking)
extract this into a helper
```

Both formats are recognized when editing, including comments written with the browser extension.

## Settings

| Setting | Default | Description |
|---|---|---|
| `conventionalComments.prettify` | `true` | Insert badges instead of plain text. Existing labels keep their format. |
| `conventionalComments.showButtons` | `true` | Show the button row below comment boxes. |

## Not included

The browser extension's Slack-threads feature depends on Pullpo's PR-Channels service and isn't part of this port.

## Development

```sh
npm install
npm test                  # unit tests
npm run test:integration  # runs inside a VS Code instance
npm run compile           # type-check + bundle
npm run manifest          # regenerate button commands/menus in package.json
```

Press <kbd>F5</kbd> in VS Code to launch an Extension Development Host, where proposed API is enabled automatically. `npm run package` builds a `.vsix`.

Because the extension uses a proposed API, it's distributed through GitHub Releases rather than the Marketplace.

## Credits

Labels, colors, decorations and badge format come from [pullpo-io/conventional-comments](https://github.com/pullpo-io/conventional-comments) (MIT, © TOPUS SOFTWARE SL). The convention itself is defined at [conventionalcomments.org](https://conventionalcomments.org/).
