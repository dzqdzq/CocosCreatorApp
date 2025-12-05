{const {join} = require('path');const __editorModulePath__ = join(Editor.App.path,'node_modules');module.paths.push(__editorModulePath__);}'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var ps = require('path');
var cc = require('cc');
var exec = require('child_process');
var fs$1 = require('fs');
var EventEmitter = require('events');
var image = require('../image-91ee442d.js');
var fe = require('fs-extra');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var ps__default = /*#__PURE__*/_interopDefaultLegacy(ps);
var cc__default = /*#__PURE__*/_interopDefaultLegacy(cc);
var exec__default = /*#__PURE__*/_interopDefaultLegacy(exec);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs$1);
var EventEmitter__default = /*#__PURE__*/_interopDefaultLegacy(EventEmitter);
var fe__default = /*#__PURE__*/_interopDefaultLegacy(fe);

// Settings 编辑器要提供编辑界面
//
class LFX_Settings {
    constructor() {
        // 多重采样: 值(1, 2, 4, 8)
        this.MSAA = 4;
        // 高精度模式
        this.Highp = false;
        // 烘培贴图大小: 值(128, 256, 512, 1024, 2048)
        this.Size = 1024;
        // Gamma值
        this.Gamma = 2.2;
        // 天空辐照度(用于全局光照)
        this.SkyRadiance = [0, 0, 0];
        // 全局光照缩放
        this.GIScale = 1.0;
        // 全局光照采样数
        this.GISamples = 25;
        // 全局光照光线最大跟踪次数
        this.GIPathLength = 3;
        // Probe光照缩放
        this.GIProbeScale = 1.0;
        // Probe光照采样数
        this.GIProbeSamples = 1024;
        // Probe光线最大跟踪次数
        this.GIProbePathLength = 2;
        // AO等级(0：关闭，1：低，2：高)
        this.AOLevel = 0;
        // AO强度
        this.AOStrength = 1.0;
        // AO影响的范围
        this.AORadius = 1.0;
        // AO颜色
        this.AOColor = [0.5, 0.5, 0.5];
        // 线程数量
        this.Threads = 1;
        // 烘培LightMap
        this.BakeLightMap = true;
        // 烘培LightProbe
        this.BakeLightProbe = false;
    }
}
class LFX_Vertex {
    constructor() {
        this.Position = [0, 0, 0];
        this.Normal = [0, 0, 0];
        this.UV = [0, 0];
        this.LUV = [0, 0];
    }
}
class LFX_Triangle {
    constructor() {
        this.Index = [0, 0, 0];
        this.MaterialId = 0;
    }
}
class LFX_Material {
    constructor() {
        this.Metallic = 0;
        this.Roughness = 0;
        // Diffuse color
        this.Diffuse = [1, 1, 1];
        // Emissive color
        this.Emissive = [0, 0, 0];
        // 纹理，(所有'/'或者'\\'都必须转换成'$')
        this.Texture = '';
        // 纹理，(所有'/'或者'\\'都必须转换成'$')
        //public MetallicMap = '';
        // 纹理，(所有'/'或者'\\'都必须转换成'$')
        //public RoughnessMap = '';
        // 纹理，(所有'/'或者'\\'都必须转换成'$')
        this.PBRMap = '';
        // 纹理，(所有'/'或者'\\'都必须转换成'$')
        this.EmissiveMap = '';
    }
}
// 模型
class LFX_Mesh {
    constructor() {
        this.CastShadow = false;
        this.ReceiveShadow = false;
        this.LightMapSize = 0;
        this.VertexBuffer = new Array();
        this.TriangleBuffer = new Array();
        this.MaterialBuffer = new Array();
    }
}
// 地形
class LFX_Terrain {
    constructor() {
        this.Position = [0, 0, 0];
        this.TileSize = 0;
        this.BlockCount = [0, 0];
        this.HeightField = new Uint16Array();
        this.LightMapSize = 0;
    }
}
// 灯光
class LFX_Light {
    constructor() {
        // 类型
        this.Type = LFX_Light.POINT;
        // 位置
        this.Position = [0, 0, 0];
        // 方向
        this.Direction = [0, 0, 0];
        // 颜色
        this.Color = [0, 0, 0];
        // 强度
        this.Illuminance = 1;
        // 衰减开始距离
        // public AttenStart = 0;
        // 衰减结束距离
        // public AttenEnd = 1;
        this.Size = 0;
        this.Range = 0;
        // 衰减强度
        this.AttenFallOff = 1;
        // 聚光灯内角
        this.SpotInner = 1;
        // 聚光灯外角
        this.SpotOuter = 0.7071;
        // 聚光灯衰减强度
        this.SpotFallOff = 1;
        // 直接光照缩放
        this.DirectScale = 1;
        // 间接光照缩放
        this.IndirectScale = 1;
        // 是否开启全局光照
        this.GIEnable = false;
        // 是否投射阴影
        this.CastShadow = false;
    }
}
LFX_Light.POINT = 0;
LFX_Light.SPOT = 1;
LFX_Light.DIRECTION = 2;
// LightProbe
class LFX_LightProbe {
    constructor() {
        // 位置
        this.Position = [0, 0, 0];
        // 法线
        this.Normal = [0, 0, 0];
    }
}
// tslint:disable-next-line: class-name
class LFX_Buffer {
    constructor() {
        this.Length = 0;
        this.Buffer = new Uint8Array(2048);
        this._dview = new DataView(this.Buffer.buffer);
        this._seekPos = 0;
    }
    Reserve(size) {
        if (this.Buffer.byteLength > size) {
            return;
        }
        let capacity = this.Buffer.byteLength;
        while (capacity < size) {
            capacity += capacity;
        }
        const temp = new Uint8Array(capacity);
        for (let i = 0; i < this.Length; ++i) {
            temp[i] = this.Buffer[i];
        }
        this.Buffer = temp;
        this._dview = new DataView(this.Buffer.buffer);
    }
    Assign(buff) {
        this.Buffer = buff;
        this.Length = buff.length;
        this._seekPos = buff.byteOffset;
        this._dview = new DataView(buff.buffer);
    }
    WriteInt8(value) {
        this.Reserve(this.Length + 1);
        this._dview.setInt8(this.Length, value);
        this.Length += 1;
    }
    WriteInt16(value) {
        this.Reserve(this.Length + 2);
        this._dview.setInt16(this.Length, value, true);
        this.Length += 2;
    }
    WriteInt32(value) {
        this.Reserve(this.Length + 4);
        this._dview.setInt32(this.Length, value, true);
        this.Length += 4;
    }
    WriteHeightField(value) {
        this.Reserve(this.Length + 2 * value.length);
        for (let i = 0; i < value.length; ++i) {
            this._dview.setUint16(this.Length + i * 2, value[i], true);
        }
        this.Length += 2 * value.length;
    }
    WriteIntArray(value) {
        this.Reserve(this.Length + 4 * value.length);
        for (let i = 0; i < value.length; ++i) {
            this._dview.setInt32(this.Length + i * 4, value[i], true);
        }
        this.Length += 4 * value.length;
    }
    WriteFloat(value) {
        this.Reserve(this.Length + 4);
        this._dview.setFloat32(this.Length, value, true);
        this.Length += 4;
    }
    WriteFloatArray(value) {
        this.Reserve(this.Length + 4 * value.length);
        for (let i = 0; i < value.length; ++i) {
            this._dview.setFloat32(this.Length + i * 4, value[i], true);
        }
        this.Length += 4 * value.length;
    }
    WriteString(value) {
        this.Reserve(this.Length + value.length + 4);
        this._dview.setInt32(this.Length, value.length, true);
        for (let i = 0; i < value.length; ++i) {
            this._dview.setInt8(this.Length + 4 + i, value.charCodeAt(i));
        }
        this.Length += value.length + 4;
    }
    ReadInt8() {
        const value = this._dview.getInt8(this._seekPos);
        this._seekPos += 1;
        return value;
    }
    ReadInt16() {
        const value = this._dview.getInt16(this._seekPos, true);
        this._seekPos += 2;
        return value;
    }
    ReadInt() {
        const value = this._dview.getInt32(this._seekPos, true);
        this._seekPos += 4;
        return value;
    }
    ReadIntArray(value) {
        for (let i = 0; i < value.length; ++i) {
            value[i] = this._dview.getInt32(this._seekPos + i * 4, true);
        }
        this._seekPos += 4 * value.length;
        return value;
    }
    ReadFloat() {
        const value = this._dview.getFloat32(this._seekPos, true);
        this._seekPos += 4;
        return value;
    }
    ReadFloatArray(value) {
        for (let i = 0; i < value.length; ++i) {
            value[i] = this._dview.getFloat32(this._seekPos + i * 4, true);
        }
        this._seekPos += 4 * value.length;
        return value;
    }
    ReadString() {
        const length = this.ReadInt();
        let value = '';
        for (let i = 0; i < length; ++i) {
            value += String.fromCharCode(this.ReadInt8());
        }
        return value;
    }
}
// tslint:disable-next-line: class-name
class LFX_World {
    constructor() {
        this.Name = '';
        this.Settings = new LFX_Settings();
        this.Textures = new Array();
        this.Terrains = new Array();
        this.Meshes = new Array();
        this.Lights = new Array();
        this.LightProbes = new Array();
    }
    AddUniqueTexture(tex) {
        if (tex.length > 0) {
            for (const i of this.Textures) {
                if (i === tex) {
                    return tex;
                }
            }
            this.Textures.push(tex);
        }
        return tex;
    }
}
// tslint:disable-next-line: class-name
class LFX_TerrainLightMapInfo {
    constructor() {
        this.Id = 0;
        this.BlockId = 0;
        this.Index = 0;
        this.Offset = [0, 0];
        this.Scale = [0, 0];
    }
}
// tslint:disable-next-line: class-name
class LFX_MeshLightMapInfo {
    constructor() {
        this.Id = 0;
        this.Index = 0;
        this.Offset = [0, 0];
        this.Scale = [0, 0];
    }
}
// tslint:disable-next-line: class-name
class LFX_LightProbeInfo {
    constructor() {
        this.Position = [0, 0, 0];
        this.Normal = [0, 0, 0];
        this.Coefficients = [0];
    }
}
// tslint:disable-next-line: class-name
class LFX_File {
    constructor() {
        this.Verison = 0;
        this.MeshInfos = new Array();
        this.TerrainInfos = new Array();
        this.LightProbeInfos = new Array();
    }
}

