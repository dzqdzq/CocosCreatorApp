function assertIsNonNullable(s, e) {
  assertIsTrue(!(s == null), e);
}
function assertIsTrue(s, e) {
  if (!s) {
    throw new Error("Assertion failed: " + (e ?? "<no-message>"));
  }
}
function assertsArrayIndex(s, e) {
  assertIsTrue(
    e >= 0 && e < s.length,
    `Array index ${e} out of bounds: [0, ${s.length})`
  );
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertIsNonNullable = assertIsNonNullable;
exports.assertIsTrue = assertIsTrue;
exports.assertsArrayIndex = assertsArrayIndex;
