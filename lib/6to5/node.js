var transform = require("./transform");
var fs        = require("fs");
var _         = require("lodash");

exports.browserify = require("./browserify");
exports.middleware = require("./middleware");


exports.register = function () {
  /**
   * `require` 객체에 대한 정보
   * > console.dir(require)
      [Function: require] {
        resolve: [Function: resolve] { paths: [Function: paths] },
        main: undefined,
        extensions: [Object: null prototype] {
          '.js': [Function (anonymous)],
          '.json': [Function (anonymous)],
          '.node': [Function (anonymous)]
        },
        cache: [Object: null prototype] {
          '/config/data/User/workspaceStorage/-2617ba5f/ms-vscode.js-debug/bootloader.js': Module {
            id: '/config/data/User/workspaceStorage/-2617ba5f/ms-vscode.js-debug/bootloader.js',
            path: '/config/data/User/workspaceStorage/-2617ba5f/ms-vscode.js-debug',
            exports: {},
            filename: '/config/data/User/workspaceStorage/-2617ba5f/ms-vscode.js-debug/bootloader.js',
            loaded: true,
            children: [],
            paths: [Array]
          }
        }
      }
   *
   * [How Require Extensions Work](https://gist.github.com/jamestalmage/df922691475cff66c7e6)
   * 
   * 
   * 인자로는 (module, filename)을 받는다.
   * 해당 함수는 원래 코드는 다음과 같다.
      require.extenstions['.js'] = function (module, filename) {
        var content = fs.readFileSync(filename, 'utf8');
        module._compile(internalModule.stripBOM(content), filename);
      }
   *  
   * 그러니까 디스크로부터 파일을 읽고 파일을 컴파일하는거다. 
   * 
   * 이 버전의 구현에서는 ".js"파일에 대해서만 
   * 트랜스컴파일을 구현한다.
   * 
   */
  require.extensions[".js"] = function (m, filename) {
    /**
     * 여기서는 개발자가 작성한 `transformFileSync`함수를 실행해서
     * 변환된 파일을 기본 컴파일러(`module._compile`)로 컴파일을 수행한다.
     */
    m._compile(exports.transformFileSync(filename, {
      sourceMap: true
    }), filename);
  };
};

exports.transform = transform;

exports.transformFile = function (filename, opts, callback) {
  /**
   * 함수 호출을 (filename, callback) 또는
   * (filename, opts, callback)으로 할 수 있도록 하는
   * 오버로딩 기법
   */
  if (_.isFunction(opts)) {
    callback = opts;
    opts = {};
  }

  opts.filename = filename;

  /**
   * 파일을 읽어서 변환 후 콜백 수행
   */
  fs.readFile(filename, function (err, raw) {
    if (err) return callback(err);

    var code;

    try {
      /**
       * 여기서 변환 수행
       */
      code = transform(raw, opts);
    } catch (err) {
      return callback(err);
    }

    callback(null, code);
  });
};

/**
 * transformFile의 동기버전 함수
 * 
 * @param {*} filename 
 * @param {*} opts 
 * @returns 
 */
exports.transformFileSync = function (filename, opts) {
  opts = opts || {};
  opts.filename = filename;
  return transform(fs.readFileSync(filename), opts);
};