const io = require('socket.io');
//const LFX_FILE_VERSION = 0x2000;
const LFX_FILE_VERSION = 0x2002; // 3.7.2 2
const LFX_FILE_TERRAIN = 0x01;
const LFX_FILE_MESH = 0x02;
const LFX_FILE_LIGHT = 0x03;
const LFX_FILE_LIGHT_PROBE = 0x04;
const LFX_FILE_EOF = 0x00;
// tslint:disable-next-line: class-name
class LFX_Baker extends EventEmitter__default['default'] {
    constructor() {
        super();
        this.World = new LFX_World();
        this.Started = false;
        this.Finished = false;
        this.Error = false;
        //
        this._server = null;
        this._client = null;
        this._path = null;
        this._lfxpath = null;
    }
    get lfxpath() {
        return this._lfxpath || ps__default['default'].resolve('tools/lightmap-tools');
    }
    set lfxpath(path) {
        this._lfxpath = path;
    }
    get closed() {
        return this._server == null;
    }
    get connected() {
        return this._client != null;
    }
    get client() {
        return this._client;
    }
    // 启动socket.io, 0为随机分配端口
    Launch(port = 0) {
        this.Started = false;
        this.Finished = false;
        this.Error = false;
        this._server = io.listen(port);
        this._server.on('connection', (socket) => {
            socket.on('Login', (data) => {
                this._client = socket;
                this.emit('login', this._client);
            });
            socket.on('Log', (data) => {
                this.emit('log', data);
            });
            socket.on('Progress', (data) => {
                this.emit('progress', data);
            });
            socket.on('Finished', (data) => {
                this.Finished = true;
                this.emit('fineshed', data);
            });
        });
        return port;
    }
    // 关闭
    Close() {
        if (this._server != null) {
            this._server.close();
        }
        this._server = null;
        this._client = null;
    }
    // 上传
    Upload(asset_path) {
        this._path = asset_path;
        const buff = new LFX_Buffer();
        let triangleCount = 0;
        // console.log(asset_path, '================');
        // if(fs.existsSync(asset_path)) {
        //     Utils.removeDir(asset_path);
        // }
        // fs.mkdirSync(asset_path);
        const immediatePath = asset_path + '/tmp';
        if (!fs__default['default'].existsSync(immediatePath)) {
            fs__default['default'].mkdirSync(immediatePath);
        }
        // const outputPath = asset_path + '/output';
        // if (!fs.existsSync(outputPath)) {
        //     // 删除输出文件
        //     const files = fs.readdirSync(outputPath);
        //     files.forEach((file, index) => {
        //         const curPath = outputPath + '/' + file;
        //         if (!fs.statSync(curPath).isDirectory()) {
        //             fs.unlinkSync(curPath);
        //         }
        //     });
        // }
        // Head
        buff.WriteInt32(LFX_FILE_VERSION);
        buff.WriteString(this.World.Name);
        // Setting
        const ambient = [0.0, 0.0, 0.0];
        buff.WriteFloatArray(ambient);
        buff.WriteFloatArray(this.World.Settings.SkyRadiance);
        buff.WriteInt32(this.World.Settings.MSAA);
        buff.WriteInt32(this.World.Settings.Size);
        buff.WriteFloat(this.World.Settings.Gamma);
        buff.WriteInt8(this.World.Settings.Highp ? 1 : 0);
        buff.WriteFloat(this.World.Settings.GIScale);
        buff.WriteInt32(this.World.Settings.GISamples);
        buff.WriteInt32(this.World.Settings.GIPathLength);
        buff.WriteFloat(this.World.Settings.GIProbeScale);
        buff.WriteInt32(this.World.Settings.GIProbeSamples);
        buff.WriteInt32(this.World.Settings.GIProbePathLength);
        buff.WriteInt32(this.World.Settings.AOLevel);
        buff.WriteFloat(this.World.Settings.AOStrength);
        buff.WriteFloat(this.World.Settings.AORadius);
        buff.WriteFloat(this.World.Settings.AOColor[0] / 255.0);
        buff.WriteFloat(this.World.Settings.AOColor[1] / 255.0);
        buff.WriteFloat(this.World.Settings.AOColor[2] / 255.0);
        buff.WriteInt32(this.World.Settings.Threads);
        buff.WriteInt8(this.World.Settings.BakeLightMap ? 1 : 0);
        buff.WriteInt8(this.World.Settings.BakeLightProbe ? 1 : 0);
        // Terrains
        for (const terrain of this.World.Terrains) {
            buff.WriteInt32(LFX_FILE_TERRAIN);
            buff.WriteFloatArray(terrain.Position);
            buff.WriteFloat(terrain.TileSize);
            buff.WriteIntArray(terrain.BlockCount);
            buff.WriteInt32(terrain.LightMapSize);
            buff.WriteHeightField(terrain.HeightField);
        }
        // Meshes
        for (const mesh of this.World.Meshes) {
            buff.WriteInt32(LFX_FILE_MESH);
            buff.WriteInt8(mesh.CastShadow ? 1 : 0);
            buff.WriteInt8(mesh.ReceiveShadow ? 1 : 0);
            buff.WriteInt32(mesh.LightMapSize);
            buff.WriteInt32(mesh.VertexBuffer.length);
            buff.WriteInt32(mesh.TriangleBuffer.length);
            buff.WriteInt32(mesh.MaterialBuffer.length);
            triangleCount += mesh.TriangleBuffer.length;
            for (const vtx of mesh.VertexBuffer) {
                buff.WriteFloatArray(vtx.Position);
                buff.WriteFloatArray(vtx.Normal);
                buff.WriteFloatArray(vtx.UV);
                buff.WriteFloatArray(vtx.LUV);
            }
            for (const tri of mesh.TriangleBuffer) {
                buff.WriteIntArray(tri.Index);
                buff.WriteInt32(tri.MaterialId);
            }
            for (const mtl of mesh.MaterialBuffer) {
                buff.WriteFloat(mtl.Metallic);
                buff.WriteFloat(mtl.Roughness);
                buff.WriteFloatArray(mtl.Diffuse);
                buff.WriteFloatArray(mtl.Emissive);
                buff.WriteString(mtl.Texture);
                buff.WriteString(mtl.PBRMap);
                buff.WriteString(mtl.EmissiveMap);
            }
        }
        // Lights
        for (const light of this.World.Lights) {
            buff.WriteInt32(LFX_FILE_LIGHT);
            buff.WriteInt32(light.Type);
            buff.WriteFloatArray(light.Position);
            buff.WriteFloatArray(light.Direction);
            buff.WriteFloatArray(light.Color);
            buff.WriteFloat(light.Size);
            buff.WriteFloat(light.Range);
            buff.WriteFloat(light.AttenFallOff);
            buff.WriteFloat(light.SpotInner);
            buff.WriteFloat(light.SpotOuter);
            buff.WriteFloat(light.SpotFallOff);
            buff.WriteFloat(light.DirectScale);
            buff.WriteFloat(light.IndirectScale);
            buff.WriteInt8(light.GIEnable ? 1 : 0);
            buff.WriteInt8(light.CastShadow ? 1 : 0);
        }
        // LightProbes
        for (const probe of this.World.LightProbes) {
            buff.WriteInt32(LFX_FILE_LIGHT_PROBE);
            buff.WriteFloatArray(probe.Position);
            buff.WriteFloatArray(probe.Normal);
        }
        // EOF
        buff.WriteInt32(LFX_FILE_EOF);
        // Save
        fs__default['default'].writeFileSync(immediatePath + '/lfx.in', buff.Buffer);
        // Copy Textures
        for (const tex of this.World.Textures) {
            const data = fs__default['default'].readFileSync(asset_path + '/' + tex);
            const target = tex.replace('/', '$');
            fs__default['default'].writeFileSync(immediatePath + '/' + target, data);
        }
        // 参与烘焙物体的三角形总面数 埋点
        Editor.Metrics.trackEvent({
            sendToNewCocosAnalyticsOnly: true,
            category: 'bakingSystem',
            value: {
                A100001: triangleCount,
            },
        });
    }
    //
    Download() {
        const file = new LFX_File();
        const filename = this._path + '/output/lfx.out';
        const buff = fs__default['default'].readFileSync(filename);
        if (buff != null) {
            const stream = new LFX_Buffer();
            stream.Assign(buff);
            file.Verison = stream.ReadInt();
            //console.log('Read lfx out fle, version ' +  file.Verison);
            do {
                const cid = stream.ReadInt();
                if (cid === LFX_FILE_EOF) {
                    break;
                }
                if (cid === LFX_FILE_TERRAIN) {
                    const id = stream.ReadInt();
                    const count = stream.ReadInt();
                    //console.log('Read ' + count + ' terrain lightmap infos');
                    for (let i = 0; i < count; ++i) {
                        const info = new LFX_TerrainLightMapInfo();
                        info.Id = id;
                        info.BlockId = stream.ReadInt();
                        info.Index = stream.ReadInt();
                        info.Offset[0] = stream.ReadFloat();
                        info.Offset[1] = stream.ReadFloat();
                        info.Scale[0] = stream.ReadFloat();
                        info.Scale[1] = stream.ReadFloat();
                        file.TerrainInfos.push(info);
                    }
                }
                else if (cid === LFX_FILE_MESH) {
                    const count = stream.ReadInt();
                    //console.log('Read ' + count + ' mesh lightmap infos');
                    for (let i = 0; i < count; ++i) {
                        const info = new LFX_MeshLightMapInfo();
                        info.Id = stream.ReadInt();
                        info.Index = stream.ReadInt();
                        info.Offset[0] = stream.ReadFloat();
                        info.Offset[1] = stream.ReadFloat();
                        info.Scale[0] = stream.ReadFloat();
                        info.Scale[1] = stream.ReadFloat();
                        file.MeshInfos.push(info);
                    }
                }
                else if (cid === LFX_FILE_LIGHT_PROBE) {
                    const count = stream.ReadInt();
                    //console.log('Read ' + count + ' light probe infos');
                    for (let i = 0; i < count; ++i) {
                        const info = new LFX_LightProbeInfo();
                        stream.ReadFloatArray(info.Position);
                        stream.ReadFloatArray(info.Normal);
                        info.Coefficients.length = stream.ReadInt();
                        stream.ReadFloatArray(info.Coefficients);
                        file.LightProbeInfos.push(info);
                    }
                }
                else {
                    // error
                    console.log('LightFX unknown chunk ' + cid);
                }
            } while (1); // eslint-disable-line
        }
        return file;
    }
    // 开始烘培
    Start() {
        this._client && this._client.emit('Start');
        this.Started = true;
    }
    // 停止烘培
    Stop() {
        this._client && this._client.emit('Stop');
    }
}

