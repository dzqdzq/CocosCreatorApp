"use strict";var __importDefault=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(exports,"__esModule",{value:!0});const fs_1=require("fs"),path_1=require("path"),shader_1=__importDefault(require("../../shader")),glsl=e=>e,vue_1=__importDefault(require("vue/dist/vue"));exports.default=vue_1.default.extend({template:fs_1.readFileSync(path_1.join(__dirname,"../../../static/template/rgb-image.html"),"utf-8"),props:{src:{type:String}},data:()=>({gl:null,canvas:null,shader:null,fs:glsl`
            precision mediump float;
            #pragma vscode_glsllint_stage : frag //pragma to set STAGE to 'frag'
            // our texture
            uniform sampler2D u_image;
            // 显示第几个通道
            uniform int u_index;
            // the texCoords passed in from the vertex shader.
            varying vec2 v_texCoord;
            
            void main() {
                vec4 color = texture2D(u_image, v_texCoord);
                vec4 result = vec4(0,0,0,color.a);
                for(int i = 0; i < 3; i++) {
                    if(i == u_index) {
                        result[i]=color[i];
                        if(result[i] == 0.0){
                            result.a = 0.0;
                        }
                        continue;
                    }
                }
                gl_FragColor = result;
            }
            `,vs:glsl`
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
            `}),mounted(){if(this.canvas=this.$refs.canvas,!(this.gl=this.canvas.getContext("webgl")))return void console.error("无法初始化WebGL，你的浏览器、操作系统或硬件等可能不支持WebGL。");const e=new Image;e.onload=(()=>{console.log("onload"),this.init(e),this.renderMyTexture(e)}),e.src=this.src},methods:{init(e){const t=this.canvas,r=this.gl;t.width=e.width,t.height=e.height;const i=(this.shader=new shader_1.default(r,this.vs,this.fs)).program,o=r.getAttribLocation(i,"a_position"),a=r.getAttribLocation(i,"a_texCoord"),s=r.createBuffer();r.bindBuffer(r.ARRAY_BUFFER,s),r.bufferData(r.ARRAY_BUFFER,new Float32Array([0,0,e.width,0,0,e.height,0,e.height,e.width,0,e.width,e.height]),r.STATIC_DRAW),r.vertexAttribPointer(o,2,r.FLOAT,!1,0,0);const n=r.createBuffer();r.bindBuffer(r.ARRAY_BUFFER,n),r.bufferData(r.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),r.STATIC_DRAW),r.vertexAttribPointer(a,2,r.FLOAT,!1,0,0);const l=r.createTexture();r.bindTexture(r.TEXTURE_2D,l),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MAG_FILTER,r.NEAREST),r.texImage2D(r.TEXTURE_2D,0,r.RGBA,r.RGBA,r.UNSIGNED_BYTE,e),r.enableVertexAttribArray(o),r.enableVertexAttribArray(a)},renderMyTexture(e){const t=this.gl;t.viewport(0,0,t.canvas.width,t.canvas.height),t.clearColor(0,0,0,0),t.clear(t.COLOR_BUFFER_BIT),this.shader.use(),this.shader.setVec2("u_resolution",t.canvas.width,t.canvas.height),t.drawArrays(t.TRIANGLES,0,6)}}});