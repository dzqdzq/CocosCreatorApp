window.boot = function () {
    var settings = window._CCSettings;
    window._CCSettings = undefined;

    var onStart = function () {
        // 设置是否使用高分辨率
        cc.view.enableRetina(true);
        // 设置是否可以自动调整 canvas 大小
        cc.view.resizeWithBrowserSize(true);
        var launchScene = settings.launchScene;

        // load scene
        cc.director.loadScene(launchScene, null,
            function () {
                console.log('Success to load scene: ' + launchScene);
            }
        );
    };

    var option = {
        id: 'GameCanvas',
        debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
        showFPS: settings.debug,
        frameRate: 60,
        groupList: settings.groupList,
        collisionMatrix: settings.collisionMatrix,
    }

    cc.assetManager.init({
        bundleVers: settings.bundleVers,
        subpackages: settings.subpackages,
        remoteBundles: settings.remoteBundles,
        server: settings.server,
        subContextRoot: settings.subContextRoot
    });

    var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
    var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
    var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;
    var START_SCENE = cc.AssetManager.BuiltinBundleName.START_SCENE;
    var bundleRoot = [INTERNAL];

    settings.hasResourcesBundle && bundleRoot.push(RESOURCES);
    settings.hasStartSceneBundle && bundleRoot.push(MAIN);

    var count = 0;
    function cb(err) {
        if (err) return console.error(err.message, err.stack);
        count++;
        if (count === bundleRoot.length + 1) {
            // if there is start-scene bundle. should load start-scene bundle in the last stage
            // Otherwise the main bundle should be the last
            cc.assetManager.loadBundle(settings.hasStartSceneBundle ? START_SCENE : MAIN, function (err) {
                if (!err) cc.game.run(option, onStart);
            });
        }
    }
    // load plugins
    cc.assetManager.loadScript(settings.jsList.map(function (x) { return 'src/' + x; }), cb);

    // load bundles
    for (var i = 0; i < bundleRoot.length; i++) {
        cc.assetManager.loadBundle(bundleRoot[i], cb);
    }
};

require('adapter/ral.js');
require('adapter/web-adapter.js');
require('adapter/engine-adapter.js');
require('src/settings.js');

require('src/cocos2d-runtime.js');

if (typeof window.ccOverride === "function") {
    window.ccOverride();
    delete window.ccOverride;
}

if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
    require('src/physics.js');
}

cc.macro.CLEANUP_IMAGE_CACHE = true;
window.boot();
