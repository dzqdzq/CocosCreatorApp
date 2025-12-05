<template>
    <div
        class="mInput"
        :readonly="isReadOnly"
        tabindex="0"
        :isSelected="isSelected"
        :error="error"
        :isEditing="isEditing"
        @blur="onBlur"
        @focus="onFocus"
        @click="onClick">
        <input
            v-show="!isTextarea"
            ref="inputElement"
            :placeholder="placeholder"
            :value="modelValue"
            :readonly="isReadOnly"
            :type="type"
            @input="onInput"
            @focus="onFocus"
            @blur="onBlur" />
        <textarea
            v-show="isTextarea"
            ref="textareaElement"
            :placeholder="placeholder"
            :value="modelValue"
            rows="1"
            :readonly="isReadOnly"
            :type="type"
            @focus="onFocus"
            @input="onInput"
            @blur="onBlur">
        </textarea>
        <div class="icon">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts">
import { ref, computed } from 'vue';
export default {
    props: {
        modelValue: String,
        readonly: Boolean,
        type: String,
        isTextarea: Boolean,
        placeholder: String,
        error: Boolean,
    },
    emits: ['blur', 'update:modelValue'],
    setup: (props, { emit }) => {
        const isReadOnly = computed(() => {
            if (props.isTextarea) {
                return props.readonly || !isEditing.value;
            } else {
                return props.readonly;
            }
        });
        const isSelected = ref(false);
        const isEditing = ref(false);
        const inputElement = ref(null as HTMLInputElement | null);
        const textareaElement = ref(null as HTMLTextAreaElement | null);
        const labelElement = ref(null as HTMLElement | null);
        function onClick(event: InputEvent) {
            if (!isSelected.value) {
                isSelected.value = true;
            } else {
                isEditing.value = true;
                focus();
            }
        }
        function onInput(event: { target: { value: any } }) {
            if (props.isTextarea && textareaElement.value) {
                textareaElement.value.style.height = '16px';
                textareaElement.value.style.height = textareaElement.value.scrollHeight + 'px';
            }
            emit('update:modelValue', event.target.value);
        }
        let blurTimeout: NodeJS.Timeout | null = null; // eslint-disable-line no-undef
        const onBlur = (event: Event) => {
            emit('blur');
            blurTimeout = setTimeout(() => {
                isSelected.value = false;
                isEditing.value = false;
            }, 100);
        };
        function onFocus() {
            if (blurTimeout) {
                clearTimeout(blurTimeout);
            }
        }
        function focus() {
            if (props.isTextarea) {
                textareaElement.value?.focus();
            } else {
                inputElement.value?.focus();
            }
        }
        return {
            focus, onFocus,
            onBlur, onInput, inputElement
            , textareaElement, labelElement,
            isSelected, onClick, isEditing, isReadOnly,
        };
    },
};
</script>

<style scoped lang="less">
div.mInput {
    background-color: @dark-color;
    min-height: 16px;
    border: 1px solid transparent;
    border-radius: 2px;
    display: flex;
    align-items: center;
    padding: 2px 4px;
    cursor: text;

    &[noVerticalPadding] {
        padding: 0px 4px;
    }

    &:hover {
        border-color: @black-blue-color;
    }

    &:focus-within {
        background-color: @dark-color ;
        border-color: @blue-color;
    }

    &[readonly] {
        background-color: transparent;
    }

    &>ui-label,
    &>input {
        text-overflow: ellipsis;
    }

    &>input,
    &>textarea {
        overflow: hidden;
        flex: 1;
        background: none;
        border: none;
        outline: none;
        color: @white-color;
        line-height: 16px;
        font-size: 12px;
        width: 0px;
        font-weight: 400;
        font-family: @ping-fang-font;
        caret-color: @white-color;
        resize: none;

        &::selection {
            background-color: rgba(63, 170, 201, 1);
        }

        &[type="number"] {

            &::-webkit-outer-spin-button,
            &::-webkit-inner-spin-button {
                -webkit-appearance: none;
            }

            -moz-appearance: textfield;
        }
    }

    &>textarea {
        padding-top: 0px;
        padding-bottom: 0px;
    }

    &>ui-label {
        line-height: 16px;
        color: @white-color;
    }

    &.focus {
        border-color: #227f9b;
    }

    &>.icon {
        line-height: 16px;
        height: 16px;
        min-width: 0px;
    }

    &[error="true"] {
        border-color: @red-color;

    }
}
</style>
