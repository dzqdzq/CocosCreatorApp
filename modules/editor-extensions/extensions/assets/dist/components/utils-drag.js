function pickSubAsset2Additional(t) {
  if (t.subAssets) {
    return Object.fromEntries(
      Object.entries(t.subAssets)
        .filter(([, e]) => !(t.redirect && t.redirect.uuid === e.uuid))
        .map(([e, t]) => [
          e,
          { type: t.type, value: t.uuid, name: t.displayName || t.name },
        ])
    );
  }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickSubAsset2Additional = pickSubAsset2Additional;
