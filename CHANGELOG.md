# Changelog

## 0.4.1

- Fix: a decoration (or other label, remove, format switch) picked from the suggestions sometimes did nothing, e.g. after picking a label with `/`. The suggestions now apply their edit directly, and it can be undone in one step.

## 0.4.0

- **Breaking:** labels follow conventionalcomments.org exactly. There's a space before the decorations (`suggestion (non-blocking):`), and badges are plain shields.io images without a link.
- New labels: `note`, and the expressive `typo`, `polish`, `quibble`.
- **+** button in the comment thread header and Cmd/Ctrl+Alt+C open a picker: label, then decoration (including custom ones).
- New **Change Keyboard Shortcut** command. The shortcut is a default you can rebind.
- The header tag button now only switches between badge and plain text, and its icon shows the current format.
- Picking a decoration replaces the current one, and changing the label keeps the decoration. Both are covered by tests for every decoration path.
- Setting `showHeaderMenu` is replaced by `showHeaderButtons`.

## 0.3.0

- Replaced the button row with a tag menu in the comment thread header. It lists labels with descriptions, decorations and the badge/plain format, with ✓ on the current selection.
- No longer uses proposed API, so the `argv.json` setup isn't needed anymore.
- The `/` suggestions now show an explicit "switch to plain text" / "switch to badge" item.
- Setting `conventionalComments.showButtons` is replaced by `conventionalComments.showHeaderMenu`.

## 0.2.1

- Fix: label and decoration suggestions now stay above other suggestions in the comment box, such as GitHub issues.

## 0.2.0

- Button row in comment boxes that works like the browser toolbar (labels, then decorations, plus a badge toggle). Requires `enable-proposed-api` in `argv.json`.
- Type `/` at the start of a comment, or press Cmd/Ctrl+Alt+C, to open the label picker.
- Fix: inserting a label emptied and closed the comment box.
- Fix: edits to comment inputs could be silently dropped.
- Removed the QuickPick flow. It moved focus out of the comment box, which collapses empty replies.

## 0.1.0

- Label and decoration suggestions in PR review comment boxes.
- **Insert Label…**, **Toggle Badge / Plain Format** and **Remove Label** commands.
- Badge (shields.io) and plain text formats.
