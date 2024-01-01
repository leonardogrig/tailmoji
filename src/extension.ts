import * as vscode from "vscode";
import { EMOJI_MAP } from "./emojiMap";

class TailwindDecorationProvider {
  private decorations: vscode.TextEditorDecorationType[] = [];
  private isEmojiEnabled = false;

  public toggleEmojiMode() {
    this.isEmojiEnabled = !this.isEmojiEnabled;
    vscode.window.showInformationMessage(
      `Tailmoji is now ${this.isEmojiEnabled ? "activated" : "deactivated"}.`
    );
    this.updateDecorations(vscode.window.activeTextEditor);
  }

  public updateDecorations(editor: vscode.TextEditor | undefined) {
    if (!editor) return;
    this.clearDecorations();
    if (!this.isEmojiEnabled) return;

    const decorations: vscode.DecorationOptions[] = [];
    const document = editor.document;
    const text = document.getText();
    const regex = /className="([^"]*)"/g;
    let match;

    while ((match = regex.exec(text))) {
      const classNames = match[1].split(/\s+/);
      const fullMatchStart = document.positionAt(match.index);
      const fullMatchEnd = document.positionAt(match.index + match[0].length);
      const fullRange = new vscode.Range(fullMatchStart, fullMatchEnd);

      const isCursorInside = this.isCursorInsideRange(editor, fullRange);

      if (isCursorInside) continue;

      let cumulativeLength = 0;
      for (const className of classNames) {
        const startPos = document.positionAt(
          match.index + match[0].indexOf(className) + cumulativeLength
        );
        const endPos = document.positionAt(
          match.index +
            match[0].indexOf(className) +
            className.length +
            cumulativeLength
        );
        const range = new vscode.Range(startPos, endPos);

        const emoji = EMOJI_MAP[className];
        if (emoji) {
          decorations.push({
            range,
            renderOptions: {
              before: {
                contentText: emoji,
                margin: "0 4px 0 0",
              },
            },
          });
        }
      }
    }

    const decorationType = vscode.window.createTextEditorDecorationType({
      textDecoration: "none; display: none;",
    });

    this.decorations.push(decorationType);
    editor.setDecorations(decorationType, decorations);
  }

  private isCursorInsideRange(
    editor: vscode.TextEditor,
    range: vscode.Range
  ): boolean {
    return editor.selections.some(
      (selection) =>
        range.contains(selection.start) || range.contains(selection.end)
    );
  }

  public clearDecorations() {
    this.decorations.forEach((decoration) => decoration.dispose());
    this.decorations = [];
  }
}

let decorationProvider: TailwindDecorationProvider;

export function activate(context: vscode.ExtensionContext) {
  decorationProvider = new TailwindDecorationProvider();

  let toggleCommand = vscode.commands.registerCommand(
    "tailmoji.toggleEmojis",
    () => {
      decorationProvider.toggleEmojiMode();
    }
  );

  let cursorChangeDisposable = vscode.window.onDidChangeTextEditorSelection(
    (event) => {
      if (event.textEditor === vscode.window.activeTextEditor) {
        decorationProvider.updateDecorations(vscode.window.activeTextEditor);
      }
    }
  );
  vscode.workspace.getConfiguration().update('tailwindCSS.colorDecorators', false, true);

  context.subscriptions.push(toggleCommand, cursorChangeDisposable);
}

export function deactivate() {
  if (decorationProvider) {
    decorationProvider.clearDecorations();
  }
}
