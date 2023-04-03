var VISITOR_KEYS = require("./visitor-keys");
var _            = require("lodash");

/**
 * parent는 AST 객체 배열이거나 AST 객체
 */
var traverse = module.exports = function (parent, callback) {
  if (_.isArray(parent)) {
    _.each(parent, function (node) {
      traverse(node, callback);
    });
    return;
  }

  var keys = VISITOR_KEYS[parent.type] || [];

  /**
   * 정의된 키마다 실행
   * 여기서 parent는 배열이 아님
   * 
   * 예를 들어서  parent type이 "AssignmentExpression"이면 
   * 탐색할 키는 ["left", "right"]
   */
  _.each(keys, function (key) {
    var nodes = parent[key];
    if (!nodes) return;

    var handle = function (obj, key) {
      if (!obj[key]) return;

      // strict references in case the callback modified/replaced the node

      var result = callback(obj[key], parent, obj, key);
      if (result === false) return;

      traverse(obj[key], callback);
    };

    /**
     * 자식 노드가 배열이면 각 요소마다 적용
     */
    if (_.isArray(nodes)) {
      _.each(nodes, function (node, i) {
        /**
         * 얘 왜 node 아니고 nodes임?
         */
        handle(nodes, i);
      });
      parent[key] = _.flatten(nodes).filter(function (node) {
        return node !== traverse.Delete;
      });
    } else {
      handle(parent, key);
    }
  });
};

traverse.Delete = {};

traverse.hasType = function (tree, type) {
  var has = false;

  if (_.isArray(tree)) {
    return !!_.find(tree, function (node) {
      return traverse.hasType(node, type);
    });
  } else {
    traverse(tree, function (node) {
      if (node.type === type) {
        has = true;
        return false;
      }
    });
  }

  return has;
};

/**
 * node를 순회하면서 함수 실행
 * 
 * @param {*} node 
 * @param {*} callback 
 */
traverse.replace = function (node, callback) {
  traverse(node, function (node, parent, obj, key) {
    var result = callback(node, parent);
    if (result != null) obj[key] = result;
  });
};
