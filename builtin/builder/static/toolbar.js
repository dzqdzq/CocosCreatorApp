"use strict";exports.style=`
:host {
    display: flex;
    margin-right: 8px;
}

.open-builder {
    height: 24px;
    padding: 0 6px;
    border-color: var(--color-default-border);
    border-radius: calc(var(--size-normal-radius) * 2px);
}

.open-builder>ui-button:hover{
    background-color: var(--color-hover-fill-weaker);
    color: var(--color-normal-contrast);
}


.builder-operation > ui-button > svg {
    width: 14px;
    position: relative;
    top: 1px;
    vertical-align: text-top;
}
`,exports.template=`
<div class="builder-operation">
    <ui-button class="open-builder transparent">
        <ui-icon value="builder"></ui-icon>
        <ui-label value="i18n:builder.title"></ui-label>
    </ui-button>
</div>
`,exports.$={builder:".open-builder",wrap:".builder-operation"},exports.ready=function(){this.$.wrap.addEventListener("dblclick",r=>{r.stopPropagation()}),this.$.builder.addEventListener("click",()=>{Editor.Panel.open("builder")})};