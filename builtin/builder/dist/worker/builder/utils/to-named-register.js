function $({ types }, n) {
  if (n && n.name) {
    return {
      visitor: {
        CallExpression: (e) => {
          if (
            types.isMemberExpression(e.node.callee) &&
            types.isIdentifier(e.node.callee.object) &&
            e.node.callee.object.name === "System" &&
            types.isIdentifier(e.node.callee.property) &&
            e.node.callee.property.name === "register" &&
            e.node.arguments.length === 2
          ) {
            e.node.arguments.unshift(types.stringLiteral(n.name));
          }
        },
      },
    };
  }
  throw new Error("'name' options is required.");
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = $;
