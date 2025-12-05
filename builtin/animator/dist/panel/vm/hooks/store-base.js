"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBaseStore = void 0;
const vue_js_1 = require("vue/dist/vue.js");
const pinia_1 = require("pinia");
const defaultClipConfig = {
    sample: 60,
    isLock: false,
    speed: 1,
    duration: 60,
    wrapMode: 0,
};
exports.useBaseStore = (0, pinia_1.defineStore)('animator_base', () => {
    /**
     * 当前动画 clip uuid
     */
    const currentClip = (0, vue_js_1.ref)('');
    const clipConfig = (0, vue_js_1.ref)(null);
    const isSkeletonClip = (0, vue_js_1.ref)(false);
    /**
     * 存储时间轴在当前面板中的偏移数量
     */
    const offset = (0, vue_js_1.ref)(0);
    const currentSample = (0, vue_js_1.computed)(() => {
        return clipConfig.value?.sample ?? defaultClipConfig.sample;
    });
    function reset() {
        currentClip.value = '';
        clipConfig.value = null;
        isSkeletonClip.value = false;
        offset.value = 0;
    }
    return {
        reset,
        currentClip,
        clipConfig,
        currentSample,
        isSkeletonClip,
        offset,
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmUtYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NvdXJjZS9wYW5lbC92bS9ob29rcy9zdG9yZS1iYXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDRDQUFpSDtBQUNqSCxpQ0FBb0M7QUFJcEMsTUFBTSxpQkFBaUIsR0FBZ0I7SUFDbkMsTUFBTSxFQUFFLEVBQUU7SUFDVixNQUFNLEVBQUUsS0FBSztJQUNiLEtBQUssRUFBRSxDQUFDO0lBQ1IsUUFBUSxFQUFFLEVBQUU7SUFDWixRQUFRLEVBQUUsQ0FBQztDQUNkLENBQUM7QUFFVyxRQUFBLFlBQVksR0FBRyxJQUFBLG1CQUFXLEVBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtJQUMxRDs7T0FFRztJQUNILE1BQU0sV0FBVyxHQUFHLElBQUEsWUFBRyxFQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVCLE1BQU0sVUFBVSxHQUFHLElBQUEsWUFBRyxFQUFxQixJQUFJLENBQUMsQ0FBQztJQUNqRCxNQUFNLGNBQWMsR0FBRyxJQUFBLFlBQUcsRUFBQyxLQUFLLENBQUMsQ0FBQztJQUVsQzs7T0FFRztJQUNILE1BQU0sTUFBTSxHQUFHLElBQUEsWUFBRyxFQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXRCLE1BQU0sYUFBYSxHQUFHLElBQUEsaUJBQVEsRUFBQyxHQUFHLEVBQUU7UUFDaEMsT0FBTyxVQUFVLENBQUMsS0FBSyxFQUFFLE1BQU0sSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLENBQUM7SUFDaEUsQ0FBQyxDQUFDLENBQUM7SUFFSCxTQUFTLEtBQUs7UUFDVixXQUFXLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUN2QixVQUFVLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUN4QixjQUFjLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUM3QixNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztJQUNyQixDQUFDO0lBRUQsT0FBTztRQUNILEtBQUs7UUFFTCxXQUFXO1FBQ1gsVUFBVTtRQUNWLGFBQWE7UUFDYixjQUFjO1FBQ2QsTUFBTTtLQUNULENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBWdWUsIHsgY29tcHV0ZWQsIHJlZiwgc2hhbGxvd1JlZiwgbWFya1JhdywgZ2V0Q3VycmVudEluc3RhbmNlLCBDb21wb25lbnRJbnN0YW5jZSB9IGZyb20gJ3Z1ZS9kaXN0L3Z1ZS5qcyc7XG5pbXBvcnQgeyBkZWZpbmVTdG9yZSB9IGZyb20gJ3BpbmlhJztcblxuaW1wb3J0IHsgSUNsaXBDb25maWcgfSBmcm9tICcuLi8uLi8uLi8uLi9AdHlwZXMvcHJpdmF0ZSc7XG5cbmNvbnN0IGRlZmF1bHRDbGlwQ29uZmlnOiBJQ2xpcENvbmZpZyA9IHtcbiAgICBzYW1wbGU6IDYwLFxuICAgIGlzTG9jazogZmFsc2UsXG4gICAgc3BlZWQ6IDEsXG4gICAgZHVyYXRpb246IDYwLFxuICAgIHdyYXBNb2RlOiAwLFxufTtcblxuZXhwb3J0IGNvbnN0IHVzZUJhc2VTdG9yZSA9IGRlZmluZVN0b3JlKCdhbmltYXRvcl9iYXNlJywgKCkgPT4ge1xuICAgIC8qKlxuICAgICAqIOW9k+WJjeWKqOeUuyBjbGlwIHV1aWRcbiAgICAgKi9cbiAgICBjb25zdCBjdXJyZW50Q2xpcCA9IHJlZignJyk7XG4gICAgY29uc3QgY2xpcENvbmZpZyA9IHJlZjxJQ2xpcENvbmZpZyB8IG51bGw+KG51bGwpO1xuICAgIGNvbnN0IGlzU2tlbGV0b25DbGlwID0gcmVmKGZhbHNlKTtcblxuICAgIC8qKlxuICAgICAqIOWtmOWCqOaXtumXtOi9tOWcqOW9k+WJjemdouadv+S4reeahOWBj+enu+aVsOmHj1xuICAgICAqL1xuICAgIGNvbnN0IG9mZnNldCA9IHJlZigwKTtcblxuICAgIGNvbnN0IGN1cnJlbnRTYW1wbGUgPSBjb21wdXRlZCgoKSA9PiB7XG4gICAgICAgIHJldHVybiBjbGlwQ29uZmlnLnZhbHVlPy5zYW1wbGUgPz8gZGVmYXVsdENsaXBDb25maWcuc2FtcGxlO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgIGN1cnJlbnRDbGlwLnZhbHVlID0gJyc7XG4gICAgICAgIGNsaXBDb25maWcudmFsdWUgPSBudWxsO1xuICAgICAgICBpc1NrZWxldG9uQ2xpcC52YWx1ZSA9IGZhbHNlO1xuICAgICAgICBvZmZzZXQudmFsdWUgPSAwO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc2V0LFxuXG4gICAgICAgIGN1cnJlbnRDbGlwLFxuICAgICAgICBjbGlwQ29uZmlnLFxuICAgICAgICBjdXJyZW50U2FtcGxlLFxuICAgICAgICBpc1NrZWxldG9uQ2xpcCxcbiAgICAgICAgb2Zmc2V0LFxuICAgIH07XG59KTtcbiJdfQ==