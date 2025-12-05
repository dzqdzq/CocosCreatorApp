"use strict";var __createBinding=this&&this.__createBinding||(Object.create?function(e,t,r,i){void 0===i&&(i=r),Object.defineProperty(e,i,{enumerable:!0,get:function(){return t[r]}})}:function(e,t,r,i){void 0===i&&(i=r),e[i]=t[r]}),__setModuleDefault=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),__importStar=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&__createBinding(t,e,r);return __setModuleDefault(t,e),t},__importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0});const vue_1=__importDefault(require("vue/dist/vue")),shader_1=__importStar(require("../shader")),vs=shader_1.glsl`
attribute vec2 a_position;
attribute vec2 a_texCoord;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

void main() {
    // convert the rectangle from pixels to 0.0 to 1.0
    vec2 zeroToOne = a_position / u_resolution;

    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

    // pass the texCoord to the fragment shader
    // The GPU will interpolate this value between points.
    v_texCoord = a_texCoord;
}
`,fs=shader_1.glsl`
precision mediump float;

// our texture
uniform sampler2D u_image;
uniform bool u_r;
uniform bool u_g;
uniform bool u_b;
// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    vec4 result = vec4(0, 0, 0, 1);
    if (u_r) {
        result.r = color.r;
        if (!u_g && !u_b) {
            result.g = color.r;
            result.b = color.r;
        }
    }
    if (u_g) {
        result.g = color.g;
        if (!u_r && !u_b) {
            result.r = color.g;
            result.b = color.g;
        }
    }
    if (u_b) {
        result.b = color.b;
        if (!u_r && !u_g) {
            result.r = color.b;
            result.g = color.b;
        }
    }
    gl_FragColor = result;
}
`;exports.default=vue_1.default.extend({template:'\n    <div>\n        <canvas ref="canvas">\n        </canvas>\n    </div>\n    ',data:()=>({gl:null,canvas:null,shader:null,image:null,textureBuffer:null,positionBuffer:null,texCoordsBuffer:null}),props:{channel:{type:String,default:"rgb"},src:{type:String}},watch:{src(e,t){this.update()},channel(e){this.textureBuffer&&this.gl&&this.gl.isTexture(this.textureBuffer)&&this.render()}},methods:{init(e){const t=this.canvas;t.width=e.width,t.height=e.height;const r=this.gl,i=(this.shader=new shader_1.default(r,vs,fs)).program,s=r.getAttribLocation(i,"a_position"),o=r.getAttribLocation(i,"a_texCoord");this.positionBuffer=this.positionBuffer||r.createBuffer(),r.bindBuffer(r.ARRAY_BUFFER,this.positionBuffer),r.bufferData(r.ARRAY_BUFFER,new Float32Array([0,0,t.width,0,0,t.height,0,t.height,t.width,0,t.width,t.height]),r.DYNAMIC_DRAW),r.vertexAttribPointer(s,2,r.FLOAT,!1,0,0),this.texCoordsBuffer=this.texCoordsBuffer||r.createBuffer(),this.textureBuffer||(this.textureBuffer=r.createBuffer(),r.bindBuffer(r.ARRAY_BUFFER,this.texCoordsBuffer),r.bufferData(r.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),r.STATIC_DRAW)),r.vertexAttribPointer(o,2,r.FLOAT,!1,0,0),this.releaseTextureBuffer(),this.textureBuffer=this.generateTexture(r,e),this.activeTexture(r,this.textureBuffer),r.enableVertexAttribArray(s),r.enableVertexAttribArray(o)},render(){const e=this.gl;e.viewport(0,0,e.canvas.width,e.canvas.height),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),this.shader.use(),this.shader.setVec2("u_resolution",e.canvas.width,e.canvas.height),this.shader.setUniform("u_r",this.channel.includes("r")),this.shader.setUniform("u_g",this.channel.includes("g")),this.shader.setUniform("u_b",this.channel.includes("b")),e.drawArrays(e.TRIANGLES,0,6)},activeTexture(e,t,r=e.TEXTURE0){e.activeTexture(r),e.bindTexture(e.TEXTURE_2D,t),e.activeTexture(e.TEXTURE0)},loadImage(e,t){const r=new Image;return r.onload=t,r.src=e,r},releaseTextureBuffer(){this.gl&&this.textureBuffer instanceof WebGLTexture&&this.gl.isTexture(this.textureBuffer)&&this.gl.deleteTexture(this.textureBuffer)},generateTexture(e,t){const r=e.createTexture();return e.bindTexture(e.TEXTURE_2D,r),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.NEAREST),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,t),r},update(){const e=this.loadImage(this.src,()=>{this.init(e),this.render()})}},mounted(){this.canvas=this.$refs.canvas,(this.gl=this.canvas.getContext("webgl"))?this.update():alert("无法初始化WebGL，你的浏览器、操作系统或硬件等可能不支持WebGL。")},beforeDestroy(){this.gl&&(this.positionBuffer instanceof WebGLBuffer&&this.gl.isBuffer(this.positionBuffer)&&this.gl.deleteBuffer(this.positionBuffer),this.textureBuffer instanceof WebGLBuffer&&this.gl.isBuffer(this.textureBuffer)&&this.gl.deleteBuffer(this.textureBuffer)),this.releaseTextureBuffer()}});