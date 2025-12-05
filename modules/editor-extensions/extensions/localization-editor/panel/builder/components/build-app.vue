<template>
    <Suspense>
        <template #default>
            <div>
                <Home></Home>
            </div>
        </template>
        <template #fallback>
            <div class="fallback">
                <ui-loading></ui-loading>
            </div>
        </template>
    </Suspense>
</template>

<script lang="ts">
import { onMounted, onUnmounted } from 'vue';
import HOME from './build-home.vue';
import { eventBus } from '..';
import type { CustomError } from '../../../src/core/error/Errors';
export default {
    components: {
        Home: HOME,
    },
    setup(){
        function onError(customError: CustomError){
            console.error(customError);
        }
        onMounted(() => {
            eventBus.on('onCustomError', onError);
        });

        onUnmounted(() => {
            eventBus.off('onCustomError', onError);
        });
    },
    
};
</script>
<style lang="less" scoped>
div {
    &.fallback {
        background-color: @dark-color;
        width: 100%;
        height: 100%;
        position: absolute;
        display: flex;

        &>ui-loading {
            left: 0;
            right: 0;
            margin: auto;
            text-align: center;
        }
    }
}
</style>
