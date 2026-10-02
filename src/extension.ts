import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { registerCompletionProvider } from "./completion";
import { registerFormatState } from "./format";
import { trackCommentEditors } from "./target";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    ...trackCommentEditors(),
    ...registerFormatState(),
    ...registerCommands(),
    registerCompletionProvider()
  );
}

export function deactivate(): void {}
