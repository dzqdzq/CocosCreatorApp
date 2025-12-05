<template>
    <div class="mProcess">
        <div
            class="content"
            :style="{ width: value*100 + '%' }"
            :color="color"></div>
    </div>
</template>

<script lang="ts">
export default {
    props: {
        value: Number,
        color: {
            type: String,
            default: 'blue',
        },
    },
};
</script>

<style scoped lang="less">
div.mProcess {
    height: 4px;
    background-color: @weak-gray-color;
    border-radius: 12px;
    & > div.content {
        height: 100%;
        border-radius: 12px;
        &[color="pink"] {
            background-color: @pink-color;
        }
        &[color="blue"] {
            background-color: @blue-color;
        }
        &[color="yellow"] {
            background-color: @yellow-color;
        }
    }
}
</style>
