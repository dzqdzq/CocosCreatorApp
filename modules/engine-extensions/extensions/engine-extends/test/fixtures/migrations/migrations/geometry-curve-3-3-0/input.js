/* eslint-disable no-undef */

// Should be generated using engine prior to 3.3.0
cce.Utils.serialize((() => {
    const Default = 0;
    const Normal = 1 << 0;
    const Clamp = 1 << 3;
    const Loop = 1 << 1;
    const PingPong = 1 << 4 | 1 << 1 | 1 << 2;

    const result = {};

    result.defaultConstructed = new ccm.geometry.AnimationCurve();

    result.wrapModeDefault = (() => {
        const curve = new ccm.geometry.AnimationCurve();
        curve.preWrapMode = Default;
        curve.postWrapMode = Default;
        return curve;
    })();

    result.wrapModeNormal = (() => {
        const curve = new ccm.geometry.AnimationCurve();
        curve.preWrapMode = Normal;
        curve.postWrapMode = Normal;
        return curve;
    })();

    result.wrapModeClamp = (() => {
        const curve = new ccm.geometry.AnimationCurve();
        curve.preWrapMode = Clamp;
        curve.postWrapMode = Clamp;
        return curve;
    })();

    result.wrapModeLoop = (() => {
        const curve = new ccm.geometry.AnimationCurve();
        curve.preWrapMode = Loop;
        curve.postWrapMode = Loop;
        return curve;
    })();

    result.wrapModePingPong = (() => {
        const curve = new ccm.geometry.AnimationCurve();
        curve.preWrapMode = PingPong;
        curve.postWrapMode = PingPong;
        return curve;
    })();

    result.keyFrames = (() => {
        const curve = new ccm.geometry.AnimationCurve();
        curve.keyFrames = [createKeyframe({
            time: 0.1,
            value: 1.1,
            inTangent: 2.2,
            outTangent: 3.3,
        })];
        return curve;
    })();

    return result;

    function createKeyframe({
        time,
        value,
        inTangent = 0.0,
        outTangent = 0.0,
    }) {
        const keyFrame = new ccm.geometry.Keyframe();
        keyFrame.time = time;
        keyFrame.value = value;
        keyFrame.inTangent = inTangent;
        keyFrame.outTangent = outTangent;
        return keyFrame;
    }
})());
