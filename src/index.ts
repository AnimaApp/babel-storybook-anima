import * as t from "@babel/types";

import { PluginObj } from "@babel/core";
const htmlTags = require("html-tags");
const selfClosingTags = require("html-tags/void");
import nodePath from "path";

import template from "@babel/template";
import { scan, matchBase } from "picomatch";

const html5NativeTags = [...htmlTags, ...selfClosingTags] as string[];
const ignoredImports = ["react", "react/jsx-runtime", "prop-types"];

const relativePattern = /^\.{1,2}([/\\]|$)/;

type ImportOrExportName = { name: string; isDefault: boolean; key?: string };
type ImportOrExportMap = {
  [key: string]: ImportOrExportName[];
};

const isWrapper = (node: t.Node) => {
  const isLocalWrapper = (node: t.Node) => {
    return (
      t.isJSXElement(node) &&
      node.openingElement.attributes.some(
        (attribute) =>
          (t.isJSXAttribute(attribute) &&
            attribute?.name?.name === "data-anima") ||
          (t.isJSXAttribute(attribute) && attribute?.name?.name === "is-anima")
      )
    );
  };

  return (
    isLocalWrapper(node) ||
    (t.isJSXFragment(node) &&
      t.isJSXElement(node.children[0]) &&
      t.isJSXIdentifier(node.children[0].openingElement.name) &&
      node.children[0].openingElement.name.name === "react-comment")
  );
};

const normalizeStoryPath = (filename: string) => {
  if (relativePattern.test(filename)) return filename;
  return `.${nodePath.sep}${filename}`;
};

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

const getExtension = (filename: string) => {
  if (!filename) return "";
  const ext = nodePath.extname(filename);
  return ext ? ext.slice(1) : "";
};

