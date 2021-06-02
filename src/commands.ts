import * as vscode from "vscode";
import {
  createTerminal,
  runFileInTerminal,
  createRepl,
  loadFileInRepl,
  executeSelectionInRepl,
} from "./repl";
import { withFilePath, withRacket, withEditor } from "./utils";

const DELAY_AFTER_REPL_START = 1000;

function getOrDefault<K, V>(map: Map<K, V>, key: K, getDefault: Function) {
  if (!map.has(key)) {
    map.set(key, getDefault());
  }
  return map.get(key)!;
}

function saveActiveTextEditorAndRun(f: Function): void {
  const document = vscode.window.activeTextEditor?.document;
  if (document != null) document.save().then(() => f());
  else f();
}

export function runInTerminal(terminals: Map<string, vscode.Terminal>) {
  withFilePath((filePath: string) => {
    withRacket((racket: string) => {
      let terminal: vscode.Terminal;
      if (
        vscode.workspace
          .getConfiguration("magic-racket.outputTerminal")
          .get("numberOfOutputTerminals") === "one"
      ) {
        terminal = getOrDefault(terminals, "one", () => createTerminal(null));
      } else {
        terminal = getOrDefault(terminals, filePath, () => createTerminal(filePath));
      }
      saveActiveTextEditorAndRun(() => runFileInTerminal(racket, filePath, terminal));
    });
  });
}

export function loadInRepl(repls: Map<string, vscode.Terminal>) {
  withFilePath((filePath: string) => {
    withRacket((racket: string) => {
      let replAlreadyExisted = true;
      const repl = getOrDefault(repls, filePath, () => {
        replAlreadyExisted = false;
        return createRepl(filePath, racket);
      });

      if (replAlreadyExisted) saveActiveTextEditorAndRun(() => loadFileInRepl(filePath, repl));
      else
        saveActiveTextEditorAndRun(() =>
          setTimeout(() => loadFileInRepl(filePath, repl), DELAY_AFTER_REPL_START),
        );
    });
  });
}

export function executeSelection(repls: Map<string, vscode.Terminal>) {
  withEditor((editor: vscode.TextEditor) => {
    withFilePath((filePath: string) => {
      withRacket((racket: string) => {
        let replAlreadyExisted = true;
        const repl = getOrDefault(repls, filePath, () => {
          replAlreadyExisted = false;
          return createRepl(filePath, racket);
        });

        if (replAlreadyExisted) executeSelectionInRepl(repl, editor);
        else setTimeout(() => executeSelectionInRepl(repl, editor), DELAY_AFTER_REPL_START);
      });
    });
  });
}

export function openRepl(repls: Map<string, vscode.Terminal>) {
  withFilePath((filePath: string) => {
    withRacket((racket: string) => {
      const repl = getOrDefault(repls, filePath, () => createRepl(filePath, racket));
      repl.show();
    });
  });
}

export function showOutput(terminals: Map<string, vscode.Terminal>) {
  withFilePath((filePath: string) => {
    const terminal = terminals.get(filePath);
    if (terminal) {
      terminal.show();
    } else {
      vscode.window.showErrorMessage("No output terminal exists for this file");
    }
  });
}
