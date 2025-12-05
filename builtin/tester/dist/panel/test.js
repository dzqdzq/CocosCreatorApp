"use strict";module.exports={template:`
        <div class="test">
            <ui-button class="test-button" active="true">Button</ui-button>
            <ui-input class="test-input"></ui-input>
        </div>
    `,style:`
        .test { padding: 20px; }
    `,$:{testButton:".test-button",testInput:".test-input"},listeners:{},messages:{},methods:{},async ready(){this.$.testInput.addEventListener("keydown",t=>{console.log("keydown")}),this.$.testInput.addEventListener("keypress",t=>{console.log("keypress")}),this.$.testInput.addEventListener("keyup",t=>{console.log("keyup")}),this.$.testInput.addEventListener("change",t=>{console.log("change")}),this.$.testInput.addEventListener("confirm",t=>{console.log("confirm")})},close(){}};