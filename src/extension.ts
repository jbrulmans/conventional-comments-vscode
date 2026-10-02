import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { registerCompletionProvider } from "./completion";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(...registerCommands(), registerCompletionProvider());
}

export function deactivate(): void {}
