"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const emojiMap_1 = require("./emojiMap");
class TailwindDecorationProvider {
    decorations = [];
    isEmojiEnabled = false;
    toggleEmojiMode() {
        this.isEmojiEnabled = !this.isEmojiEnabled;
        vscode.window.showInformationMessage(`Tailmoji is now ${this.isEmojiEnabled ? "activated" : "deactivated"}.`);
        this.updateDecorations(vscode.window.activeTextEditor);
    }
    updateDecorations(editor) {
        if (!editor)
            return;
        this.clearDecorations();
        if (!this.isEmojiEnabled)
            return;
        const decorations = [];
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
            if (isCursorInside)
                continue;
            let cumulativeLength = 0;
            for (const className of classNames) {
                const startPos = document.positionAt(match.index + match[0].indexOf(className) + cumulativeLength);
                const endPos = document.positionAt(match.index +
                    match[0].indexOf(className) +
                    className.length +
                    cumulativeLength);
                const range = new vscode.Range(startPos, endPos);
                const emoji = emojiMap_1.EMOJI_MAP[className];
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
    isCursorInsideRange(editor, range) {
        return editor.selections.some((selection) => range.contains(selection.start) || range.contains(selection.end));
    }
    clearDecorations() {
        this.decorations.forEach((decoration) => decoration.dispose());
        this.decorations = [];
    }
}
let decorationProvider;
function activate(context) {
    decorationProvider = new TailwindDecorationProvider();
    let toggleCommand = vscode.commands.registerCommand("tailmoji.toggleEmojis", () => {
        decorationProvider.toggleEmojiMode();
    });
    let cursorChangeDisposable = vscode.window.onDidChangeTextEditorSelection((event) => {
        if (event.textEditor === vscode.window.activeTextEditor) {
            decorationProvider.updateDecorations(vscode.window.activeTextEditor);
        }
    });
    vscode.workspace.getConfiguration().update('tailwindCSS.colorDecorators', false, true);
    context.subscriptions.push(toggleCommand, cursorChangeDisposable);
}
exports.activate = activate;
function deactivate() {
    if (decorationProvider) {
        decorationProvider.clearDecorations();
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map