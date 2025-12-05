/* eslint-disable no-undef */
// Should be generated using engine prior to 3.3.0
(() => {
    const result = {};

    result.range1 = (() => {
        const curveRange = new ccm.CurveRange();
        curveRange.mode = ccm.CurveRange.Mode.Constant;
        return curveRange;
    })();

    result.range2 = (() => {
        const curveRange = new ccm.CurveRange();
        curveRange.mode = ccm.CurveRange.Mode.Curve;
        return curveRange;
    })();

    result.range3 = (() => {
        const curveRange = new ccm.CurveRange();
        curveRange.mode = ccm.CurveRange.Mode.TwoCurves;
        return curveRange;
    })();

    result.range4 = (() => {
        const curveRange = new ccm.CurveRange();
        curveRange.mode = ccm.CurveRange.Mode.TwoConstants;
        return curveRange;
    })();

    return result;
})();
