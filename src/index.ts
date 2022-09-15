import * as t from "@babel/types";
import * as babel from "@babel/core";

import { PluginObj } from "@babel/core";
const htmlTags = require("html-tags");
const selfClosingTags = require("html-tags/void");
import nodePath from "path";

import template from "@babel/template";
import { scan, matchBase } from "picomatch";

const html5NativeTags = [...htmlTags, ...selfClosingTags] as string[];
const ignoredImports = ["react", "react/jsx-runtime"];

const relativePattern = /^\.{1,2}([/\\]|$)/;

const isLocal = (str: string) => {
  return relativePattern.test(str) && !str.includes("node_modules");
};

function charAtIsUpper(str: string, pos: number) {
  var chr = str.charAt(pos);
  return /[A-Z]|[\u0080-\u024F]/.test(chr) && chr === chr.toUpperCase();
}

function isJSXComponent(tagName: string) {
  if (!tagName) return false;
  if (charAtIsUpper(tagName, 0)) return true;
  return !html5NativeTags.includes(tagName);
}

type ImportName = { name: string; isDefault: boolean; key?: string };

const isWrapper = (node: t.Node) => {
  return (
    t.isJSXElement(node) &&
    node.openingElement.attributes.some(
      (attribute) =>
        t.isJSXAttribute(attribute) && attribute?.name?.name === "is-anima"
    )
  );
};

type ImportMap = {
  [key: string]: ImportName[];
};

