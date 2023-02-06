import * as vscode from "vscode";
import * as fs from "fs";
import path = require("path");

function handleExport(uri: vscode.Uri) {
  const createdFilePath = uri.path.split("/");
  let foundIndex = false;
  let indexFile: string | undefined;

  const fileName = createdFilePath.pop();

  while (createdFilePath.length > 0 && !foundIndex) {
    indexFile = `${createdFilePath.join("/")}/index.ts`;
    foundIndex = fs.existsSync(indexFile);

    createdFilePath.pop();
  }

  if (foundIndex && indexFile) {
    const indexFolder = indexFile.split("/");
    indexFolder.pop();
    const exportPath = path.relative(indexFolder.join("/"), uri.path).replace(".ts", "");
    const exportLine = `export * from './${exportPath}';\n`;

    const indexFileContent = fs.readFileSync(indexFile, "utf8");
    if (indexFileContent.includes(exportLine)) {
      return;
    }

    const options: vscode.MessageOptions = {
      modal: true,
      detail: `
			Should add the following line: 
			${exportLine} 
			to
			${indexFile} ?
	  	`,
    };
    const input = vscode.window.showInformationMessage(
      `
			Should export ${fileName} ? 
		`,
      options,
      ...["Yes"]
    );

    input.then((value) => {
      if (value === "Yes") {
        fs.appendFileSync(indexFile!, exportLine);
      }
    });
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "exportator" is now active!');

  vscode.workspace.onDidCreateFiles((event) => {
    event.files.forEach((uri) => {
      if (uri.scheme !== "file" || !uri.path.endsWith(".ts")) {
        return;
      }

      if (uri.path.includes("node_modules")) {
        return;
      }

      if (uri.path.includes("index")) {
        return;
      }

      if (uri.path.includes("dist")) {
        return;
      }

      if (uri.path.includes(".spec")) {
        return;
      }

      if (uri.path.includes(".mock")) {
        return;
      }

      if (uri.path.includes(".test")) {
        return;
      }

      if (uri.path.includes(".integration")) {
        return;
      }

      handleExport(uri);
    });
  });

  let disposable = vscode.commands.registerCommand("exportator.export", () => {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const document = editor.document;
      const uri = document.uri;
      handleExport(uri);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
