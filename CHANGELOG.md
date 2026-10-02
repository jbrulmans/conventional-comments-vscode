# Changelog

## 0.2.0

- Button row in comment boxes that works like the browser toolbar (labels, then decorations, plus a badge toggle). Requires `enable-proposed-api` in `argv.json`.
- Type `/` at the start of a comment, or press Cmd/Ctrl+Alt+C, to open the label picker.
- Fix: inserting a label emptied and closed the comment box.
- Fix: edits to comment inputs could be silently dropped.
- Removed the QuickPick flow. It moved focus out of the comment box, which collapses empty replies.

## 0.1.0

- Label and decoration suggestions in PR review comment boxes.
- **Insert Label…**, **Toggle Badge / Plain Format** and **Remove Label** commands.
- Badge (shields.io) and plain text formats, compatible with the Pullpo browser extension.