var NodeEventType;
(function (NodeEventType) {
    NodeEventType["TRANSFORM_CHANGED"] = "transform-changed";
    NodeEventType["SIZE_CHANGED"] = "size-changed";
    NodeEventType["ANCHOR_CHANGED"] = "anchor-changed";
    NodeEventType["CHILD_ADDED"] = "child-added";
    NodeEventType["CHILD_REMOVED"] = "child-removed";
    NodeEventType["PARENT_CHANGED"] = "parent-changed";
    NodeEventType["CHILD_CHANGED"] = "child-changed";
    NodeEventType["COMPONENT_CHANGED"] = "component-changed";
    NodeEventType["ACTIVE_IN_HIERARCHY_CHANGE"] = "active-in-hierarchy-changed";
    NodeEventType["PREFAB_INFO_CHANGED"] = "prefab-info-changed";
})(NodeEventType || (NodeEventType = {}));
var NodeOperationType;
(function (NodeOperationType) {
    NodeOperationType["SET_PROPERTY"] = "set-property";
    NodeOperationType["MOVE_ARRAY_ELEMENT"] = "move-array-element";
    NodeOperationType["REMOVE_ARRAY_ELEMENT"] = "remove-array-element";
    NodeOperationType["CREATE_COMPONENT"] = "create-component";
    NodeOperationType["RESET_COMPONENT"] = "reset-component";
})(NodeOperationType || (NodeOperationType = {}));
var EventSourceType;
(function (EventSourceType) {
    EventSourceType["EDITOR"] = "editor";
    EventSourceType["UNDO"] = "undo";
    EventSourceType["ENGINE"] = "engine";
})(EventSourceType || (EventSourceType = {}));

const fs = require('fs'), os = require('os'), net = require('net'), path = require('path'), _async = require('async'), debug = require('debug'), mkdirp = require('mkdirp').mkdirp;
const debugTestPort = debug('portfinder:testPort'), debugGetPort = debug('portfinder:getPort'), debugDefaultHosts = debug('portfinder:defaultHosts');
const internals = {};
internals.testPort = function (options, callback) {
    if (!callback) {
        callback = options;
        options = {};
    }
    options.server =
        options.server ||
            net.createServer(function () {
                //
                // Create an empty listener for the port testing server.
                //
            });
    debugTestPort('entered testPort(): trying', options.host, 'port', options.port);
    function onListen() {
        debugTestPort('done w/ testPort(): OK', options.host, 'port', options.port);
        options.server.removeListener('error', onError);
        options.server.close();
        callback(null, options.port);
    }
    function onError(err) {
        debugTestPort('done w/ testPort(): failed', options.host, 'w/ port', options.port, 'with error', err.code);
        options.server.removeListener('listening', onListen);
        if (!(err.code == 'EADDRINUSE' || err.code == 'EACCES')) {
            return callback(err);
        }
        const port = nextPort(options.port);
        if (port > highestPort) {
            return callback(new Error('No open ports available'));
        }
        internals.testPort({
            port,
            host: options.host,
            server: options.server,
        }, callback);
    }
    options.server.once('error', onError);
    options.server.once('listening', onListen);
    if (options.host) {
        options.server.listen(options.port, options.host);
    }
    else {
        /*
      Judgement of service without host
      example:
        express().listen(options.port)
    */
        options.server.listen(options.port);
    }
};
//
// ### @basePort {Number}
// The lowest port to begin any port search from
//
const basePort = 8000;
//
// ### @highestPort {Number}
// Largest port number is an unsigned short 2**16 -1=65335
//
const highestPort = 65535;
//
// ### function getPort (options, callback)
// #### @options {Object} Settings to use when finding the necessary port
// #### @callback {function} Continuation to respond to when complete.
// Responds with a unbound port on the current machine.
//
function getPort(options, callback) {
    if (!callback) {
        callback = options;
        options = {};
    }
    options.port = Number(options.port) || Number(basePort);
    options.host = options.host || null;
    options.stopPort = Number(options.stopPort) || Number(highestPort);
    if (!options.startPort) {
        options.startPort = Number(options.port);
        if (options.startPort < 0) {
            throw Error('Provided options.startPort(' + options.startPort + ') is less than 0, which are cannot be bound.');
        }
        if (options.stopPort < options.startPort) {
            throw Error('Provided options.stopPort(' + options.stopPort + 'is less than options.startPort (' + options.startPort + ')');
        }
    }
    if (options.host) {
        let hasUserGivenHost;
        for (let i = 0; i < _defaultHosts.length; i++) {
            if (_defaultHosts[i] === options.host) {
                hasUserGivenHost = true;
                break;
            }
        }
        if (!hasUserGivenHost) {
            _defaultHosts.push(options.host);
        }
    }
    const openPorts = [];
    let currentHost;
    return _async.eachSeries(_defaultHosts, function (host, next) {
        debugGetPort('in eachSeries() iteration callback: host is', host);
        return internals.testPort({ host: host, port: options.port }, function (err, port) {
            if (err) {
                debugGetPort('in eachSeries() iteration callback testPort() callback', 'with an err:', err.code);
                currentHost = host;
                return next(err);
            }
            else {
                debugGetPort('in eachSeries() iteration callback testPort() callback', 'with a success for port', port);
                openPorts.push(port);
                return next();
            }
        });
    }, function (err) {
        if (err) {
            debugGetPort('in eachSeries() result callback: err is', err);
            // If we get EADDRNOTAVAIL it means the host is not bindable, so remove it
            // from exports._defaultHosts and start over. For ubuntu, we use EINVAL for the same
            if (err.code === 'EADDRNOTAVAIL' || err.code === 'EINVAL') {
                if (options.host === currentHost) {
                    // if bad address matches host given by user, tell them
                    // NOTE: We may need to one day handle `my-non-existent-host.local` if users
                    // report frustration with passing in hostnames that DONT map to bindable
                    // hosts, without showing them a good error.
                    const msg = 'Provided host ' + options.host + ' could NOT be bound. Please provide a different host address or hostname';
                    return callback(Error(msg));
                }
                else {
                    const idx = _defaultHosts.indexOf(currentHost);
                    _defaultHosts.splice(idx, 1);
                    return getPort(options, callback);
                }
            }
            else {
                // error is not accounted for, file ticket, handle special case
                return callback(err);
            }
        }
        // sort so we can compare first host to last host
        openPorts.sort(function (a, b) {
            return a - b;
        });
        debugGetPort('in eachSeries() result callback: openPorts is', openPorts);
        if (openPorts[0] === openPorts[openPorts.length - 1]) {
            // if first === last, we found an open port
            if (openPorts[0] <= options.stopPort) {
                return callback(null, openPorts[0]);
            }
            else {
                const msg = 'No open ports found in between ' + options.startPort + ' and ' + options.stopPort;
                return callback(Error(msg));
            }
        }
        else {
            // otherwise, try again, using sorted port, aka, highest open for >= 1 host
            return getPort({ port: openPorts.pop(), host: options.host, startPort: options.startPort, stopPort: options.stopPort }, callback);
        }
    });
}
//
// ### function nextPort (port)
// #### @port {Number} Port to increment from.
// Gets the next port in sequence from the
// specified `port`.
//
function nextPort(port) {
    return port + 1;
}
/**
 * @desc List of internal hostnames provided by your machine. A user
 *       provided hostname may also be provided when calling portfinder.getPort,
 *       which would then be added to the default hosts we lookup and return here.
 *
 * @return {array}
 *
 * Long Form Explantion:
 *
 *    - Input: (os.networkInterfaces() w/ MacOS 10.11.5+ and running a VM)
 *
 *        { lo0:
 *         [ { address: '::1',
 *             netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
 *             family: 'IPv6',
 *             mac: '00:00:00:00:00:00',
 *             scopeid: 0,
 *             internal: true },
 *           { address: '127.0.0.1',
 *             netmask: '255.0.0.0',
 *             family: 'IPv4',
 *             mac: '00:00:00:00:00:00',
 *             internal: true },
 *           { address: 'fe80::1',
 *             netmask: 'ffff:ffff:ffff:ffff::',
 *             family: 'IPv6',
 *             mac: '00:00:00:00:00:00',
 *             scopeid: 1,
 *             internal: true } ],
 *        en0:
 *         [ { address: 'fe80::a299:9bff:fe17:766d',
 *             netmask: 'ffff:ffff:ffff:ffff::',
 *             family: 'IPv6',
 *             mac: 'a0:99:9b:17:76:6d',
 *             scopeid: 4,
 *             internal: false },
 *           { address: '10.0.1.22',
 *             netmask: '255.255.255.0',
 *             family: 'IPv4',
 *             mac: 'a0:99:9b:17:76:6d',
 *             internal: false } ],
 *        awdl0:
 *         [ { address: 'fe80::48a8:37ff:fe34:aaef',
 *             netmask: 'ffff:ffff:ffff:ffff::',
 *             family: 'IPv6',
 *             mac: '4a:a8:37:34:aa:ef',
 *             scopeid: 8,
 *             internal: false } ],
 *        vnic0:
 *         [ { address: '10.211.55.2',
 *             netmask: '255.255.255.0',
 *             family: 'IPv4',
 *             mac: '00:1c:42:00:00:08',
 *             internal: false } ],
 *        vnic1:
 *         [ { address: '10.37.129.2',
 *             netmask: '255.255.255.0',
 *             family: 'IPv4',
 *             mac: '00:1c:42:00:00:09',
 *             internal: false } ] }
 *
 *    - Output:
 *
 *         [
 *          '0.0.0.0',
 *          '::1',
 *          '127.0.0.1',
 *          'fe80::1',
 *          '10.0.1.22',
 *          'fe80::48a8:37ff:fe34:aaef',
 *          '10.211.55.2',
 *          '10.37.129.2'
 *         ]
 *
 *     Note we export this so we can use it in our tests, otherwise this API is private
 */
