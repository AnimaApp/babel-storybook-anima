import * as t from "@babel/types";
import { PluginObj } from "@babel/core";
const htmlTags = require("html-tags");
const selfClosingTags = require("html-tags/void");

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
  }

  const visitor: PluginObj<PluginInfo> = {
    name: "babel-storybook-anima",
    visitor: {
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
          nodeAttributes.push(
            t.jSXAttribute(t.jSXIdentifier("data-as-orphan"))
          );
        }
      },
    },
  };
  return visitor;
};
