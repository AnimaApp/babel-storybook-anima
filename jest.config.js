module.exports = {
  verbose: true,
  coverageDirectory: "coverage",
  testEnvironment: "node",
  modulePathIgnorePatterns: ["debug.d.ts"],
  watchPathIgnorePatterns: ["__fixtures__\\/[^/]+\\/.*(output|error)\\.js"],
};
