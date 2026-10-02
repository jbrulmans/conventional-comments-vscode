# Conventional Comments for PR Reviews

Write pull request review comments in VS Code using [Conventional Comments](https://conventionalcomments.org/), as plain text or as colored badges.

```
<label> [decorations]: <subject>

[discussion]
```

It works in the comment boxes of the [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) and [GitLab Workflow](https://marketplace.visualstudio.com/items?itemName=GitLab.gitlab-workflow) extensions, and in any other extension that uses VS Code's comments API.

<!-- TODO: add screenshot of the header buttons and picker -->

## Install

Download the `.vsix` from the [latest release](https://github.com/jbrulmans/conventional-comments-vscode/releases/latest) and run `code --install-extension conventional-comments-vscode-<version>.vsix`.

## Usage

### Add a label

Click **+** in the header of a comment thread, or press <kbd>Cmd</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> (<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> on Windows/Linux) inside a comment box:

1. Pick a label. The current one is marked with a check, and **Remove label** is at the bottom.
2. Pick a decoration (`non-blocking`, `blocking`, `if-minor`) or `none`. To use a custom decoration such as `security`, type it and pick the **+ security** item.

The label goes at the start of the comment, replacing any existing one, e.g. `suggestion (non-blocking): `.

### Type `/`

Type `/` at the start of a comment to pick a label right in the box. The decoration list opens right after. With the cursor right after an existing label, press <kbd>Ctrl</kbd>+<kbd>Space</kbd> (if your OS doesn't use it) to change the decoration or label, remove the label, or switch the format.

### Badge or plain text

The second header button shows the comment's format: a tag icon for a badge, a text icon for plain text. Click it to switch. New labels use the `conventionalComments.defaultFormat` setting.

Plain text, exactly as in the spec:

```
suggestion (non-blocking): extract this into a helper
```

Badge, rendered as a colored shields.io image on GitHub/GitLab. Its alt text is the same plain prefix:

```
![suggestion (non-blocking):](https://img.shields.io/badge/suggestion-non--blocking-9CA3AF?labelColor=3B82F6)
extract this into a helper
```

### Change the shortcut

<kbd>Cmd</kbd>/<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> is only the default. To change it, run **Conventional Comments: Change Keyboard Shortcut**. It opens Keyboard Shortcuts filtered to the command, where you can record a new key or reset it. In `keybindings.json`:

```json
[
  { "key": "ctrl+shift+l", "command": "conventionalComments.insertLabel", "when": "commentEditorFocused" },
  { "key": "cmd+alt+c", "command": "-conventionalComments.insertLabel" }
]
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

The pickers set one decoration. Several comma-separated ones written by hand, like `(security,if-minor)`, are recognized and kept when switching format.

## Settings

| Setting | Default | Description |
|---|---|---|
| `conventionalComments.defaultFormat` | `badge` | How new labels are written: `badge` or `plain`. Existing labels keep their format. |
| `conventionalComments.showHeaderButtons` | `true` | Show the + and format buttons in comment thread headers. |

## Development

```sh
npm install
npm test                  # unit tests
npm run test:integration  # runs inside a VS Code instance
npm run compile           # type-check + bundle
```

Press <kbd>F5</kbd> in VS Code to launch an Extension Development Host. `npm run package` builds a `.vsix`.