export default () => {
  interface PluginInfo {
    opts: {
      projectRoot?: string;
      storybookConfigDirectory?: string;
      storybookConfig?: {
        stories?: string[];
      };
      identifier?: string;
      mode?: "production" | "development";
    };
    cwd: string;
    filename: string;
    importMap: ImportMap;
  }

  const getExtension = (filename: string) => {
    if (!filename) return "";
    const ext = nodePath.extname(filename);
    return ext ? ext.slice(1) : "";
  };

  const visitor: PluginObj<PluginInfo> = {
    name: "babel-storybook-anima",
    visitor: {
      ImportDeclaration: (path, state) => {
        const filePath = state.filename;
        if (!filePath) return;
        const ext = getExtension(filePath);
        if (!["jsx", "tsx"].includes(ext)) return;

        const importDeclaration = path.node;
        if (!t.isStringLiteral(importDeclaration.source)) {
          return;
        }
        const source = importDeclaration?.source?.value;

        if (!source) return;

        const importNames: ImportName[] = [];

        for (const specifier of importDeclaration?.specifiers ?? []) {
          if (t.isImportNamespaceSpecifier(specifier)) continue;

          if (t.isImportSpecifier(specifier)) {
            const local = specifier.local.name;
            const imported = specifier.imported;
            let importedName = "";
            if (t.isStringLiteral(imported)) {
              importedName = imported.value;
            }
            if (t.isIdentifier(imported)) {
              importedName = imported.name;
            }

            importNames.push({
              name: local,
              isDefault: importedName === "default",
            });
          } else if (t.isImportDefaultSpecifier(specifier)) {
            importNames.push({
              name: specifier.local.name,
              isDefault: true,
            });
          }
        }

        const importedFilePath = isLocal(source)
          ? nodePath.relative(
              state.opts.projectRoot ?? state.cwd,
              nodePath.resolve(state.filename, "..", source)
            )
          : source;

        if (!state.importMap) {
          state.importMap = {};
        }

        if (!state.importMap[importedFilePath]) {
          state.importMap[importedFilePath] = [];
        }

        state.importMap[importedFilePath].push(
          ...importNames.map((e) => ({
            ...e,
            key: e.isDefault
              ? importedFilePath
              : nodePath.join(importedFilePath, e.name),
          }))
        );
      },
      JSXElement: {
        exit: (path, state) => {
          if (isWrapper(path.node) || isWrapper(path.parent)) {
            return;
          }

          const openingElementNode = path.node.openingElement;
          let tagName = "";

          const nameNode = openingElementNode.name;
          if (t.isJSXIdentifier(nameNode)) {
            tagName = nameNode.name;
          }
          if (t.isJSXNamespacedName(nameNode)) {
            tagName = nameNode.name.name;
          }

          const isValidJSXElement = isJSXComponent(tagName);

          if (isValidJSXElement) {
            const importMap = state.importMap ?? {};

            let importPath = "";
            let importName: ImportName | undefined;

            for (const pathKey of Object.keys(importMap)) {
              const importNames = importMap[pathKey];
              const match = importNames.find((e) => e.name === tagName);
              if (match) {
                importPath = pathKey;
                importName = match;
                break;
              }
            }

            if (importPath && importName) {
              importPath = nodePath.relative(
                state.opts.projectRoot ?? state.cwd,
                importPath
              );

              const { name, isDefault, key } = importName;

              const pkg = key
                ? t.stringLiteral(key)
                : isDefault
                ? t.stringLiteral(importPath)
                : t.stringLiteral(nodePath.join(importPath, name));

              const el = t.jsxElement(
                t.jsxOpeningElement(t.jsxIdentifier("span"), [
                  t.jSXAttribute(
                    t.jSXIdentifier("is-anima"),
                    t.stringLiteral("true")
                  ),
                  t.jSXAttribute(
                    t.jSXIdentifier("data-name"),
                    t.stringLiteral(tagName)
                  ),
                  t.jSXAttribute(t.jSXIdentifier("data-package"), pkg),
                ]),
                t.jsxClosingElement(t.jsxIdentifier("span")),
                [path.node]
              );

              path.replaceWith(el);
            }
          }
        },
      },
      Program: {
        exit(path, state) {
          const {
            node: { body },
          } = path;

          if (!state.filename) return;

          const ext = getExtension(state.filename);
          if (!["jsx", "tsx"].includes(ext)) return;

          const storiesPattern = state.opts.storybookConfig?.stories ?? [];
          const storiesGlob = storiesPattern.map((s) => scan(s).glob);

          const file = normalizeStoryPath(
            nodePath.relative(
              state.opts.projectRoot ?? state.cwd,
              state.filename
            )
          );

          const isStoryFile = storiesGlob.some((g) => matchBase(file, g));

          const exportDefaultNode = body.find((node) =>
            t.isExportDefaultDeclaration(node)
          );

          let title = "";
          let component = "";

          if (isStoryFile && exportDefaultNode) {
            const node =
              exportDefaultNode as unknown as t.ExportDefaultDeclaration;
            if (t.isObjectExpression(node.declaration)) {
              const titleProperty = node.declaration.properties.find((p) => {
                if (t.isObjectProperty(p)) {
                  return t.isIdentifier(p.key) && p.key.name === "title";
                }
                return false;
              }) as t.Property | undefined;
              const componentProperty = node.declaration.properties.find(
                (p) => {
                  if (t.isObjectProperty(p)) {
                    return t.isIdentifier(p.key) && p.key.name === "component";
                  }
                  return false;
                }
              ) as t.Property | undefined;
              if (titleProperty) {
                const value = titleProperty.value;
                if (t.isStringLiteral(value)) {
                  title = value.value;
                }
              }
              if (componentProperty) {
                const value = componentProperty.value;
                if (t.isIdentifier(value)) {
                  component = value.name;
                }
              }
            }
          }

          const importMap = Object.keys(
            state.importMap ?? {}
          ).reduce<ImportMap>((prev, curr) => {
            const v = (state.importMap ?? {})[curr];
            if (v && v.length > 0 && !ignoredImports.includes(curr)) {
              prev[curr] = v;
            }
            return prev;
          }, {});

          const fn = template`
          STATEMENT;
      `;

          try {
            const ast = fn({
              STATEMENT: babel.parse(
                `window["__ANIMA__${
                  isStoryFile ? "STORY" : "FILE"
                }__${file}"] =  ${
                  isStoryFile
                    ? JSON.stringify({ imports: importMap, title, component })
                    : JSON.stringify(importMap)
                };`,
                {
                  ast: true,
                  configFile: false,
                }
              )?.program.body[0],
            });

            ast && body.push(ast as t.Statement);
          } catch (error) {}
        },
      },
    },
  };
  return visitor;
};

const normalizeStoryPath = (filename: string) => {
  if (relativePattern.test(filename)) return filename;
  return `.${nodePath.sep}${filename}`;
};
