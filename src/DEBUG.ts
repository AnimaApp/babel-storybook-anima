import generate from "@babel/generator";

let traceLog: string[] = [];

export const DEBUG: H5 = {
  logAssertions: false,
  LOG() {
    console.log(formatArgs(arguments, 1));
  },
  ASSERT() {
    const loc: H5Loc = arguments[0];
    for (let i = 1; i < arguments.length; i++) {
      const [caption, val, fields] = arguments[i];
      if (Array.isArray(val)) {
        const err = !val;
        if (err)
          throw new Error(
            "ASSERT FAIL: " +
              caption +
              " at " +
              formatLoc(loc) +
              (fields ? JSON.stringify(fields) : "")
          );
        else if (DEBUG.logAssertions)
          console.log("ASSERT", caption, fields || "");
      } else {
        const err = !traceLog.some((l) => val.test(l));
        if (err)
          throw new Error(
            "NOT FOUND IN HISTORY: " + val.toString() + " at " + formatLoc(loc)
          );
        else if (DEBUG.logAssertions)
          console.log("ASSERT", caption, fields || "");
      }
    }
  },
  RESET() {
    traceLog = [];
  },
  HISTORY() {
    return traceLog.join("\n");
  },
  TRACE() {
    traceLog.push(formatArgs(arguments, 0));
  },
  assertString() {
    // Sample of custom method
    const loc = arguments[0];
    const codes = arguments[1];
    const values = arguments[2];
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      const value = values[i];
      if (typeof value !== "string")
        throw new Error(code + " it not a string at " + formatLoc(loc));
    }
  },
};

function formatLoc(loc: H5Loc) {
  return (loc.filename || "") + ":" + loc.line + ":" + loc.column + " ";
}
function formatArg(arg: any): string {
  if (arg && arg.type) {
    try {
      return generate(arg, {}).code || "";
    } catch (err: any) {
      return "err: " + err.message;
    }
  }
  return JSON.stringify(arg);
}
function formatArgs(args: IArguments, sLoc: 0 | 1): string {
  const flatArgs: string[] = [];
  for (let i = 0; i < args.length - sLoc; i++) {
    const arg = args[i];
    if (Array.isArray(arg) && arg.length == 2) {
      flatArgs.push(formatArg(arg[0]) + ": " + formatArg(arg[1]));
    } else flatArgs.push(formatArg(arg));
  }
  if (sLoc) flatArgs.push(formatArg(formatLoc(args[args.length - 1])));
  return flatArgs.join(" ");
}

export interface H5 {
  logAssertions: boolean;
  assertString(...args: any[]): void;
  LOG(...args: any[]): void;
  ASSERT(...args: any[]): void;
  RESET(): void;
  HISTORY(): string;
  TRACE(...args: any[]): void;
}

declare interface H5Loc {
  filename: string;
  line: number;
  column: number;
}
