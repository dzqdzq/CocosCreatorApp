Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBuildMetric = sendBuildMetric;
exports.sendSingleMetric = sendSingleMetric;
exports.collectCrashMetric = collectCrashMetric;
exports.collectMetricFromResult = collectMetricFromResult;
exports.collectMetricFromBundle = collectMetricFromBundle;
exports.collectMetricFromAsset = collectMetricFromAsset;
const cc_1 = require("cc");
const asset_library_1 = require("./manager/asset-library");

const { getFileSizeDeep } = require("./utils");

function sendBuildMetric(e) {
  if (e) {
    try {
      Editor.Metrics.trackEvent({
        category: "Project",
        action: "Build 3.3",
        label: e.B100001,
      });

      Editor.Metrics.trackEvent({
        category: "Project",
        action: "Build",
        label: e.B100001,
      });

      e.B100009.forEach((e) => {
        Editor.Metrics.trackEvent({
          category: "Project",
          action: "Modules 3.4",
          label: e,
        });
      });

      e.B100009 = e.B100009.toString();

      if (Editor.Project.uuid) {
        Editor.Metrics.trackEvent({
          sendToCocosAnalyticsOnly: true,
          store: e.B100001,
          eventId: "ProjectComplete",
          projectId: Editor.Project.uuid,
          projectNm: e.B100004,
          packageName: e.B100005 || "",
          scenes: String(e.B100006),
          scripts: String(e.B100007),
          resources: String(e.B100008),
          moduleConf: e.B100009,
          size: String(e.B100010),
          orientation: e.B100011,
          resUrl: e.B100012,
          appd: e.B100013,
          dimension: e.B100014,
        });
      }

      if (Editor.Project.uuid) {
        Editor.Metrics.trackEvent({
          sendToNewCocosAnalyticsOnly: true,
          category: "buildSystem",
          value: { ...e },
        });
      }
    } catch (e) {
      console.debug(e);
      console.debug("send metric failed!");
    }
  } else {
    console.debug("send build statistics failed!");
  }
}
function sendSingleMetric(t) {
  try {
    Editor.Metrics.trackEvent(t);
  } catch (e) {
    console.debug(e);
    console.debug(`send ${t.category || ""} metric failed!`);
  }
}
function collectCrashMetric(e, t, c, r) {
  e.B100004 = c.staticsInfo.B100005 || "";
  e.B100009 = c.staticsInfo.B100013 || "";
  let s = 0;
  let o = 0;

  if (r) {
    r.forEach((e) => {
      s += e.assetsWithoutRedirect.length || 0;
      o += e.scripts.length || 0;
    });
  }

  e.B100007 = s;
  e.B100006 = o;
}
async function collectMetricFromResult(e, t, c) {
  var t_staticsInfo = t.staticsInfo;

  t_staticsInfo.B100004 = e.name || "";
  t_staticsInfo.B100001 = e.platform || "";
  t_staticsInfo.B100006 = e.scenes.length;
  t_staticsInfo.B100012 = e.server || "";
  t_staticsInfo.B100009 = e.includeModules;
  var s = [];

  s.push(t.paths.assets);
  s.push(t.paths.remote);
  s.push(t.paths.settings);
  s.push(t.paths.subpackages);
  let o = 0;

  s.forEach((e) => {
    o += getFileSizeDeep(e);
  });

  t_staticsInfo.B100010 = o;
  t = await Editor.Profile.getProject("builder", "splash-setting");

  if (e.useSplashScreen && t) {
    t_staticsInfo.B100018 = true;
  }

  t_staticsInfo.B100017 =
    e.designResolution.width + " X " + e.designResolution.height;
  t_staticsInfo.B100014 =
    t_staticsInfo.B100014 === 2 && e.includeModules.includes("3d");

  s = {
    "fd8ec536-a354-4a17-9c74-4f3883c378c8": 1,
    "5d45ba66-829a-46d3-948e-2ed3fa7ee421": 2,
  };

  t = s[e.renderPipeline] || 3;
  t_staticsInfo.B100031 = t;
  s = await Editor.Message.request("engine", "query-engine-info");
  Editor.Metrics.trackEvent({
    sendToNewCocosAnalyticsOnly: true,
    category: "preferences",
    value: { B100001: s.typescript.type === "builtin" ? 1 : 2 },
  });
  try {
    var i;
    var n = "adsense-h5g-plugin";

    if (
      e.packages &&
      e.packages[n] &&
      Editor.Package.getPackages({ name: n, enable: true }).length &&
      (i = e.packages[n]).adsensePropertyCode
    ) {
      Editor.Metrics.trackEvent({
        category: n,
        action: "adsensePropertyCode",
        label: i.adsensePropertyCode,
      });

      Editor.Metrics.trackEvent({
        sendToNewCocosAnalyticsOnly: true,
        category: n,
        value: { B100001: i.adsensePropertyCode },
      });
    }

    for (const a of c) {
      await collectMetricFromBundle(a, t_staticsInfo);
    }
  } catch (e) {
    console.debug(e);
  }
}
async function collectMetricFromBundle(e, t) {
  creaseMetric("B100008", e.assetsWithoutRedirect.length, t);
  creaseMetric("B100007", e.scripts.length, t);

  await Promise.all(
    e.assetsWithoutRedirect.map(async (e) => {
      e = asset_library_1.buildAssetLibrary.getAsset(e);
      return e && (await collectMetricFromAsset(e, t));
    })
  );
}
async function collectMetricFromAsset(e, t) {
  try {
    var c = asset_library_1.buildAssetLibrary.getAssetProperty(e, "type");

    if (c === "cc.Mesh") {
      t.dimension = 2;
      creaseMetric("B100015", 1, t);
    }

    if (["cc.SceneAsset", "cc.Prefab"].includes(c)) {
      c === "cc.Prefab" && creaseMetric("B100016", 1, t);

      collectMetricFromScene(
        await asset_library_1.buildAssetLibrary.getInstance(
          asset_library_1.buildAssetLibrary.getAsset(e.uuid)
        ),
        t
      );
    }

    if (c === "cc.AudioClip") {
      creaseMetric("B100038", 1, t);
    }
  } catch (e) {
    console.debug(e);
  }
}
function collectMetricFromScene(e, t) {
  var c = [
    {
      key: "B100027_",
      comps: [
        cc_1.Collider,
        cc_1.RigidBody,
        cc_1.ConstantForce,
        cc_1.HingeConstraint,
      ],
    },
    {
      key: "B100030_",
      comps: [
        cc_1.BoxCollider2D,
        cc_1.CircleCollider2D,
        cc_1.PolygonCollider2D,
      ],
    },
    {
      key: "B100032_",
      comps: [cc_1.DirectionalLight, cc_1.SphereLight, cc_1.SpotLight],
    },
    { key: "B100040_", comps: [cc_1.ParticleSystem, cc_1.ParticleSystem2D] },
  ];
  const r = e instanceof cc_1.SceneAsset ? e.scene : e.data;
  c.forEach((e) => {
    collectCompsFromScene(e, r, t);
  });
  c = r.getComponentsInChildren("cc.RigidBody2D");
  if (c && c.length) {
    const s = {
      [cc_1.ERigidBody2DType.Static]: 1,
      [cc_1.ERigidBody2DType.Kinematic]: 2,
      [cc_1.ERigidBody2DType.Dynamic]: 3,
      [cc_1.ERigidBody2DType.Animated]: 4,
    };
    c.forEach((e) => {
      creaseMetric("B100029_" + s[e.type], 1, t);
    });
  }

  collectCompPropertyValuesFromScene(
    {
      compName: "cc.ReflectionProbe",
      key: "B100041_",
      property: "probeType",
      values: [0, 1],
    },
    r,
    t
  );

  if (
    e instanceof cc_1.SceneAsset &&
    ((c = e.scene.globals).skybox.enabled &&
      (creaseMetric("B100034", 1, t),
      c.skybox.useHDR
        ? creaseMetric("B100035_1", 1, t)
        : creaseMetric("B100035_2", 1, t)),
    c.fog.enabled)
  ) {
    creaseMetric("B100037", 1, t);
    creaseMetric("B100036_" + (c.fog.type + 1), 1, t);
  }
}
function collectCompsFromScene(c, r, s) {
  c.comps.forEach((e, t) => {
    e = r.getComponentsInChildren(e);

    if (e.length) {
      creaseMetric(c.key + (t + 1), e.length, s);
    }
  });
}
function collectCompPropertiesFromScene(r, e, s) {
  e.getComponentsInChildren(r.compName).forEach((c) => {
    r.properties.forEach((e, t) => {
      if (c[e]) {
        creaseMetric(r.key + (t + 1), 1, s);
      }
    });
  });
}
function collectCompPropertyValuesFromScene(c, e, r) {
  e.getComponentsInChildren(c.compName).forEach((e) => {
    if (e[c.property] !== undefined) {
      for (const t of c.values) {
        if (t === e[c.property]) {
          creaseMetric(c.key + t, 1, r);
          break;
        }
      }
    }
  });
}
function creaseMetric(e, t = 1, c) {
  if (!c[e]) {
    c[e] = 0;
  }

  c[e] += t;
}
