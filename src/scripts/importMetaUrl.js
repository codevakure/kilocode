/* eslint-disable */
// Polyfill for import.meta.url in CommonJS bundle
// Required for @xenova/transformers to resolve paths correctly
// https://github.com/evanw/esbuild/issues/1492#issuecomment-893144483
export var importMetaUrl = require("url").pathToFileURL(__filename)