const _defaultHosts = (function () {
    let interfaces = {};
    try {
        interfaces = os.networkInterfaces();
    }
    catch (e) {
        // As of October 2016, Windows Subsystem for Linux (WSL) does not support
        // the os.networkInterfaces() call and throws instead. For this platform,
        // assume 0.0.0.0 as the only address
        //
        // - https://github.com/Microsoft/BashOnWindows/issues/468
        //
        // - Workaround is a mix of good work from the community:
        //   - https://github.com/http-party/node-portfinder/commit/8d7e30a648ff5034186551fa8a6652669dec2f2f
        //   - https://github.com/yarnpkg/yarn/pull/772/files
        // @ts-ignore
        if (e && e.syscall === 'uv_interface_addresses') ;
        else {
            throw e;
        }
    }
    const interfaceNames = Object.keys(interfaces), hiddenButImportantHost = '0.0.0.0', // !important - dont remove, hence the naming :)
    results = [hiddenButImportantHost];
    for (let i = 0; i < interfaceNames.length; i++) {
        const _interface = interfaces[interfaceNames[i]];
        for (let j = 0; j < _interface.length; j++) {
            const curr = _interface[j];
            results.push(curr.address);
        }
    }
    // add null value, For createServer function, do not use host.
    results.push(null);
    debugDefaultHosts('exports._defaultHosts is: %o', results);
    return results;
})();

const nodeMgr = cce.Node;
/**
 * @en Clamps a value between a minimum float and maximum float value.<br/>
 * @zh 返回最小浮点数和最大浮点数之间的一个数值。可以使用 clamp 函数将不断变化的数值限制在范围内。
 * @param val
 * @param min
 * @param max
 */
