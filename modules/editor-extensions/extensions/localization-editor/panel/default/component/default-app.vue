<template>
    <Suspense>
        <template #default>
            <div>
                <Home v-show="tabIndex === 0" @translate="onTranslateClick"></Home>
                <Translate
                    v-if="tabIndex === 1"
                    :target-locale="targetLocale"
                    @home="onHomeClick"></Translate>
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
import HOME from './panel/default-home.vue';
import { onMounted, onUnmounted, ref } from 'vue';
import Translate from './panel/default-translate.vue';
import { eventBus } from '../index';
import { CustomError } from '../../../src/core/error/Errors';

export default {
    components: {
        Home: HOME,
        Translate,
    },
    setup() {
        const targetLocale = ref('');
        const tabIndex = ref(0);
        function onError(customError: CustomError) {
            Editor.Dialog.error(customError.message);
            console.error(customError);
        }
        onMounted(() => {
            eventBus.on('onCustomError', onError);
        });
        onUnmounted(() => {
            eventBus.off('onCustomError', onError);
        });
        return {
            tabIndex,
            targetLocale,
            onTranslateClick(language: string) {
                targetLocale.value = language;
                tabIndex.value = 1;
            },
            onHomeClick() {
                eventBus.emit('updateAllLanguageConfig');
                tabIndex.value = 0;
            },
        };
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
