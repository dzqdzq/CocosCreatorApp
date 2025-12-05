<template>
    <div
        class="mIcon"
        :border="hasBorder"
        :background="background">
        <slot>
            <ui-icon :value="value"></ui-icon>
        </slot>
    </div>
</template>

<script>
export default {
    props: {
        value: {
            type: String,
            required: false,
        },
        hasBorder: {
            type: Boolean,
            required: false,
            default: false,
        },
        background: {
            type: Boolean,
            required: false,
            default: true,
        },
    },
};
</script>

<style scoped lang="less">
div.mIcon {
    user-select: none;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    color: @bit-weak-white-color;
    border: 1px solid;

    &:hover {
        background-color: @weak-gray-color;
        border-color: @weak-gray-color;
        cursor: pointer;
    }
    &:active {
        background-color: @weaker-white-color;
        border-color: @weaker-white-color;
        cursor: pointer;
    }
    &[disabled="true"] {
        background-color: @strong-gray-color;
        color: @weak-gray-color;
    }
    &[background="false"] {
        background-color: transparent;
    }
    &[border="false"] {
        border-color: transparent;
    }
}
</style>
