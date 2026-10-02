# Conventional Comments for PR Reviews

Label your pull request review comments in VS Code with [Conventional Comments](https://conventionalcomments.org/), such as `praise:`, `nitpick:` and `issue (blocking):`, as plain text or as colored badges.

[![CI](https://github.com/jbrulmans/conventional-comments-vscode/actions/workflows/ci.yml/badge.svg)](https://github.com/jbrulmans/conventional-comments-vscode/actions/workflows/ci.yml)

Conventional Comments make review feedback easier to read. Everyone sees at a glance whether a comment is praise, a question or a blocking issue. This extension adds the labels to the comment boxes of the [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) and [GitLab Workflow](https://marketplace.visualstudio.com/items?itemName=GitLab.gitlab-workflow) extensions, and to any other extension that uses VS Code's comments API.

## Features

- **Picker:** pick a label and a decoration with the **+** button in the comment thread header, or <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd>.
- **`/` suggestions:** type `/` at the start of a comment to pick a label without leaving the keyboard.
- **Badge or plain text:** colored shields.io badges on GitHub/GitLab, or the plain spec prefix. Switch with one click.
- **Spec-exact:** all labels from [conventionalcomments.org](https://conventionalcomments.org/), including the expressive ones, in the exact `label (decoration): subject` format.
- **Custom decorations:** next to `non-blocking`, `blocking` and `if-minor`, type your own, e.g. `security`.

## Usage

### Type `/`

![Picking a label and decoration with /](https://raw.githubusercontent.com/jbrulmans/conventional-comments-vscode/main/images/demo-slash.gif)

Type `/` at the start of a comment and pick a label. The decorations open right after. Later, with the cursor right after the label, press <kbd>Ctrl</kbd>+<kbd>Space</kbd> to change the decoration or label, remove it, or switch the format.

### Add a label

![Adding a label with the + button](https://raw.githubusercontent.com/jbrulmans/conventional-comments-vscode/main/images/demo-picker.gif)

Click **+** in the header of a comment thread, or press <kbd>Cmd</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> on Windows/Linux) inside a comment box.

1. Pick a label. The current one has a check mark, and **Remove label** is at the bottom.
2. Pick a decoration, or `none`. For a custom decoration, type it and pick the **+ security** item.

The label goes at the start of the comment, replacing any existing one: `suggestion (non-blocking): `.

### Badge or plain text

![Switching between badge and plain text](https://raw.githubusercontent.com/jbrulmans/conventional-comments-vscode/main/images/demo-format.gif)

The second header button shows the comment's format: a tag icon for a badge, a text icon for plain text. Click it to switch. New labels use the `conventionalComments.defaultFormat` setting.

Plain text, exactly as in the spec:

```
suggestion (non-blocking): extract this into a helper
```

Badge, a colored image on GitHub/GitLab whose alt text is the plain prefix:

```
![suggestion (non-blocking):](https://img.shields.io/badge/suggestion-non--blocking-9CA3AF?labelColor=3B82F6)
extract this into a helper
```

## Labels and decorations

From [conventionalcomments.org](https://conventionalcomments.org/):

| Label | Use for |
|---|---|
| `praise` | Highlights something positive. |
| `nitpick` | Trivial, preference-based request. Non-blocking by nature. |
| `suggestion` | Proposes an improvement. Explain what and why. |
| `issue` | Highlights a specific problem. |
| `todo` | Small, trivial but necessary change. |
| `question` | Asks for clarification when unsure whether something is a problem. |
| `thought` | An idea that came up while reviewing. |
| `chore` | Simple task required before the change can be accepted. |
| `note` | Highlights something the reader should notice. |
| `typo`, `polish`, `quibble` | Optional expressive labels. |

| Decoration | Meaning |
|---|---|
| `(non-blocking)` | Should not prevent the change from being accepted. |
| `(blocking)` | Should prevent the change from being accepted until resolved. |
| `(if-minor)` | Resolve only if the change is minor or trivial. |

The pickers set one decoration. Several comma-separated ones written by hand, like `(security,if-minor)`, are recognized and kept.

## Keyboard shortcut

<kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> opens the picker while a comment box is focused. It's only a default: run **Conventional Comments: Change Keyboard Shortcut** to record another key, or add this to `keybindings.json`:

```json
[
  { "key": "ctrl+shift+l", "command": "conventionalComments.insertLabel", "when": "commentEditorFocused" },
  { "key": "cmd+alt+c", "command": "-conventionalComments.insertLabel" }
]
```

## Settings

| Setting | Default | Description |
|---|---|---|
| `conventionalComments.defaultFormat` | `badge` | How new labels are written: `badge` or `plain`. Existing labels keep their format. |
| `conventionalComments.showHeaderButtons` | `true` | Show the + and format buttons in comment thread headers. |

## Requirements

An extension that provides pull request comment threads in VS Code, such as [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) or [GitLab Workflow](https://marketplace.visualstudio.com/items?itemName=GitLab.gitlab-workflow).

## Known limitations

- **Which box the header buttons edit:** VS Code doesn't tell extensions which comment box belongs to which thread, so the buttons act on the box you last typed in. With several threads open, click into the box first.
- **Ctrl+Space on macOS:** it often switches the input source instead. Use `/` or <kbd>Cmd</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd>.
- **Badges in VS Code:** they render on GitHub and GitLab. VS Code's own comment view may show the image markdown instead.

## Install

- **VS Code:** install from the [Marketplace](https://marketplace.visualstudio.com/items?itemName=jbrulmans.conventional-comments-vscode), or run `ext install jbrulmans.conventional-comments-vscode` in Quick Open (<kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>P</kbd>).
- **Cursor, Windsurf, VSCodium:** install from [Open VSX](https://open-vsx.org/extension/jbrulmans/conventional-comments-vscode).

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, tests and the release process.

## Release notes

See [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
