import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { registerCompletionProvider } from "./completion";
import { trackCommentEditors } from "./target";
import { registerToolbarState } from "./toolbar";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    ...trackCommentEditors(),
    ...registerToolbarState(),
    ...registerCommands(),
    registerCompletionProvider()
  );
}

export function deactivate(): void {}