const getExportFromExportSpecifier = (
  specifier: t.ExportSpecifier
): string | null => {
  const { exported } = specifier;
  if (t.isIdentifier(exported)) {
    return exported.name;
  }
  if (t.isStringLiteral(exported)) {
    return exported.value;
  }
  return null;
};
const getPathNodeTagName = (node: t.JSXElement): string => {
  const openingElementNode = node.openingElement;
  let tagName = "";

  const nameNode = openingElementNode.name;
  if (t.isJSXIdentifier(nameNode)) {
    tagName = nameNode.name;
  }
  if (t.isJSXNamespacedName(nameNode)) {
    tagName = nameNode.name.name;
  }

  return tagName;
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
    importMap: ImportOrExportMap;
    exportMap: ImportOrExportMap;
  }

  const visitor: PluginObj<PluginInfo> = {
    name: "babel-storybook-anima",
    visitor: {
      ExportDeclaration(path, state) {
        const filePath = state.filename;
        if (!filePath) return;
        const filename = nodePath.basename(filePath);
        if (!filename.startsWith("index")) return;

        const exportNames = [] as ImportOrExportName[];
        const exportDeclaration = path.node;

        const fileKey = nodePath.dirname(
          nodePath.relative(state.opts.projectRoot ?? state.cwd, filePath)
        );

        if (!state.exportMap) state.exportMap = {};
        if (!state.exportMap[fileKey]) {
          state.exportMap[fileKey] = [];
        }

        if (t.isExportAllDeclaration(exportDeclaration)) {
        } else if (t.isExportDefaultDeclaration(exportDeclaration)) {
        } else if (t.isExportNamedDeclaration(exportDeclaration)) {
          const source = exportDeclaration.source?.value;
          if (source) {
            const exportedSourcePath = nodePath.relative(
              state.opts.projectRoot ?? state.cwd,
              nodePath.resolve(
                filePath,
                nodePath.join(nodePath.dirname(filePath), source)
              )
            );
            for (const specifier of exportDeclaration.specifiers) {
              if (t.isExportSpecifier(specifier)) {
                const exported = getExportFromExportSpecifier(specifier);
                if (!exported) continue;
                const local = specifier.local.name;

                exportNames.push({
                  name: local,
                  isDefault: exported === "default",
                  key: exportedSourcePath,
                });
              }
            }
          }
        }
        state.exportMap[fileKey].push(...exportNames);
      },
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

        const importNames: ImportOrExportName[] = [];

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
              nodePath.resolve(nodePath.dirname(filePath), source)
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

          const tagName = getPathNodeTagName(path.node);
          const isValidJSXElement = isJSXComponent(tagName);

          if (isValidJSXElement) {
            const importMap = state.importMap ?? {};

            let importPath = "";
            let importName: ImportOrExportName | undefined;

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

              const payload = {
                componentData: {
                  pkg: pkg.value,
                  tagName,
                },
              };

              const commentNode = t.jsxElement(
                t.jsxOpeningElement(t.jsxIdentifier("ReactComment"), [
                  t.jSXAttribute(
                    t.jSXIdentifier("data-anima"),
                    t.jsxExpressionContainer(
                      t.stringLiteral(JSON.stringify(payload))
                    )
                  ),
                ]),
                t.jsxClosingElement(t.jsxIdentifier("ReactComment")),
                []
              );

              const frag = t.jSXFragment(
                t.jSXOpeningFragment(),
                t.jSXClosingFragment(),
                [commentNode, path.node]
              );

              path.node.openingElement.attributes.push(
                t.jsxAttribute(
                  t.jsxIdentifier("is-anima"),
                  t.stringLiteral("true")
                )
              );

              path.replaceWith(frag);
            }
          }
        },
      },
      Program: {
        exit(path, state) {
          const {
            node: { body },
          } = path;
          const filePath = state.filename;

          if (!filePath) return;

          const ext = getExtension(filePath);

          const filename = nodePath.basename(filePath);

          const fileKey = nodePath.dirname(
            nodePath.relative(
              state.opts.projectRoot ?? state.cwd,
              state.filename
            )
          );

          const fileExports = state.exportMap?.[fileKey];

          if (filename.startsWith("index")) {
            try {
              path.node.body.push(
                //@ts-ignore
                template.ast(`
                window["__ANIMA__EXPORTS__${fileKey}"] = ${JSON.stringify(
                  fileExports
                )};
                `)
              );
            } catch (error) {
              console.log(error);
            }
          }

          try {
            path.node.body.push(
              //@ts-ignore
              template.ast(`
              if(!window.ReactComment){
                window.ReactComment = (props) => {
                  try{
                    const React = require('react')
                    const animaData = props['data-anima'];
                    if(!animaData) return null;
                    const ref = React.createRef();
                  
                    React.useLayoutEffect(() => {
                      let el = null;
                      let parent = null;
                      let comm = null;
                  
                      if (ref.current) {
                        el = ref.current;
                        parent = el.parentNode;
                        comm = window.document.createComment(animaData);
                        try {
                          if (parent && parent.contains(el)) {
                            parent.replaceChild(comm, el);
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }
                  
                      return () => {
                        if (parent && el && comm) {
                          parent.replaceChild(el, comm);
                        }
                      };
                    }, []);
                  
                    return React.createElement(
                      'span',
                      {
                        ref,
                        style: { display: 'none' },
                      },
                      []
                    );
                  }
                  catch(e){
                    return null
                  }
                
                };
              }
            `)
            );
          } catch (error) {
            console.log(error);
          }

          if (!["jsx", "tsx"].includes(ext)) return;

          const importMap = Object.keys(
            state.importMap ?? {}
          ).reduce<ImportOrExportMap>((prev, curr) => {
            const v = (state.importMap ?? {})[curr];
            if (v && v.length > 0 && !ignoredImports.includes(curr)) {
              prev[curr] = v;
            }
            return prev;
          }, {});

          const storiesPattern = state.opts.storybookConfig?.stories ?? [];
          const storiesGlob = storiesPattern
            .filter(Boolean)
            .map((s) => scan(s).glob)
            .filter(Boolean);

          const file = normalizeStoryPath(
            nodePath.relative(state.opts.projectRoot ?? state.cwd, filePath)
          );

          const isStoryFile =
            file && storiesGlob.some((g) => matchBase(file, g));

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

          try {
            if (isStoryFile) {
              path.node.body.push(
                //@ts-ignore
                template.ast(`
                  window["__ANIMA__STORY__${file}"] =  ${JSON.stringify({
                  imports: importMap,
                  title,
                  component,
                })};
                  `)
              );
            }
          } catch (error) {
            console.log(error);
          }
        },
      },
    },
  };
  return visitor;
};
