var estraverse = require("estraverse");
var traverse   = require("./traverse");
var esprima    = require("esprima");
var path       = require("path");
var fs         = require("fs");
var _          = require("lodash");

exports.parse = function (code, opts) {
  opts = _.defaults(opts || {}, {
    comment: true,
    range:   true,
    loc:     true
  });

  /**
   * 문자열로 변환
   */
  code = [].concat(code).join("");

  try {
    /**
     * 여기서 파싱
     */
    var tree = esprima.parse(code);

    /**
     * 주석 달아야하면 주석 달기
     */
    if (tree.tokens && tree.comments) {
      estraverse.attachComments(tree, tree.comments, tree.tokens);
    }

    return tree;
  } catch (err) {
    /**
     * 몇번 줄에서 파싱 오류 발생했는지 리턴
     */
    if (err.lineNumber) {
      err.message = err.message + exports.codeFrame(code, err.lineNumber, err.column);
    }
    throw err;
  }
};

/**
 * js파일만 변환 가능
 * @param {*} filename 
 * @returns 
 */
exports.canCompile = function (filename) {
  return path.extname(filename) === ".js";
};

/**
 * sourceMap 을 주석..
 * @param {*} map 
 * @returns 
 */
exports.sourceMapToComment = function (map) {
  var json = JSON.stringify(map);
  var base64 = new Buffer(json).toString("base64");
  return "//# sourceMappingURL=data:application/json;base64," + base64;
};

exports.pushMutatorMap = function (mutatorMap, key, kind, method) {
  var map = mutatorMap[key] = mutatorMap[key] || {};
  /**
   * 객체에 해당 키에 해당하는 메소드가 없으면 새 메소드 할당
   */
  if (map[kind]) {
    throw new Error("a " + kind + " already exists for this property");
  } else {
    map[kind] = method;
  }
};

exports.buildDefineProperties = function (mutatorMap, keyNode) {
  var objExpr = {
    type: "ObjectExpression",
    properties: []
  };

  _.each(mutatorMap, function (map, key) {
    var mapNode = {
      type: "ObjectExpression",
      properties: []
    };

    var propNode = {
      type: "Property",
      key: {
        type: "Identifier",
        name: key
      },
      value: mapNode,
      kind: "init"
    };

    _.each(map, function (methodNode, type) {
      if (methodNode.type === "MethodDefinition") methodNode = methodNode.value;
      mapNode.properties.push({
        type: "Property",
        key: {
          type: "Identifier",
          name: type
        },
        value: methodNode,
        kind: "init"
      });
    });

    objExpr.properties.push(propNode);
  });

  /**
   * 객체 특성 선언
   */
  return exports.template("object-define-properties", {
    OBJECT: keyNode,
    PROPS: objExpr
  }, true);
};

/**
 * `/lib/6to5/templates` 폴더의 파일이 이 함수를 통해서 사용됨.
 * @param {*} name 
 * @param {*} nodes 
 * @param {*} keepExpression 
 * @returns 
 */
exports.template = function (name, nodes, keepExpression) {
  /**
   * 템플릿 복사
   */
  var template = _.cloneDeep(exports.templates[name]);

  if (!_.isEmpty(nodes)) {
    traverse.replace(template, function (node) {
      if (node.type === "Identifier" && _.has(nodes, node.name)) {
        var newNode = nodes[node.name];
        if (_.isString(newNode)) {
          node.name = newNode;
        } else {
          return newNode;
        }
      }
    });
  }

  /**
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/Expression_statement
   * @param {*} node 
   * @returns 
   */
  var normaliseNode = function (node) {
    if (!keepExpression && node.type === "ExpressionStatement") {
      return node.expression;
    } else {
      return node;
    }
  };

  var body = template.body;

  if (body.length <= 1) {
    return normaliseNode(body[0]);
  } else {
    return body.map(normaliseNode);
  }
};

/**
 * code snippet 생성
 * @param {*} lines 
 * @param {*} lineNumber 
 * @param {*} colNumber 
 * @returns 
 */
exports.codeFrame = function (lines, lineNumber, colNumber) {
  if (!lineNumber) return "";

  /**
   * 양수로 colNumber 설정
   */
  colNumber = Math.max(colNumber, 0);

  // 줄 단위로 분할
  lines = lines.split("\n");
  // 코드 snippet의 시작 줄
  var start = Math.max(lineNumber - 3, 0);
  // 코드 snippet의 끝 줄의 길이
  var end   = Math.min(lines.length, lineNumber + 3);
  var width = (end + "").length;

  return "\n" + lines.slice(start, end).map(function (line, i) {
    // 현재 줄 번호
    var curr = i + start + 1;

    // 현재 줄 표시?
    var gutter = curr === lineNumber ? "> " : "  ";

    // 구분자
    var sep = curr + exports.repeat(width + 1);
    gutter += sep + "| ";

    var str = gutter + line;

    // 현재 줄이 표시할 번호면...
    if (colNumber && curr === lineNumber) {
      str += "\n";
      str += exports.repeat(gutter.length - 2);
      str += "|" + exports.repeat(colNumber) + "^";
    }

    return str;
  }).join("\n");
};

exports.repeat = function (width, cha) {
  cha = cha || " ";
  return Array(width + 1).join(cha);
};


/**
 * 아래 코드를 통해서 캐시된 json파일 또는
 * `/lib/6to5/tempaltes`폴더 내의 파일을 AST로 파싱하여
 * exports.templates 객체에 저장함.
 */
var templatesCacheLoc = __dirname + "/../../templates.json";

if (fs.existsSync(templatesCacheLoc)) {
  exports.templates = require(templatesCacheLoc);
} else {
  exports.templates = {};

  var templatesLoc = __dirname + "/templates";

  _.each(fs.readdirSync(templatesLoc), function (name) {
    var key = path.basename(name, path.extname(name));

    var code = fs.readFileSync(templatesLoc + "/" + name, "utf8");
    exports.templates[key] = exports.parse(code, {
      range: false,
      loc:   false
    });
  });
}
