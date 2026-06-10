var PanelName;
var EditorPreviewState;
var PanelBackgroundPriority;
Object.defineProperty(exports, "__esModule", { value: true });

exports.PanelBackgroundPriority = undefined;
exports.EditorPreviewState = undefined;
exports.PanelName = undefined;

((e) => {
  e.Default = "";
  e.Scene = "scene";
  e.Preview = "preview";
})(PanelName || (exports.PanelName = PanelName = {}));

((e) => {
  e[(e.Changing = 0)] = "Changing";
  e[(e.Start = 1)] = "Start";
  e[(e.Stop = 2)] = "Stop";
})(
  EditorPreviewState || (exports.EditorPreviewState = EditorPreviewState = {})
);

((e) => {
  e[(e.normal = 0)] = "normal";
  e[(e.preview = 1)] = "preview";
})(
  PanelBackgroundPriority ||
    (exports.PanelBackgroundPriority = PanelBackgroundPriority = {})
);