function clamp(val, min, max) {
    if (min > max) {
        const temp = min;
        min = max;
        max = temp;
    }
    return val < min ? min : val > max ? max : val;
}
let fileInfoMap;
async function readImageList(path, isSub = false, callback) {
    isSub || (fileInfoMap = {});
    const files = fs__default['default'].readdirSync(path);
    await Editor.Message.request('asset-db', 'refresh-asset', path);
    await Promise.all(files.map(async (itm) => {
        const res = ps.join(path, itm);
        const stat = fs__default['default'].statSync(res);
        if (stat.isDirectory()) {
            // 递归读取文件
            await readImageList(res, true);
        }
        else {
            if (itm.endsWith('.png')) {
                const url = await Editor.Message.request('asset-db', 'query-url', res);
                let uuid = null;
                if (url) {
                    uuid = await Editor.Message.request('asset-db', 'query-uuid', url);
                }
                const metaPath = res + '.meta';
                if (fs$1.existsSync(metaPath)) {
                    try {
                        const json = fe__default['default'].readJSONSync(metaPath);
                        json.userData || (json.userData = {});
                        const userData = json.userData;
                        userData.fixAlphaTransparencyArtifacts = false;
                        userData.type = 'texture';
                        fe__default['default'].writeJsonSync(metaPath, json, { encoding: 'utf8', spaces: 2 });
                        await Editor.Message.request('asset-db', 'refresh-asset', res);
                    }
                    catch (error) {
                        console.error('change meta failed', res);
                        console.error(error);
                    }
                }
                // 定义一个对象存放图片的路径和名字
                const obj = {
                    path,
                    filename: itm,
                    size: image.formatBytes(stat.size),
                    uuid,
                };
                fileInfoMap[obj.filename] = obj;
                // @6c48a 为texture类型
                await new Promise((resolve, reject) => {
                    cc.assetManager.loadAny(obj.uuid + '@6c48a', (err, texture) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            obj.texture = texture;
                            resolve();
                        }
                    });
                });
            }
        }
    }));
    callback && callback(fileInfoMap);
    return fileInfoMap;
}
// tslint:disable-next-line: class-name
class LFX_App {
    constructor() {
        this.Baker = new LFX_Baker();
        this.Scene = null;
        this.Models = [];
        this.Lights = [];
        this.Terrains = [];
        this.MainLight = null;
        this.MainCamera = null;
        this._numLights = 0;
        this._numObjects = 0;
        this._numTriangles = 0;
        this._currentTicks = 0;
        this._lastTicks = 0;
        this._uploadPath = '';
        this._process = null;
        this._timer = null;
    }
    // 重置节点lightmap
    static Reset(node) {
        const HideInHierarchy = 1 << 10;
        const scene = node.scene;
        if (scene !== null) {
            scene.globals.bakedWithStationaryMainLight = false;
            scene.globals.bakedWithHighpLightmap = false;
        }
        const terrain = node.getComponent(cc.Terrain);
        if (terrain != null && terrain.enabled) {
            for (let i = 0; i < terrain.getBlocks().length; ++i) {
                terrain._updateLightmap(i, null, 0, 0, 0, 0);
            }
        }
        const models = node.getComponents(cc.MeshRenderer);
        for (const model of models) {
            model._updateLightmap(null, 0, 0, 0, 0);
            if (model.node) {
                const compIndex = model.node.components.indexOf(model);
                nodeMgr.emit('change', model.node, { type: NodeOperationType.SET_PROPERTY, propPath: `__comps__.${compIndex}.bakeSettings` });
            }
        }
        const lights = node.getComponents(cc.Light);
        for (const light of lights) {
            light.baked = false;
        }
        for (const child of node.children) {
            if (!child.active) {
                continue;
            }
            if (child._objFlags & HideInHierarchy) {
                continue;
            }
            this.Reset(child);
        }
    }
    static DirtyBaked(node) {
        const HideInHierarchy = 1 << 10;
        if (node.mobility == cc.MobilityMode.Static) {
            const lights = node.getComponents(cc.Light);
            for (const light of lights) {
                light.baked = true;
            }
        }
        for (const child of node.children) {
            if (!child.active) {
                continue;
            }
            if (child._objFlags & HideInHierarchy) {
                continue;
            }
            this.DirtyBaked(child);
        }
    }
    Init(data = {}) {
        this.Baker.World = new LFX_World();
        this.Scene = null;
        this.Models = [];
        this.Lights = [];
        this.Terrains = [];
        this.MainLight = null;
        this.MainCamera = null;
        this._currentTicks = 0;
        this._lastTicks = 0;
        // 场景名字
        this.Baker.World.Name = data.name || 'Test';
        // 服务器地址
        // this.Baker.World.Settings.Server = data.server || 'localhost:9002';
        // 环境光照
        // this.Baker.World.Settings.Ambient = data.ambient || [0.0, 0.0, 0.0];
        // 天空辐照度(用于全局光照)
        this.Baker.World.Settings.SkyRadiance = data.skyRadiance || [0.5, 0.5, 0.5];
        // 高精度模式
        this.Baker.World.Settings.Highp = data.highp ? true : false;
        // 多重采样: 值(1, 2, 4, 8)
        this.Baker.World.Settings.MSAA = data.msaa || 4;
        // 烘培贴图大小: 值(128, 256, 512, 1024, 2048)
        this.Baker.World.Settings.Size = data.size || 1024;
        // Gamma值
        this.Baker.World.Settings.Gamma = 2.2;
        // 全局光照缩放
        this.Baker.World.Settings.GIScale = data.giScale || 0;
        // 全局光照采样数
        // 全局光照光线最大跟踪次数
        this.Baker.World.Settings.GIPathLength = data.giPathLength || 4;
        // AO等级
        this.Baker.World.Settings.AOLevel = data.aoLevel || 0;
        // AO颜色
        this.Baker.World.Settings.AOColor = data.aoColor || [127.5, 127.5, 127.5];
        // AO半径
        this.Baker.World.Settings.AORadius = data.aoRadius || 1.0;
        // AO强度
        this.Baker.World.Settings.AOStrength = data.aoStrength || 1.0;
        // 线程数量
        this.Baker.World.Settings.Threads = data.threads || 1;
        this._uploadPath = data.path || '';
    }
    Index2Str(index) {
        let str = '';
        if (index < 1000) {
            str = str + '0';
        }
        if (index < 100) {
            str = str + '0';
        }
        if (index < 10) {
            str = str + '0';
        }
        str = str + index;
        return str;
    }
    Cancel() {
        if (this._timer) {
            clearInterval(this._timer);
            this.Baker.Stop();
            this.Baker.Close();
            this._timer = null;
            this.Baker.emit('cancel', true);
            if (this._process !== null) {
                this._process.kill('SIGKILL');
                this._process = null;
            }
        }
    }
    async Bake(node) {
        this.Baker.World.Settings.BakeLightMap = true;
        this.Baker.World.Settings.BakeLightProbe = true;
        await this._bakeImp(node);
    }
    async BakeLightMap(node) {
        this.Baker.World.Settings.BakeLightMap = true;
        this.Baker.World.Settings.BakeLightProbe = false;
        await this._bakeImp(node);
    }
    async BakeLightProbe(node) {
        this.Baker.World.Settings.BakeLightMap = false;
        this.Baker.World.Settings.BakeLightProbe = true;
        await this._bakeImp(node);
    }
    async _bakeImp(node) {
        if (this._process) {
            console.warn('Baker has already starting');
            return;
        }
        this.Scene = node;
        this._numLights = 0;
        this._numObjects = 0;
        this._numTriangles = 0;
        this._export(node);
        this._exportLightProbes(node.scene);
        const scene = this.Scene?.scene;
        if (this.Baker.World.Settings.BakeLightProbe && scene && scene.globals && scene.globals.lightProbeInfo) {
            this.Baker.World.Settings.GIProbeScale = scene.globals.lightProbeInfo.giScale;
            this.Baker.World.Settings.GIProbeSamples = scene.globals.lightProbeInfo.giSamples;
            this.Baker.World.Settings.GIProbePathLength = scene.globals.lightProbeInfo.bounces;
        }
        for (const mesh of this.Baker.World.Meshes) {
            for (const mtl of mesh.MaterialBuffer) {
                if (mtl.Texture.length === 0) {
                    continue;
                }
                const uuid = mtl.Texture;
                if (uuid.search('@') === -1) {
                    const filename = await Editor.Message.request('asset-db', 'query-path', uuid);
                    if (filename !== null) {
                        mtl.Texture = filename;
                    }
                    else {
                        mtl.Texture = '';
                    }
                }
                else {
                    mtl.Texture = ps.join(Editor.Project.path, 'library', uuid.substr(0, 2), uuid);
                }
                if (mtl.Texture.length === 0) {
                    console.warn('query-path texture ' + uuid + ' failed');
                }
            }
        }
        if (cc.director.root.pipeline.pipelineSceneData.isHDR) {
            const e = cc.renderer.scene.Camera.standardExposureValue;
            for (const light of this.Baker.World.Lights) {
                light.Color[0] *= light.Illuminance * e;
                light.Color[1] *= light.Illuminance * e;
                light.Color[2] *= light.Illuminance * e;
            }
        }
        else {
            for (const light of this.Baker.World.Lights) {
                light.Color[0] *= light.Illuminance;
                light.Color[1] *= light.Illuminance;
                light.Color[2] *= light.Illuminance;
            }
        }
        this.Baker.Upload(this._uploadPath);
        this._run();
    }
    async _export(node) {
        this._exportImp(node);
    }
    _exportImp(node) {
        if (node.mobility === cc.MobilityMode.Movable) {
            return;
        }
        if (!(node instanceof cc.Scene)) {
            this._exportNode(node);
        }
        const HideInHierarchy = 1 << 10;
        for (const child of node.children) {
            if (!child.active) {
                continue;
            }
            if (child._objFlags & HideInHierarchy) {
                continue;
            }
            this._exportImp(child);
        }
    }
    _exportNode(node) {
        const terrain = node.getComponent(cc.Terrain);
        if (terrain != null && terrain.enabled) {
            this._exportTerrain(terrain);
        }
        const models = node.getComponents(cc.MeshRenderer);
        for (const model of models) {
            if (model.enabled) {
                this._exportModel(model);
            }
        }
        const lights = node.getComponents(cc.Light);
        for (const light of lights) {
            if (light.enabled) {
                this._exportLight(light);
            }
        }
        /*
        const cameras = node.getComponents(Camera);
        for (const camera of cameras) {
            if (camera.enabled) {
                this._exportCamera(camera);
            }
        }
        */
    }
    _exportTerrain(terrain) {
        const fxterrain = new LFX_Terrain();
        fxterrain.Position[0] = terrain.node.getWorldPosition().x;
        fxterrain.Position[1] = terrain.node.getWorldPosition().y;
        fxterrain.Position[2] = terrain.node.getWorldPosition().z;
        fxterrain.TileSize = terrain.info.tileSize;
        fxterrain.BlockCount[0] = terrain.info.blockCount[0];
        fxterrain.BlockCount[1] = terrain.info.blockCount[1];
        fxterrain.LightMapSize = terrain.info.lightMapSize;
        // @ts-ignore
        fxterrain.HeightField = terrain.getHeightField();
        this.Baker.World.Terrains.push(fxterrain);
        this.Terrains.push(terrain);
        this._numObjects++;
        this._numTriangles += fxterrain.BlockCount[0] * fxterrain.BlockCount[1] * 2048;
    }
    async _exportModel(model) {
        const mesh = model.mesh;
        if (mesh == null) {
            return false;
        }
        if (this.Baker.World.Settings.BakeLightMap) {
            if (!model.bakeSettings.bakeable && !model.bakeSettings.castShadow) {
                return false;
            }
        }
        else if (this.Baker.World.Settings.BakeLightProbe) {
            if (!model.bakeSettings.bakeToLightProbe) {
                return false;
            }
        }
        const fxmesh = new LFX_Mesh();
        if (this.Baker.World.Settings.BakeLightMap) {
            fxmesh.CastShadow = model.bakeSettings.castShadow;
            fxmesh.ReceiveShadow = model.bakeSettings.receiveShadow;
            if (model.bakeSettings.bakeable) {
                fxmesh.LightMapSize = model.bakeSettings.lightmapSize;
            }
        }
        else if (this.Baker.World.Settings.BakeLightProbe) {
            fxmesh.CastShadow = model.bakeSettings.bakeToLightProbe;
        }
        let missLightmapUV = false;
        let errorLightmapUV = false;
        let startVertex = 0;
        const worldTM = model.node.getWorldMatrix();
        for (let iPrimitive = 0; iPrimitive < mesh.struct.primitives.length; ++iPrimitive) {
            const positions = mesh.readAttribute(iPrimitive, cc.gfx.AttributeName.ATTR_POSITION);
            const normals = mesh.readAttribute(iPrimitive, cc.gfx.AttributeName.ATTR_NORMAL);
            const uvs = mesh.readAttribute(iPrimitive, cc.gfx.AttributeName.ATTR_TEX_COORD);
            const luvs = mesh.readAttribute(iPrimitive, cc.gfx.AttributeName.ATTR_TEX_COORD1);
            const indices = mesh.readIndices(iPrimitive);
            // 检查是否有效
            if (!positions || !normals || !indices) {
                return false;
            }
            if (positions.length !== normals.length) {
                return false;
            }
            if (uvs != null && positions.length / 3 !== uvs.length / 2) {
                return false;
            }
            if (luvs != null && positions.length / 3 !== luvs.length / 2) {
                return false;
            }
            // 没有lightmap uv
            if (luvs == null) {
                if (fxmesh.LightMapSize > 0) {
                    missLightmapUV = true;
                }
                fxmesh.ReceiveShadow = false;
            }
            // 顶点数据
            for (let v = 0; v < positions.length / 3; ++v) {
                const P = new cc.Vec3();
                P.x = positions[v * 3 + 0];
                P.y = positions[v * 3 + 1];
                P.z = positions[v * 3 + 2];
                cc.Vec3.transformMat4(P, P, worldTM);
                const N = new cc.Vec3();
                N.x = normals[v * 3 + 0];
                N.y = normals[v * 3 + 1];
                N.z = normals[v * 3 + 2];
                cc.Vec3.transformMat4Normal(N, N, worldTM);
                N.normalize();
                const vertex = new LFX_Vertex();
                vertex.Position[0] = P.x;
                vertex.Position[1] = P.y;
                vertex.Position[2] = P.z;
                vertex.Normal[0] = N.x;
                vertex.Normal[1] = N.y;
                vertex.Normal[2] = N.z;
                if (uvs != null) {
                    vertex.UV[0] = uvs[v * 2 + 0];
                    vertex.UV[1] = uvs[v * 2 + 1];
                }
                if (luvs != null && fxmesh.LightMapSize > 0) {
                    vertex.LUV[0] = luvs[v * 2 + 0];
                    vertex.LUV[1] = luvs[v * 2 + 1];
                    if (vertex.LUV[0] < 0 || vertex.LUV[0] > 1 ||
                        vertex.LUV[1] < 0 || vertex.LUV[1] > 1) {
                        errorLightmapUV = true;
                    }
                }
                fxmesh.VertexBuffer.push(vertex);
            }
            // 索引数据
            for (let i = 0; i < indices.length / 3; ++i) {
                const tri = new LFX_Triangle();
                if (positions.length < 256) {
                    tri.Index[0] = indices[i * 3 + 0] + startVertex;
                    tri.Index[1] = indices[i * 3 + 1] + startVertex;
                    tri.Index[2] = indices[i * 3 + 2] + startVertex;
                }
                else if (positions.length < 65536) {
                    tri.Index[0] = indices[i * 3 + 0] + startVertex;
                    tri.Index[1] = indices[i * 3 + 1] + startVertex;
                    tri.Index[2] = indices[i * 3 + 2] + startVertex;
                }
                else {
                    tri.Index[0] = indices[i * 3 + 0] + startVertex;
                    tri.Index[1] = indices[i * 3 + 1] + startVertex;
                    tri.Index[2] = indices[i * 3 + 2] + startVertex;
                }
                if (model.materials.length > 0) {
                    tri.MaterialId = clamp(iPrimitive, 0, model.materials.length - 1);
                }
                else {
                    tri.MaterialId = 0;
                }
                fxmesh.TriangleBuffer.push(tri);
            }
            startVertex = fxmesh.VertexBuffer.length;
        }
        // Materials
        if (model.materials.length > 0) {
            const PixelFormat = cc.Texture2D.PixelFormat;
            for (let m = 0; m < model.materials.length; ++m) {
                const fxmtl = new LFX_Material();
                fxmtl.Diffuse[0] = 1;
                fxmtl.Diffuse[1] = 1;
                fxmtl.Diffuse[2] = 1;
                fxmtl.Emissive[0] = 0;
                fxmtl.Emissive[1] = 0;
                fxmtl.Emissive[2] = 0;
                const mmtl = model.materials[m];
                if (mmtl !== null) {
                    const mainColor = mmtl.getProperty('mainColor', 0);
                    if (mainColor) {
                        fxmtl.Diffuse[0] = mainColor.x;
                        fxmtl.Diffuse[1] = mainColor.y;
                        fxmtl.Diffuse[2] = mainColor.z;
                    }
                    const roughness = mmtl.getProperty('roughness', 0);
                    if (roughness) {
                        fxmtl.Roughness = roughness;
                    }
                    else {
                        fxmtl.Roughness = 0.8;
                    }
                    const metallic = mmtl.getProperty('metallic', 0);
                    if (metallic) {
                        fxmtl.Metallic = metallic;
                    }
                    else {
                        fxmtl.Metallic = 0.6;
                    }
                    const albedoScale = mmtl.getProperty('albedoScale', 0);
                    if (albedoScale) {
                        if (albedoScale instanceof cc.Vec3) {
                            fxmtl.Diffuse[0] *= albedoScale.x;
                            fxmtl.Diffuse[1] *= albedoScale.y;
                            fxmtl.Diffuse[2] *= albedoScale.z;
                        }
                        else {
                            fxmtl.Diffuse[0] *= albedoScale;
                            fxmtl.Diffuse[1] *= albedoScale;
                            fxmtl.Diffuse[2] *= albedoScale;
                        }
                    }
                    let tex = mmtl.getProperty('mainTexture', 0);
                    if (tex == null) {
                        tex = mmtl.getProperty('albedoMap', 0);
                    }
                    const isValidTextureFormat = (tex) => {
                        const format = tex.getPixelFormat();
                        return format == PixelFormat.RGBA8888 || format === PixelFormat.RGB888;
                    };
                    if (tex !== null && isValidTextureFormat(tex)) {
                        const asset = tex.mipmaps[0];
                        if (asset !== null) {
                            if (asset._uuid.search('@') !== -1) {
                                fxmtl.Texture = asset._uuid + asset._native;
                            }
                            else {
                                fxmtl.Texture = asset._uuid;
                            }
                        }
                    }
                    tex = mmtl.getProperty('pbrMap', 0);
                    if (tex !== null && isValidTextureFormat(tex)) {
                        const asset = tex.mipmaps[0];
                        if (asset !== null) {
                            if (asset._uuid.search('@') !== -1) {
                                fxmtl.PBRMap = asset._uuid + asset._native;
                            }
                            else {
                                fxmtl.PBRMap = asset._uuid;
                            }
                        }
                    }
                    // export emissive material parameters
                    const emissiveColor = mmtl.getProperty('emissive', 0);
                    if (emissiveColor) {
                        fxmtl.Emissive[0] = emissiveColor.x;
                        fxmtl.Emissive[1] = emissiveColor.y;
                        fxmtl.Emissive[2] = emissiveColor.z;
                        const emissiveScale = mmtl.getProperty('emissiveScale', 0);
                        if (emissiveScale) {
                            if (emissiveScale instanceof cc.Vec3) {
                                fxmtl.Emissive[0] *= emissiveScale.x;
                                fxmtl.Emissive[1] *= emissiveScale.y;
                                fxmtl.Emissive[2] *= emissiveScale.z;
                            }
                            else {
                                fxmtl.Emissive[0] *= emissiveScale;
                                fxmtl.Emissive[1] *= emissiveScale;
                                fxmtl.Emissive[2] *= emissiveScale;
                            }
                        }
                    }
                    tex = mmtl.getProperty('emissiveMap', 0);
                    if (tex !== null && isValidTextureFormat(tex)) {
                        const asset = tex.mipmaps[0];
                        if (asset !== null) {
                            if (asset._uuid.search('@') !== -1) {
                                fxmtl.EmissiveMap = asset._uuid + asset._native;
                            }
                            else {
                                fxmtl.EmissiveMap = asset._uuid;
                            }
                        }
                    }
                }
                fxmesh.MaterialBuffer.push(fxmtl);
            }
        }
        else {
            const fxmtl = new LFX_Material();
            fxmtl.Diffuse[0] = 1;
            fxmtl.Diffuse[1] = 1;
            fxmtl.Diffuse[2] = 1;
            fxmesh.MaterialBuffer.push(fxmtl);
        }
        if (missLightmapUV) {
            if (this.Baker.World.Settings.BakeLightMap) {
                const filename = await Editor.Message.request('asset-db', 'query-path', mesh._uuid);
                if (filename) {
                    console.error('Error: missing lightmap uv, ' + filename);
                }
                else {
                    console.error('Error: missing lightmap uv, ' + mesh._uuid);
                }
            }
        }
        else if (errorLightmapUV) {
            if (this.Baker.World.Settings.BakeLightMap) {
                const filename = await Editor.Message.request('asset-db', 'query-path', mesh._uuid);
                if (filename) {
                    console.error('Error: error lightmap uv, ' + filename);
                }
                else {
                    console.error('Error: error lightmap uv, ' + mesh._uuid);
                }
            }
            fxmesh.LightMapSize = 0;
        }
        this.Baker.World.Meshes.push(fxmesh);
        this.Models.push(model);
        this._numObjects++;
        if (fxmesh.LightMapSize > 0) {
            this._numTriangles += fxmesh.TriangleBuffer.length;
        }
    }
    _exportLight(light) {
        const fxlight = new LFX_Light();
        fxlight.Type = LFX_Light.DIRECTION;
        fxlight.GIEnable = true;
        fxlight.CastShadow = light.staticSettings.castShadow;
        fxlight.Position[0] = light.node.getWorldPosition().x;
        fxlight.Position[1] = light.node.getWorldPosition().y;
        fxlight.Position[2] = light.node.getWorldPosition().z;
        const dir = new cc.Vec3(0, 0, -1);
        cc.Vec3.transformQuat(dir, dir, light.node.getWorldRotation());
        fxlight.Direction[0] = dir.x;
        fxlight.Direction[1] = dir.y;
        fxlight.Direction[2] = dir.z;
        fxlight.Color[0] = light.color.x;
        fxlight.Color[1] = light.color.y;
        fxlight.Color[2] = light.color.z;
        const _lightMeterScale = 10000.0;
        if (light instanceof cc.DirectionalLight) {
            const l = light;
            fxlight.Type = LFX_Light.DIRECTION;
            fxlight.Illuminance = l.illuminance;
            if (this.MainLight === null) {
                this.MainLight = light;
            }
        }
        else if (light instanceof cc.SphereLight) {
            const l = light;
            fxlight.Type = LFX_Light.POINT;
            fxlight.Size = l.size;
            fxlight.Range = l.range;
            fxlight.AttenFallOff = 1;
            fxlight.Illuminance = l.luminance;
            if (cc.director.root.pipeline.pipelineSceneData.isHDR) {
                fxlight.Illuminance *= _lightMeterScale;
            }
        }
        else if (light instanceof cc.SpotLight) {
            const l = light;
            fxlight.Type = LFX_Light.SPOT;
            fxlight.Size = l.size;
            fxlight.Range = l.range;
            fxlight.AttenFallOff = 1;
            fxlight.SpotInner = Math.cos(l.spotAngle / 4 * (Math.PI / 180.0));
            fxlight.SpotOuter = Math.cos(l.spotAngle / 2 * (Math.PI / 180.0));
            fxlight.SpotFallOff = 1;
            fxlight.Illuminance = l.luminance;
            if (cc.director.root.pipeline.pipelineSceneData.isHDR) {
                fxlight.Illuminance *= _lightMeterScale;
            }
        }
        else {
            return;
        }
        if (light.node.mobility === cc.MobilityMode.Static) {
            fxlight.DirectScale = 1;
            fxlight.IndirectScale = 1;
        }
        else {
            fxlight.DirectScale = 0;
            fxlight.IndirectScale = 1;
        }
        this.Baker.World.Lights.push(fxlight);
        this.Lights.push(light);
        this._numLights++;
    }
    _exportCamera(camera) {
        if (this.MainCamera === null) {
            this.MainCamera = camera;
        }
        else if (camera.node.name === 'MainCamera') {
            this.MainCamera = camera;
        }
    }
    _exportLightProbes(scene) {
        if (scene.globals.lightProbeInfo.data === null) {
            return;
        }
        for (const probe of scene.globals.lightProbeInfo.data.probes) {
            const lfxLightProbe = new LFX_LightProbe;
            lfxLightProbe.Position[0] = probe.position.x;
            lfxLightProbe.Position[1] = probe.position.y;
            lfxLightProbe.Position[2] = probe.position.z;
            lfxLightProbe.Normal[0] = probe.normal.x;
            lfxLightProbe.Normal[1] = probe.normal.y;
            lfxLightProbe.Normal[2] = probe.normal.z;
            this.Baker.World.LightProbes.push(lfxLightProbe);
        }
    }
    _run() {
        let lfx_launching = false;
        let lfx_port = 3000;
        // 获取端口
        {
            lfx_port = 0;
            getPort((err, port) => {
                if (!err) {
                    lfx_port = port;
                }
                else {
                    lfx_port = -1;
                    console.log('Configure port failed');
                }
            });
        }
        console.log('Start baker server ' + lfx_port);
        // 定时器模拟更新
        this._timer = setInterval(() => {
            if (!lfx_launching) {
                if (lfx_port > 0) {
                    this.Baker.Launch(lfx_port);
                    // 启动烘焙程序 (调试模式从c++启动)
                    {
                        const LFX_URL = 'http://127.0.0.1:' + lfx_port;
                        const LFX_SERVER = this.Baker.lfxpath + '/LightFX';
                        console.log('Launching ' + LFX_SERVER);
                        this._process = exec__default['default'].execFile(LFX_SERVER, [LFX_URL], { cwd: this._uploadPath }, (err, stdout, stderr) => {
                            // TODO 确认为什么要用 kill 退出进程，kill 退出会报 err
                            if (err && err.signal !== 'SIGKILL') {
                                this.Baker.Error = true;
                                console.error(err);
                                console.error('Baker app aborted with an exception');
                                this.Baker.Stop();
                                clearInterval(this._timer);
                                this.Baker.Close();
                                this._timer = null;
                                this.Baker.emit('end', true);
                                this._process.kill('SIGKILL');
                            }
                        });
                        if (!this._process) {
                            console.log('Launching baker failed.');
                            clearInterval(this._timer);
                        }
                    }
                    lfx_launching = true;
                }
                else if (lfx_port < 0) {
                    // error
                    clearInterval(this._timer);
                }
                return;
            }
            if (this.Baker.closed) {
                clearInterval(this._timer);
                return;
            }
            if (!this.Baker.Started) {
                // 开始烘培
                if (this.Baker.connected) {
                    this.Baker.Start();
                    this.Baker.client.on('Tick', (data) => {
                        this._lastTicks = this._currentTicks;
                    });
                }
            }
            else {
                // 结束了
                if (this.Baker.Finished) {
                    console.log('End');
                    let file = null;
                    try {
                        file = this.Baker.Download();
                    }
                    catch (error) {
                        console.error('LightFX get result file failed.');
                        file = null;
                    }
                    const bakeStats = 'Bake scene stats:\n' +
                        '\tobjects ' + this._numObjects + '\n' +
                        '\tlights ' + this._numLights + '\n' +
                        '\ttriangles ' + this._numTriangles + '\n';
                    this.Baker.emit('log', bakeStats);
                    if (file !== null) {
                        // 模型的Lightmap信息
                        for (let i = 0; i < file.MeshInfos.length; ++i) {
                            // 对应output/LFX_Mesh_xxxx.png
                            const info = file.MeshInfos[i];
                            const logInfo = 'Mesh ' +
                                info.Id +
                                ':' +
                                ' Index(' +
                                info.Index +
                                ') ' +
                                ' Offset(' +
                                info.Offset[0] +
                                ', ' +
                                info.Offset[1] +
                                ') ' +
                                ' Scale(' +
                                info.Scale[0] +
                                ', ' +
                                info.Scale[1] +
                                ')';
                            this.Baker.emit('log', logInfo);
                        }
                        // LightProbe信息
                        for (let i = 0; i < file.LightProbeInfos.length; ++i) {
                            const info = file.LightProbeInfos[i];
                            const logInfo = 'LightProbe ' + i + ':' +
                                ' pos(' +
                                info.Position[0] + ', ' +
                                info.Position[1] + ', ' +
                                info.Position[2] + ')' +
                                ' coef(' +
                                info.Coefficients[0] + ', ' +
                                info.Coefficients[1] + ', ' +
                                info.Coefficients[2] + ', ...)';
                            this.Baker.emit('log', logInfo);
                        }
                    }
                    this.Baker.Stop();
                    clearInterval(this._timer);
                    this.Baker.Close();
                    this._timer = null;
                    this.Baker.emit('end', true);
                    if (this._process !== null) {
                        this._process.kill('SIGKILL');
                        this._process = null;
                    }
                    if (this.Baker.World.Settings.BakeLightMap) {
                        const scene = this.Scene?.scene;
                        if (this.Scene != null) {
                            LFX_App.DirtyBaked(this.Scene);
                        }
                        for (const t of this.Terrains) {
                            if (t.lightMapSize > 0) {
                                t._resetLightmap(true);
                            }
                        }
                        if (scene && this.MainLight && this.MainLight.node &&
                            this.MainLight.node.mobility == cc.MobilityMode.Stationary) {
                            scene.globals.bakedWithStationaryMainLight = true;
                        }
                        if (scene) {
                            scene.globals.bakedWithHighpLightmap = this.Baker.World.Settings.Highp;
                        }
                    }
                    if (file !== null && this.Baker.World.Settings.BakeLightProbe) {
                        const scene = this.Scene?.scene;
                        if (!scene || !scene.globals
                            || !scene.globals.lightProbeInfo
                            || !scene.globals.lightProbeInfo.data
                            || !scene.globals.lightProbeInfo.data.probes) {
                            console.warn('No light probes were found in the scene and cannot be baked.');
                        }
                        else if ( scene.globals.lightProbeInfo.data.probes.length !== file.LightProbeInfos.length) {
                            scene.globals.lightProbeInfo.data.probes.length = file.LightProbeInfos.length;
                            for (let i = 0; i < scene.globals.lightProbeInfo.data.probes.length; ++i) {
                                const info = file.LightProbeInfos[i];
                                const pos = new cc.Vec3(info.Position[0], info.Position[1], info.Position[2]);
                                const normal = new cc.Vec3(info.Normal[0], info.Normal[1], info.Normal[2]);
                                scene.globals.lightProbeInfo.data.probes[i] = new cc.Vertex(pos);
                                const probe = scene.globals.lightProbeInfo.data.probes[i];
                                if (info && probe) {
                                    probe.normal = normal;
                                    probe.coefficients.length = info.Coefficients.length / 3;
                                    for (let j = 0; j < probe.coefficients.length; ++j) {
                                        probe.coefficients[j] = new cc.Vec3();
                                        probe.coefficients[j].x = info.Coefficients[j * 3 + 0];
                                        probe.coefficients[j].y = info.Coefficients[j * 3 + 1];
                                        probe.coefficients[j].z = info.Coefficients[j * 3 + 2];
                                    }
                                    cce.Engine.repaintInEditMode();
                                    cce.SceneFacadeManager.recordNode(scene);
                                    cce.SceneFacadeManager.snapshot();
                                }
                            }
                        }
                        else {
                            if (file.LightProbeInfos.length === scene.globals.lightProbeInfo.data?.probes.length) {
                                if (this.Baker.World.Settings.BakeLightProbe && scene.globals.lightProbeInfo.data) {
                                    for (let i = 0; i < scene.globals.lightProbeInfo.data.probes.length; ++i) {
                                        const info = file.LightProbeInfos[i];
                                        const probe = scene.globals.lightProbeInfo.data.probes[i];
                                        if (info && probe) {
                                            probe.coefficients.length = info.Coefficients.length / 3;
                                            for (let j = 0; j < probe.coefficients.length; ++j) {
                                                probe.coefficients[j] = new cc.Vec3();
                                                probe.coefficients[j].x = info.Coefficients[j * 3 + 0];
                                                probe.coefficients[j].y = info.Coefficients[j * 3 + 1];
                                                probe.coefficients[j].z = info.Coefficients[j * 3 + 2];
                                            }
                                        }
                                    }
                                    cce.Engine.repaintInEditMode();
                                    cce.SceneFacadeManager.recordNode(scene);
                                    cce.SceneFacadeManager.snapshot();
                                }
                            }
                            else {
                                console.error('Light probe bake result mismatch with scene.');
                            }
                        }
                    }
                    if (file !== null && this.Baker.World.Settings.BakeLightMap) {
                        readImageList(ps.join(this._uploadPath, 'output'), false, (objs) => {
                            // 地形的Lightmap信息
                            for (const info of file.TerrainInfos) {
                                // 对应output/LFX_Terrain_xxxx.png
                                const terrain = this.Terrains[info.Id];
                                const filename = 'LFX_Terrain_' + this.Index2Str(info.Index) + '.png';
                                const obj = objs[filename];
                                if (!obj) {
                                    continue;
                                }
                                const tex = obj.texture;
                                if (tex) {
                                    terrain._updateLightmap(info.BlockId, tex, info.Offset[0], info.Offset[1], info.Scale[0], info.Scale[1]);
                                }
                                else {
                                    terrain._updateLightmap(info.BlockId, null, info.Offset[0], info.Offset[1], info.Scale[0], info.Scale[1]);
                                }
                                // 记录到 undo
                                Editor.Message.broadcast('scene:change-node', terrain.node.uuid);
                            }
                            // 模型的lightmap
                            for (const info of file.MeshInfos) {
                                // 对应output/LFX_Mesh_xxxx.png
                                const model = this.Models[info.Id];
                                const filename = 'LFX_Mesh_' + this.Index2Str(info.Index) + '.png';
                                const obj = objs[filename];
                                if (!obj) {
                                    continue;
                                }
                                const tex = obj.texture;
                                if (tex) {
                                    model._updateLightmap(tex, info.Offset[0], info.Offset[1], info.Scale[0], info.Scale[1]);
                                    // @ts-ignore
                                    model.node._dirtyFlags = 1;
                                }
                                else {
                                    model._updateLightmap(null, info.Offset[0], info.Offset[1], info.Scale[0], info.Scale[1]);
                                }
                                if (model.node) {
                                    const compIndex = model.node.components.indexOf(model);
                                    nodeMgr.emit('change', model.node, { type: NodeOperationType.SET_PROPERTY, propPath: `__comps__.${compIndex}.bakeSettings` });
                                }
                            }
                            image.Profile.setLatestLightmapResults(this.Scene.uuid, Object.values(objs).map(item => item.uuid).filter(Boolean));
                            image.Profile.setLatestLightmapResultsDir(this.Scene.uuid, this._uploadPath);
                            cce.Engine.repaintInEditMode();
                        });
                    }
                }
            }
            this._currentTicks += 100;
        }, 100);
    }
}

