const path = require("node:path");

module.exports = {
  env: {
    cjs: {
      browserslistEnv: "isomorphic-production",
      presets: [
        [
          "@babel/preset-env",
          {
            debug: false,
            modules: "commonjs",
            loose: true,
            useBuiltIns: false,
            forceAllTransforms: false,
            ignoreBrowserslistConfig: false,
          },
        ],
      ],
      plugins: [
        [
          path.join(
            __dirname,
            "./scripts/babel-plugin-add-import-extension.cjs",
          ),
          { extension: "cjs" },
        ],
        [
          "module-resolver",
          {
            resolvePath(sourcePath, currentFile) {
              if (sourcePath === "apg-lite") {
                // apg-lite.cjs will be in the same cjs/ output directory
                // The relative path from src/ needs to account for the output being in cjs/
                const srcDir = path.resolve("./src");
                const currentDir = path.dirname(currentFile);
                const relativeToSrc = path.relative(srcDir, currentDir);
                // Path from the output file location to apg-lite.cjs
                // Both will be under cjs/, so we need to go up relativeToSrc levels then to apg-lite.cjs
                if (relativeToSrc === "") {
                  return "./apg-lite.cjs";
                }
                const depth = relativeToSrc.split(path.sep).length;
                return "../".repeat(depth) + "apg-lite.cjs";
              }
              return sourcePath;
            },
          },
        ],
      ],
    },
    es: {
      browserslistEnv: "isomorphic-production",
      presets: [
        [
          "@babel/preset-env",
          {
            debug: false,
            modules: false,
            useBuiltIns: false,
            forceAllTransforms: false,
            ignoreBrowserslistConfig: false,
          },
        ],
      ],
      plugins: [
        [
          path.join(
            __dirname,
            "./scripts/babel-plugin-add-import-extension.cjs",
          ),
          { extension: "mjs" },
        ],
      ],
    },
  },
};
