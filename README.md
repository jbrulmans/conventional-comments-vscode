# Conventional Comments for PR Reviews

Label your pull request review comments in VS Code with [Conventional Comments](https://conventionalcomments.org/): `praise`, `nitpick`, `suggestion`, `todo`, `issue`, `question`, `thought`, `chore`, optionally decorated with `(non-blocking)`, `(blocking)` or `(if-minor)`.

This is a VS Code port of the [Conventional Comments browser extension by Pullpo](https://github.com/pullpo-io/conventional-comments). It works in the comment boxes of the [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) and [GitLab Workflow](https://marketplace.visualstudio.com/items?itemName=GitLab.gitlab-workflow) extensions, and in any other extension that uses VS Code's comments API.

<!-- TODO: add screenshot of the header menu -->

## Install

Download the `.vsix` from the [latest release](https://github.com/jbrulmans/conventional-comments-vscode/releases/latest) and run `code --install-extension conventional-comments-vscode-<version>.vsix`.

## Usage

### Header menu

Click the **tag icon** in the header of a comment thread (top right, next to the collapse button). The menu shows everything at a glance, with ✓ on what's currently selected:

- **Labels**, each with its description. Click one to add it at the start of your comment, or click the selected one (`✓`) to remove it.
- **Decorations**: `(non-blocking)`, `(blocking)`, `(if-minor)`. Click to toggle. They're greyed out until a label is set.
- **Badge / Plain text**: the format of the label.
- **Remove label**.

The menu acts on the comment box you last typed in.

### Typing

- Type `/` at the start of a comment, or press <kbd>Cmd</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> on Windows/Linux), then pick a label. The decoration list opens right after.
- Put the cursor inside an existing label and press <kbd>Cmd</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> to change the decoration or label, remove the label, or switch between badge and plain text.

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
| `conventionalComments.showHeaderMenu` | `true` | Show the tag menu in the header of comment threads. |

## Not included

The browser extension's Slack-threads feature depends on Pullpo's PR-Channels service and isn't part of this port.

## Development

```sh
npm install
npm test                  # unit tests
npm run test:integration  # runs inside a VS Code instance
npm run compile           # type-check + bundle
npm run manifest          # regenerate the header menu in package.json
```

Press <kbd>F5</kbd> in VS Code to launch an Extension Development Host. `npm run package` builds a `.vsix`.

## Credits

Labels, colors, decorations and badge format come from [pullpo-io/conventional-comments](https://github.com/pullpo-io/conventional-comments) (MIT, © TOPUS SOFTWARE SL). The convention itself is defined at [conventionalcomments.org](https://conventionalcomments.org/).
