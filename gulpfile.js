const concat = require("gulp-concat");
const javascriptObfuscator = require("gulp-javascript-obfuscator");
const { src, dest } = require("gulp");

function obfuscateJS(cb) {
  return src("./miner/*.js")
    .pipe(concat("main.js"))
    .pipe(
      javascriptObfuscator({
        compact: true,
        controlFlowFlattening: true,
        deadCodeInjection: true,
        disableConsoleOutput: true,
        identifierNamesGenerator: "hexadecimal",
        renameGlobals: true,
        rotateStringArray: true,
        shuffleStringArray: true,
        splitStrings: true,
        splitStringsChunkLength: 5,
        stringArray: true,
        transformObjectKeys: true,
      })
    )
    .pipe(dest("./dist/"));
}

exports.obfuscateJS = obfuscateJS;
