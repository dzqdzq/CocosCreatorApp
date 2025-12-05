/* eslint-disable no-undef */
// @ts-check

// Should be generated using engine prior to 3.3.0
cce.Utils.serialize((/** @param {import('cc')} cc */(cc) => {
    const animationClip = new cc.AnimationClip();
    animationClip.keys = [
        [],
        [0.1],
        [0.1, 0.2],
        [0.1, 0.2, 0.3],
        [0.1, 0.2, 0.3, 0.4],
    ];
    const [
        EMPTY_COMMON_TARGET,
        VEC2_COMMON_TARGET,
        VEC3_COMMON_TARGET,
        VEC4_COMMON_TARGET,
        QUAT_COMMON_TARGET,
        COLOR_COMMON_TARGET,
        SIZE__COMMON_TARGET,
    ] = Array.from({ length: animationClip.commonTargets.length }, (_, i) => i);
    animationClip.curves = [
        // Property path
        { modifiers: ['position'], data: { keys: 0, values: [] } },

        // Element path
        { modifiers: [1], data: { keys: 0, values: [] } },

        // Hierarchy path
        { modifiers: [new cc.animation.HierarchyPath('child')], data: { keys: 0, values: [] } },

        // Component path
        { modifiers: [new cc.animation.ComponentPath('cc.MeshRenderer')], data: { keys: 0, values: [] } },

        // Uniform value proxy
        {
            modifiers: [],
            valueAdapter: (() => {
                const vp = new cc.animation.UniformProxyFactory();
                vp.passIndex = 2; vp.uniformName = 'color'; vp.channelIndex = 1; return vp;
            })(),
            data: { keys: 0, values: [] },
        },

        // MorphWeightValueProxy
        {
            modifiers: [],
            valueAdapter: (() => {
                const vp = new cc.animation.MorphWeightsValueProxy();
                vp.subMeshIndex = 1;
                return vp;
            })(),
            data: { keys: 0, values: [] },
        },

        // Composed path
        {
            modifiers: [
                new cc.animation.HierarchyPath('child'),
                new cc.animation.ComponentPath('cc.MeshRenderer'),
                'materials',
                0,
            ],
            valueAdapter: (() => {
                const vp = new cc.animation.UniformProxyFactory();
                vp.passIndex = 2; vp.uniformName = 'color'; vp.channelIndex = 1; return vp;
            })(),
            data: { keys: 0, values: [] },
        },

        // Zero frames
        { modifiers: ['position'], data: { keys: 0, values: [] } },

        // Number curve
        { modifiers: ['position'], data: { keys: 2, values: [0.1, 0.2] } },

        // Vec2 curve
        { modifiers: ['position'], data: { keys: 2, values: [new cc.Vec2(0.1, 0.2), new cc.Vec2(0.3, 0.4)] } },

        // Vec3 curve
        { modifiers: ['position'], data: { keys: 2, values: [new cc.Vec3(0.1, 0.2, 0.3), new cc.Vec3(0.4, 0.5, 0.6)] } },

        // Vec4 curve
        { modifiers: ['position'], data: { keys: 2, values: [new cc.Vec4(0.1, 0.2, 0.3, 0.4), new cc.Vec4(0.4, 0.5, 0.6, 0.7)] } },

        // Quat curve
        { modifiers: ['position'], data: { keys: 2, values: [new cc.Quat(0.1, 0.2, 0.3, 0.4), new cc.Quat(0.4, 0.5, 0.6, 0.7)] } },

        // Color curve
        { modifiers: ['position'], data: { keys: 2, values: [new cc.Color(1, 2, 3, 4), new cc.Color(5, 6, 7, 8)] } },

        // Size curve
        { modifiers: ['position'], data: { keys: 2, values: [new cc.Size(1.0, 2.0), new cc.Size(3.0, 4.0)] } },

        // Number curve with interpolation disabled
        { modifiers: ['position'], data: { keys: 2, values: [0.1, 0.2], interpolate: false } },

        // Vec2 curve with interpolation disabled
        { modifiers: ['position'], data: { keys: 2, values: [new cc.Vec2(0.1, 0.2), new cc.Vec2(0.3, 0.4)], interpolate: false } },

        // Number curve with cubic interpolation
        { modifiers: ['position'], data: { keys: 2, values: [
            new cc.CubicSplineNumberValue(0.1, 0.2, 0.3),
            new cc.CubicSplineNumberValue(-0.4, 0.5, -0.6),
        ] } },

        // Vec2 curve with cubic interpolation
        { modifiers: ['position'], data: { keys: 2, values: [
            new cc.CubicSplineVec2Value(new cc.Vec2(0.1, 0.2), new cc.Vec2(0.1, 0.2), new cc.Vec2(0.1, 0.2)),
            new cc.CubicSplineVec2Value(new cc.Vec2(0.2, 0.3), new cc.Vec2(0.5, -0.9), new cc.Vec2(-0.1, 0.2)),
        ] } },

        // Vec3 curve with cubic interpolation
        { modifiers: ['position'], data: { keys: 2, values: [
            new cc.CubicSplineVec3Value(new cc.Vec3(0.1, 0.2, 0.3), new cc.Vec3(0.1, 0.2, 0.3), new cc.Vec3(0.1, 0.2, 0.3)),
            new cc.CubicSplineVec3Value(new cc.Vec3(0.1, 0.2, 0.3), new cc.Vec3(0.1, 0.2, 0.3), new cc.Vec3(0.1, 0.2, 0.3)),
        ] } },

        // Vec4 curve with cubic interpolation
        { modifiers: ['position'], data: { keys: 2, values: [
            new cc.CubicSplineVec4Value(new cc.Vec4(0.1, 0.2, 0.3, 0.4), new cc.Vec4(0.1, 0.2, 0.3, 0.4), new cc.Vec4(0.1, 0.2, 0.3, 0.4)),
            new cc.CubicSplineVec4Value(new cc.Vec4(0.1, 0.2, 0.3, 0.4), new cc.Vec4(0.1, 0.2, 0.3, 0.4), new cc.Vec4(0.1, 0.2, 0.3, 0.4)),
        ] } },

        // Quat curve with cubic interpolation
        { modifiers: ['position'], data: { keys: 2, values: [
            new cc.CubicSplineQuatValue(new cc.Quat(0.1, 0.2, 0.3, 0.4), new cc.Quat(0.1, 0.2, 0.3, 0.4), new cc.Quat(0.1, 0.2, 0.3, 0.4)),
            new cc.CubicSplineQuatValue(new cc.Quat(0.1, 0.2, 0.3, 0.4), new cc.Quat(0.1, 0.2, 0.3, 0.4), new cc.Quat(0.1, 0.2, 0.3, 0.4)),
        ] } },

        // Common target with empty frame
        { modifiers: ['x'], commonTarget: EMPTY_COMMON_TARGET, data: { keys: 0, values: [] } },

        // Common target with Vec2 curve
        { modifiers: ['x'], commonTarget: VEC2_COMMON_TARGET, data: { keys: 2, values: [new cc.Vec2(0.1, 0.2), new cc.Vec2(0.3, 0.4)] } },
        { modifiers: ['y'], commonTarget: VEC2_COMMON_TARGET, data: { keys: 2, values: [new cc.Vec2(0.1, 0.2), new cc.Vec2(0.3, 0.4)] } },

        // Common target with Vec3 curve
        { modifiers: ['x'], commonTarget: VEC3_COMMON_TARGET, data: { keys: 2, values: [new cc.Vec3(0.1, 0.2, 0.3), new cc.Vec3(0.4, 0.5, 0.6)] } },
        { modifiers: ['y'], commonTarget: VEC3_COMMON_TARGET, data: { keys: 2, values: [new cc.Vec3(0.1, 0.2, 0.3), new cc.Vec3(0.4, 0.5, 0.6)] } },

        // Common target with Vec4 curve
        { modifiers: ['x'], commonTarget: VEC4_COMMON_TARGET, data: { keys: 2, values: [new cc.Vec4(0.1, 0.2, 0.3, 0.4), new cc.Vec4(0.4, 0.5, 0.6, 0.7)] } },

        // Common target with Quat curve
        { modifiers: ['y'], commonTarget: QUAT_COMMON_TARGET, data: { keys: 2, values: [new cc.Quat(0.1, 0.2, 0.3, 0.4), new cc.Quat(0.4, 0.5, 0.6, 0.7)] } },

        // Common target with Color curve
        { modifiers: ['r'], commonTarget: COLOR_COMMON_TARGET, data: { keys: 2, values: [new cc.Color(1, 2, 3, 4), new cc.Color(5, 6, 7, 8)] } },
        { modifiers: ['b'], commonTarget: COLOR_COMMON_TARGET, data: { keys: 2, values: [new cc.Color(1, 2, 3, 4), new cc.Color(5, 6, 7, 8)] } },

        // Common target with Size curve
        { modifiers: ['width'], commonTarget: SIZE__COMMON_TARGET, data: { keys: 2, values: [new cc.Size(1.0, 2.0), new cc.Size(3.0, 4.0)] } },
        { modifiers: ['y'], commonTarget: SIZE__COMMON_TARGET, data: { keys: 2, values: [new cc.Size(1.0, 2.0), new cc.Size(3.0, 4.0)] } },

        // Easing methods: Bezier point
        { modifiers: ['position'], data: { keys: 2, values: [0.1, 0.2], easingMethod: [0.1, 0.2, 0.3, 0.4] } },
        { modifiers: ['position'], data: { keys: 2, values: [0.1, 0.2], easingMethods: [[0.1, 0.2, 0.3, 0.4], [0.11, 0.22, 0.33, 0.44]] } },

        // Easing methods: Bezier point, vec3 curve
        { modifiers: ['position'], data: { keys: 2, values: [new cc.Vec3(0.1, 0.2, 0.3), new cc.Vec3(0.4, 0.5, 0.6)], easingMethod: [0.1, 0.2, 0.3, 0.4] } },
        {
            modifiers: ['position'],
            data: {
                keys: 2,
                values: [new cc.Vec3(0.1, 0.2, 0.3), new cc.Vec3(0.4, 0.5, 0.6)],
                easingMethods: [[0.1, 0.2, 0.3, 0.4], [0.11, 0.22, 0.33, 0.44]],
            },
        },

        // _arrayLength is not considered since it's internally used
    ];

    animationClip.commonTargets = [
        { modifiers: ['position'] },
        { modifiers: ['position'] },
        { modifiers: ['position'] },
        { modifiers: ['position'] },
        { modifiers: ['position'] },
        { modifiers: ['position'] },
        { modifiers: ['position'] },
    ];

    return animationClip;
})(
    // @ts-ignore
    ccm,
));