class Lightmap {
    constructor() {
        // 当前场景
        this.scene = null;
        this.renderScene = null;
        this._startBakerTim = 0;
    }
    init() {
        this.lfxApp = new LFX_App();
        this.lfxApp.Baker.on('login', (data) => {
            console.debug('lightFX output info: login', data);
            this._startBakerTim = new Date().getTime();
            if (this.lfxApp?.Baker.World.Settings.BakeLightMap) {
                Editor.Message.broadcast('lightmap:start');
            }
            if (this.lfxApp?.Baker.World.Settings.BakeLightProbe) {
                Editor.Message.broadcast('lightmap:light-probe-start');
            }
        });
        this.lfxApp.Baker.on('log', (data) => {
            console.debug('lightFX output info: log', data);
            if (this.lfxApp?.Baker.World.Settings.BakeLightMap) {
                Editor.Message.broadcast('lightmap:log', data);
            }
            if (this.lfxApp?.Baker.World.Settings.BakeLightProbe) {
                Editor.Message.broadcast('lightmap:light-probe-log', data);
            }
        });
        this.lfxApp.Baker.on('progress', (data) => {
            console.debug('lightFX output info: progress', data);
            if (this.lfxApp?.Baker.World.Settings.BakeLightMap) {
                Editor.Message.broadcast('lightmap:progress', data);
            }
            if (this.lfxApp?.Baker.World.Settings.BakeLightProbe) {
                Editor.Message.broadcast('lightmap:light-probe-progress', data);
            }
        });
        this.lfxApp.Baker.on('fineshed', (data) => {
            console.debug('lightFX output info: fineshed', data);
            if (this.lfxApp?.Baker.World.Settings.BakeLightMap) {
                Editor.Message.broadcast('lightmap:finished');
            }
            if (this.lfxApp?.Baker.World.Settings.BakeLightProbe) {
                Editor.Message.broadcast('lightmap:light-probe-finished');
                this.scene?.globals.lightProbeInfo.onProbeBakeFinished();
            }
        });
        this.lfxApp.Baker.on('end', (data) => {
            console.debug('lightFX output info: end', data);
            if (this.lfxApp?.Baker.World.Settings.BakeLightMap) {
                Editor.Message.broadcast('lightmap:end', data);
                // 光源数量 埋点
                this.reportLightMap('A100002', this.lfxApp?.Baker.World.Lights.length);
                // 烘焙时间记录 埋点 单位分钟
                const endBakerTim = Number(((new Date().getTime() - this._startBakerTim) / 1000 / 60).toFixed(2));
                this.reportLightMap('A100000', endBakerTim);
            }
            if (this.lfxApp?.Baker.World.Settings.BakeLightProbe) {
                Editor.Message.broadcast('lightmap:light-probe-end', data);
            }
            cce.Engine.repaintInEditMode();
        });
        this.lfxApp.Baker.on('cancel', (data) => {
            console.debug('lightFX output info: cancel', data);
            if (this.lfxApp?.Baker.World.Settings.BakeLightMap) {
                Editor.Message.broadcast('lightmap:cancel', data);
            }
            if (this.lfxApp?.Baker.World.Settings.BakeLightProbe) {
                Editor.Message.broadcast('lightmap:light-probe-cancel', data);
            }
        });
        // 加载场景
        this.scene = cc__default['default'].director.getScene();
        cce.Scene.on('open', this.onLoadScene.bind(this));
        cce.Scene.on('reload', this.onLoadScene.bind(this));
    }
    reportLightMap(id, value) {
        const eventValue = {};
        eventValue[id] = value;
        Editor.Metrics.trackEvent({
            sendToNewCocosAnalyticsOnly: true,
            category: 'bakingSystem',
            value: eventValue,
        });
    }
    onLoadScene(scene) {
        this.scene = scene;
        this.renderScene = this.scene.renderScene;
    }
    async apply(data, appPath) {
        if (!fs__default['default'].existsSync(data.path)) {
            fs__default['default'].mkdirSync(data.path);
        }
        appPath && (this.lfxApp.Baker.lfxpath = ps__default['default'].join(appPath, '../tools/lightmap-tools'));
        this.lfxApp.Init(data);
        await this.bake();
    }
    clear() {
        LFX_App.Reset(this.scene);
        cce.Engine.repaintInEditMode();
    }
    async bake() {
        await this.lfxApp.BakeLightMap(this.scene);
    }
    cancel() {
        this.lfxApp.Cancel();
    }
    bakeLightProbe(data, appPath) {
        if (!fs__default['default'].existsSync(data.path)) {
            fs__default['default'].mkdirSync(data.path);
        }
        appPath && (this.lfxApp.Baker.lfxpath = ps__default['default'].join(appPath, '../tools/lightmap-tools'));
        this.lfxApp.Init(data);
        this.lfxApp.BakeLightProbe(this.scene);
        try {
            if (this.scene && this.scene.globals.lightProbeInfo && this.scene.globals.lightProbeInfo.data && this.scene.globals.lightProbeInfo.data.probes) {
                const probes = this.scene.globals.lightProbeInfo.data.probes.length;
                Editor.Metrics._trackEventWithTimer({
                    category: 'bakingSystem',
                    id: 'A100010',
                    value: probes,
                });
            }
        }
        catch (error) {
            console.debug(error);
        }
    }
    cancelLightProbe() {
        this.lfxApp.Cancel();
    }
}
var lightMap = new Lightmap();

// 模块加载的时候触发的函数
function load() {
    lightMap.init();
}
// 模块卸载的时候触发的函数
function unload() { }
// 模块内定义的方法
const methods = {
    async apply(data, appPath) {
        await lightMap.apply(data, appPath);
    },
    cancel() {
        lightMap.cancel();
    },
    clear() {
        lightMap.clear();
    },
    bakeLightProbe(data, appPath) {
        lightMap.bakeLightProbe(data, appPath);
    },
    cancelLightProbe() {
        lightMap.cancelLightProbe();
    },
};

exports.load = load;
exports.methods = methods;
exports.unload = unload;
