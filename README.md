# Conventional Comments for PR Reviews

Label your pull request review comments in VS Code with [Conventional Comments](https://conventionalcomments.org/): `praise`, `nitpick`, `suggestion`, `todo`, `issue`, `question`, `thought`, `chore`, optionally decorated with `(non-blocking)`, `(blocking)` or `(if-minor)`.

This is a VS Code port of the [Conventional Comments browser extension by Pullpo](https://github.com/pullpo-io/conventional-comments). It works in the comment boxes of the [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) and [GitLab Workflow](https://marketplace.visualstudio.com/items?itemName=GitLab.gitlab-workflow) extensions, and in any other extension that uses VS Code's comments API.

<!-- TODO: add demo GIF -->

## Usage

VS Code doesn't let extensions add a toolbar to comment boxes, so the original toolbar is replaced by suggestions and a command.

### Suggestions (the toolbar replacement)

1. Start a review comment on a PR.
2. At the start of the comment, press <kbd>Ctrl</kbd>+<kbd>Space</kbd> (or just start typing a label) and pick a label.
3. The decoration list opens automatically. Pick `(non-blocking)`, `(blocking)` or `(if-minor)`, or press <kbd>Esc</kbd> to skip.
4. Write your comment.

Press <kbd>Ctrl</kbd>+<kbd>Space</kbd> again with the cursor inside an existing label to:

- add, change or remove the decoration (picking the current decoration removes it),
- switch to another label (this keeps your comment text),
- remove the label,
- toggle between badge and plain text format.

### Command

**Conventional Comments: Insert Label…** (<kbd>Cmd</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> / <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>C</kbd> while a comment box is focused) walks you through picking a label and a decoration. It's also shown as a button next to the comment actions in GitHub/GitLab review threads.

Other commands: **Toggle Badge / Plain Format** and **Remove Label**.

## Formats

Plain text:

```
suggestion(non-blocking): extract this into a helper
```

Badge (default, same as the browser extension), rendered as a colored shields.io badge on GitHub/GitLab:

```
[![suggestion(non-blocking)](https://img.shields.io/badge/suggestion-non--blocking-9CA3AF?labelColor=3B82F6)](https://pullpo.io/cc?l=suggestion&d=non-blocking)
extract this into a helper
```

Both formats are recognized when editing, including comments written with the browser extension.

## Settings

| Setting | Default | Description |
|---|---|---|
| `conventionalComments.prettify` | `true` | Insert badges instead of plain text. Existing labels keep their format. |
| `conventionalComments.showCommentButton` | `true` | Show the **Insert Label…** button in review threads. |

## Not included

The browser extension's Slack-threads feature depends on Pullpo's PR-Channels service and isn't part of this port.

## Development

```sh
npm install
npm test          # unit tests
npm run compile   # type-check + bundle
```

Press <kbd>F5</kbd> in VS Code to launch an Extension Development Host. `npm run package` builds a `.vsix`.

## Credits

Labels, colors, decorations and badge format come from [pullpo-io/conventional-comments](https://github.com/pullpo-io/conventional-comments) (MIT, © TOPUS SOFTWARE SL). The convention itself is defined at [conventionalcomments.org](https://conventionalcomments.org/).
