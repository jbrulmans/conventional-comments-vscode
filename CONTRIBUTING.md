# Contributing

Thanks for helping out. Bug reports, ideas and pull requests are all welcome.

## Setup

```sh
git clone https://github.com/jbrulmans/conventional-comments-vscode.git
cd conventional-comments-vscode
npm install
```

Open the folder in VS Code and press <kbd>F5</kbd> to start an Extension Development Host with the extension loaded. To try it for real, install the [GitHub Pull Requests](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-pull-request-github) extension there and open a PR.

## Scripts

| Script | What it does |
|---|---|
| `npm run compile` | Type-checks (strict) and bundles `src/extension.ts` into `dist/` with esbuild. |
| `npm test` | Unit tests for the vscode-free modules, with Node's test runner. |
| `npm run test:integration` | Integration tests inside a downloaded VS Code (`@vscode/test-cli`). |
| `npm run package` | Builds a `.vsix`. |

## Project map

| File | Responsibility |
|---|---|
| `src/conventions.ts` | The spec: labels, decorations, parsing and building prefixes, badge URLs, prefix edits. Pure, no `vscode` import. |
| `src/pickerItems.ts` | Items for the label/decoration picker. Pure, no `vscode` import. |
| `src/picker.ts` | The two-step QuickPick (label, then decoration). |
| `src/completion.ts` | `/` suggestions in comment boxes. |
| `src/commands.ts` | Commands: insert label, toggle format, remove label, change shortcut. |
| `src/target.ts` | Tracks the comment box the user is in or was in last. |
| `src/format.ts` | Remembers each comment's badge/plain format and sets the `conventionalComments.format` context key. |
| `src/edits.ts` | Applies prefix edits to a comment box and keeps the cursor in place. |
| `src/extension.ts` | Activation: wires the modules together. |

Comment boxes are documents with the `comment:` URI scheme. VS Code exposes them to extensions like regular text editors while they're focused.

## Tests

- **Unit tests** (`src/test/*.test.ts`) cover the pure modules. New logic should live in a pure module where possible, so it can be tested there.
- **Integration tests** (`src/test/integration/`) run in a real VS Code. They open `comment:` documents, which VS Code itself provides, and drive the commands, suggestions and picker. `comment:` documents open read-only in a regular editor, so the tests that accept suggestions through the real suggest widget also register the provider for `untitled:` documents.
- Prefer waiting on observable state (`waitFor`, `waitForText` in `helpers.ts`) over fixed delays.

Please add or update tests with every change. Run both suites before opening a pull request. CI runs them on every push and pull request.

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and PR titles, e.g. `fix: keep the label when switching format`. Mark breaking changes with `!` (e.g. `feat!: …`).
- Keep commits small and focused.
- Add an entry to the top section of [CHANGELOG.md](CHANGELOG.md) for anything users will notice.

## Releasing (maintainers)

1. Bump `version` in `package.json` (run `npm install` to update the lockfile).
2. Add a `## <version>` section to `CHANGELOG.md`.
3. Commit, then tag and push:
   ```sh
   git tag v1.2.3
   git push && git push --tags
   ```
4. The [release workflow](.github/workflows/release.yml) then:
   - tests
   - checks the tag, changelog and README images
   - publishes to the VS Code Marketplace and Open VSX
   - creates a GitHub release with the `.vsix`

   It needs the repository secrets `VSCE_PAT` and `OVSX_PAT`. To check the pipeline without publishing, run it manually with **dry run** enabled.
