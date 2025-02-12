var _ = require("lodash");

var buildBinaryExpression = function (left, right) {
  return {
    type: "BinaryExpression",
    operator: "+",
    left: left,
    right: right
  };
};

exports.TemplateLiteral = function (node) {
  var nodes = [];

  _.each(node.quasis, function (elem) {
    nodes.push({
      type: "Literal",
      value: elem.value.raw
    });

    var expr = node.expressions.shift();
    if (expr) nodes.push(expr);
  });

  if (nodes.length > 1) {
    // remove redundant '' at the end of the expression
    var last = _.last(nodes);
    if (last.type === "Literal" && last.value === "") nodes.pop();

    var root = buildBinaryExpression(nodes.shift(), nodes.shift());

    _.each(nodes, function (node) {
      root = buildBinaryExpression(root, node);
    });

    return root;
  } else {
    return nodes[0];
  }
};
