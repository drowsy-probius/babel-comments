/**
 * [escodegen](https://github.com/estools/escodegen) 임포트
 * 해당 패키지는 AST를 ECMAScript로 변환해주는 작업을 수행함
 */
var escodegen = require("escodegen");
var traverse  = require("./traverse");
var assert    = require("assert");
var util      = require("./util");
var _         = require("lodash");

var transform = module.exports = function (code, opts) {
  opts = opts || {};

  /**
   * opts의 기본값 설정
   */
  _.defaults(opts, {
    blacklist: [],
    whitelist: [],
    sourceMap: false,
    filename:  "unknown",
    format:    {}
  });

  /**
   * 코드 파싱해서 AST 생성
   */
  try {
    var tree = util.parse(code);
  } catch (err) {
    err.message = opts.filename + ": " + err.message;
    throw err;
  }

  /**
   * AST 순회하면서 빈 문장 (EmptyStatement) 제거
   */
  traverse.replace(tree, function (node) {
    if (node.type === "EmptyStatement") {
      return traverse.Delete;
    }
  });

  /**
   * 모든 transformer에 대해서 각각 함수를 적용
   */
  _.each(transform.transformers, function (transformer, name) {
    /**
     * name이 blacklist에 포함되어있다면 실행하지 않음 
     */
    var blacklist = opts.blacklist;
    if (blacklist.length && _.contains(blacklist, name)) return;

    /**
     * name이 whitelist에 없다면 실행하지 않음
     */
    var whitelist = opts.whitelist;
    if (whitelist.length && !_.contains(whitelist, name)) return;

    /**
     * transformer 실행
     */
    transform._runTransformer(transformer, tree, opts);
  });

  /**
   * escodegen (AST -> ECMAScript)의 기본 옵션 설정
   */
  var genOpts = {
    comment: true,
    format: _.merge(opts.format, {
      indent: {
        style: "  "
      }
    })
  };

  /**
   * sourceMap옵션이 설정된 경우에
   * escodegen에도 관련 옵션 설정 
   */
  if (opts.sourceMap) {
    genOpts.sourceMap = true;
    genOpts.sourceContent = code;
    genOpts.sourceMapWithCode = true;
  }

  /**
   * AST로부터 ECMAScript 코드 생성
   */
  var result = escodegen.generate(tree, genOpts);

  /**
   * sourceMap 옵션으로 코드를 변환한 경우
   * 생성 코드와 주석처리된 sourceMap을 리턴함.
   */
  if (genOpts.sourceMapWithCode) {
    return result.code + "\n" + util.sourceMapToComment(result.map) + "\n";
  } else {
    return result + "\n";
  }
};

/**
 * transformer 실행기 선언 (위에서 사용됨)
 * 
 * @param {*} transformer 
 * @param {*} tree 
 * @param {*} opts 
 */
transform._runTransformer = function (transformer, tree, opts) {
  if (transformer.Program) transformer.Program(tree, opts);

  /**
   * AST를 순회하면서 함수 실행
   */
  traverse.replace(tree, function (node, parent) {
    /**
     * 트리의 노드의 타입에 따라서 적용할 함수 선정
     */
    var fn = transformer[node.type] || transformer.all;
    if (!fn) return;

    return fn(node, parent, opts);
  });
};

/**
 * 테스트 함수 선언
 * 
 * @param {*} actual 
 * @param {*} expect 
 * @param {*} opts 
 */
transform.test = function (actual, expect, opts) {
  /**
   * 입력 값 배열을 '\n'으로 연결하여 테스트 문자열 생성
   */
  expect = [].concat(expect).join("\n");
  actual = [].concat(actual).join("\n");

  /**
   * opts의 기본값 설정
   */
  opts = opts || {};
  _.defaults(opts, { filename: "test" });

  /**
   * transform으로 변환한 뒤 파싱
   */
  actual = util.parse(transform(actual, opts));
  expect = util.parse(expect);

  /**
   * 결과 비교 (deepEqual으로 객체 내의 객체도 비교)
   */
  try {
    assert.deepEqual(actual, expect);
  } catch (err) {
    /**
     * 단순 객체 비교가 실패한 경우에는
     * ECMAScript로 변환한 결과를 비교
     */
    actual = escodegen.generate(actual);
    expect = escodegen.generate(expect);
    assert.equal(actual, expect);
  }
};

/**
 * transformers 정의
 */
transform.transformers = {
  arrowFunctions:           require("./transformers/arrow-functions"),
  classes:                  require("./transformers/classes"),
  spread:                   require("./transformers/spread"),
  templateLiterals:         require("./transformers/template-literals"),
  propertyMethodAssignment: require("./transformers/property-method-assignment"),
  defaultParameters:        require("./transformers/default-parameters"),
  destructuringAssignment:  require("./transformers/destructuring-assignment"),
  generators:               require("./transformers/generators"),
  blockBinding:             require("./transformers/block-binding"),
  modules:                  require("./transformers/modules"),
  restParameters:           require("./transformers/rest-parameters")
};
