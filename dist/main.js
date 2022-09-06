(function (modules) {
  function require(modulePath) {
    // ./src/index.js -> code

    function reWriteRequire(prePath) {
      // ./a.js => ./src/a.js
      const newPath = modules[modulePath].relyOn[prePath];
      return require(newPath);
    }

    const exports = {};

    (function (require, code) {
      eval(code);
    })(reWriteRequire, modules[modulePath].code);

    return exports;
  }

  require('./src/index.js');
})({
  "./src/index.js": {
    "relyOn": { "./a.js": "./src/a.js", "./c.js": "./src/c.js" },
    "code": "\"use strict\";\n\nvar _a = require(\"./a.js\");\n\nvar _c = require(\"./c.js\");\n\nconsole.log('hello world!!!' + _a.a + _c.c);"
  },
  "./src/a.js": {
    "relyOn": { "./b.js": "./src/b.js" },
    "code": "\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.a = void 0;\n\nvar _b = require(\"./b.js\");\n\nvar a = 'a' + _b.b;\nexports.a = a;"
  },
  "./src/b.js": {
    "relyOn": {},
    "code": "\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.b = void 0;\nvar b = 'b';\nexports.b = b;"
  },
  "./src/c.js": {
    "relyOn": {},
    "code": "\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nexports.c = void 0;\nvar c = 'c';\nexports.c = c;"
  }
});