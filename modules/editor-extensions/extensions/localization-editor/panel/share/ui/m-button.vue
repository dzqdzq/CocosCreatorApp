<template>
    <ui-button
        class="button"
        :transparent="transparent"
        :border="hasBorder"
        :color="color"
        :disabled="disabled">
        <slot></slot>
    </ui-button>
</template>

<script lang="ts">
export default {
    props: {
        transparent: {
            type: Boolean,
            required: false,
            default: true,
        },
        hasBorder: {
            type: Boolean,
            required: false,
            default: false,
        },
        color: {
            type: String,
            required: false,
            default: 'white',
        },
        disabled: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
};
</script>
<style scoped lang="less">
ui-button.button {
    height: 24px;
    border: 1px solid inherit;

    &[disabled] {
        opacity: 1;
    }

    &>ui-label {
        height: 100%;
    }

    &[color='blue'] {
        background-color: @blue-color;

        color: @blue-color ;
        border-color: @blue-color;

        &:hover {

            color: @strong-white-color ;
            background-color: @black-blue-color;

        }

        &:active {

            color: @strong-white-color ;
            background-color: @bright-blue-color;

        }

        &[disabled] {
            &[transparent] {
                background-color: transparent;
                &:not([border=true]){
                    border-color: transparent;
                }
            }

            border-color: @blackest-blue-color;
            background-color: @black-blue-color;
            color: @blackest-blue-color ;
        }
    }

    &[color='white'] {
        border-color: @gray-color;
        color: @white-color ;

        &:hover {
            background-color: @weak-gray-color;
        }

        &:active {
            background-color: @weaker-white-color;
        }

        &[disabled] {
            &[transparent] {
                background-color: transparent;
                &:not([border=true]){
                    border-color: transparent;
                }
            }
            background-color: @gray-color;
            color: @weak-gray-color ;
            border-color: @gray-color;
        }
    }

    &[transparent] {
        background-color: transparent;
    }

    &[border='false'] {
        border-color: transparent;
    }
}
</style>
