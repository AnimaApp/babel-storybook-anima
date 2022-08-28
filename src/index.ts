import * as t from "@babel/types";
import { PluginObj } from "@babel/core";
const htmlTags = require("html-tags");
const selfClosingTags = require("html-tags/void");
import nodePath from "path";

const html5NativeTags = [...htmlTags, ...selfClosingTags] as string[];

function charAtIsUpper(str: string, pos: number) {
  var chr = str.charAt(pos);
  return /[A-Z]|[\u0080-\u024F]/.test(chr) && chr === chr.toUpperCase();
}

function isJSXComponent(tagName: string) {
  if (!tagName) return false;
  if (charAtIsUpper(tagName, 0)) return true;
  return !html5NativeTags.includes(tagName);
}

export default () => {
  interface PluginInfo {
    opts: {
      identifier?: string;
      mode?: "production" | "development";
    };
    cwd: string;
    filename: string;
    importMap: { [key: string]: { [key: string]: string[] } };
  }

  const visitor: PluginObj<PluginInfo> = {
    name: "babel-storybook-anima",
    visitor: {
      ImportDeclaration: (path, state) => {
        const filePath = state.filename;
        const basename = nodePath.basename(filePath);
        const ext = nodePath.extname(basename).split(".")[1];
        console.log(ext);
        if (!["jsx", "tsx", "js", "ts"].includes(ext)) return;

        const importDeclaration = path.node;
        if (!t.isStringLiteral(importDeclaration.source)) {
          return;
        }
        const source = importDeclaration.source.value;
        if (!source) return;

        const importedFilePath = nodePath.join(filePath, "..", source);

        const importNames = [];

        for (const specifier of importDeclaration.specifiers) {
          if (t.isImportSpecifier(specifier)) {
            importNames.push(specifier.local.name);
          } else if (t.isImportDefaultSpecifier(specifier)) {
            importNames.push(specifier.local.name);
          }
        }

        if (!state.importMap) {
          state.importMap = {};
        }

        if (!state.importMap[filePath]) {
          state.importMap[filePath] = {};
        }

        if (!state.importMap[filePath][importedFilePath]) {
          state.importMap[filePath][importedFilePath] = [];
        }
        state.importMap[filePath][importedFilePath].push(...importNames);
      },
      JSXOpeningElement(path, state) {
        const nodeAttributes = path.node.attributes;
        let tagName = "";

        const nameNode = path.node.name;
        if (t.isJSXIdentifier(nameNode)) {
          tagName = nameNode.name;
        }
        if (t.isJSXNamespacedName(nameNode)) {
          tagName = nameNode.name.name;
        }

        const asOrphan = isJSXComponent(tagName);

        if (asOrphan) {
          const fileImports = (state?.importMap ?? {})[state?.filename] ?? {};

          const importedFilePath = Object.keys(fileImports).find((filePath) => {
            return fileImports[filePath].includes(tagName);
          });

          if (importedFilePath) {
            nodeAttributes.push(
              t.jSXAttribute(
                t.jSXIdentifier("data-file"),
                t.stringLiteral(importedFilePath)
              )
            );
          }

          // nodeAttributes.push(
          //   t.jSXAttribute(t.jSXIdentifier("data-as-orphan"))
          // );
        }
      },
    },
  };
  return visitor;
};
