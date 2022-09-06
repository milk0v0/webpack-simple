const fs = require('fs');
const path = require('path');
const bableParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { transformFromAst } = require('@babel/core');

module.exports = class Webpack {
  constructor(options) {
    this.entry = options.entry;
    this.output = options.output;
    // this.modules = [];
  }

  run() {
    // 编译处理模块（模块生成的 chunk，模块依赖的路径）
    const res = this.parse(this.entry);
    // console.log(res);
    // 数据格式转换 arr => obj
    const obj = {};
    res.forEach(({ entryPath, relyOn, code }) => {
      obj[entryPath] = {
        relyOn,
        code
      }
    });
    // console.log(obj);
    this.fire(obj);
  }

  parse(entryPath) {
    const arr = [];

    // console.log(entryPath);
    const content = fs.readFileSync(entryPath, 'utf-8');
    // console.log(content);
    const ast = bableParser.parse(content, { sourceType: 'module' })
    // console.log(ast);
    // console.log(ast.program.body);

    // 依赖
    const relyOn = {};
    traverse(ast, {
      ImportDeclaration({ node }) {
        // console.log(node); // ./a.js -> ./src/a.js
        const prePath = node.source.value;
        const newPath = './' + path.join(path.dirname(entryPath), prePath).replaceAll(path.sep, '/');
        relyOn[prePath] = newPath;
      }
    });

    const { code } = transformFromAst(ast, null, { presets: ['@babel/preset-env'] });
    // console.log(relyOn);
    // console.log(code);
    arr.push({
      entryPath,
      relyOn,
      code
    });

    // 递归依赖
    for (const key in relyOn) {
      const res = relyOn[key];
      Array.prototype.push.apply(arr, this.parse(res));
    }

    return arr;
  }

  fire(obj) {
    const bundlePath = path.join(this.output.path, this.output.filename);
    console.log(bundlePath);
    // 生成 main.js
    const modulesInfo = JSON.stringify(obj);
    const content = `(function(modules) {
      function require(modulePath) {
        // ./src/index.js -> code

        function reWriteRequire(prePath) {
          // ./a.js => ./src/a.js
          const newPath = modules[modulePath].relyOn[prePath];
          return require(newPath);
        }

        const exports = {};

        (function(require, code) {
          eval(code);
        })(reWriteRequire, modules[modulePath].code);

        return exports;
      }

      require('${this.entry}');
    })(${modulesInfo});`;

    fs.writeFileSync(bundlePath, content, 'utf-8');
  }
}