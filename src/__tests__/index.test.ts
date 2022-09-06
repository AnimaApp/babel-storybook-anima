import * as path from "path";
import * as fs from "fs";
import * as babel from "@babel/core";
import { toMatchFile } from "jest-file-snapshot";
import { DEBUG } from "../DEBUG";

expect.extend({ toMatchFile });

const config = {
  plugins: [[require.resolve("../index")]],
  presets: [["@babel/preset-react"]],
  configFile: false,
};

describe("babel-storybook-anima", () => {
  it("works", () => {
    DEBUG.RESET();
    const { code, output } = transform("JSX");
    expect(DEBUG.HISTORY()).toMatchFile(output + ".history");
    expect(code).toMatchFile(output);
  });
});

function transform(test: "JSX") {
  return transformFile(
    path.join(__dirname, "..", "__fixtures__", test, "code.jsx"), // input
    path.join(__dirname, "..", "__fixtures__", test, "code.output.jsx") // output
  );
}

function transformFile(input: string, output: string) {
  try {
    try {
      fs.unlinkSync(output);
      fs.unlinkSync(path.resolve(output + ".history"));
    } catch (error) {}
    const gen = babel.transformFileSync(input, config);
    return { code: gen?.code || "", output };
  } finally {
  }
}
