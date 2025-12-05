"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
module.exports = Editor.Panel.define({
    template: `<div class="console-footer-right">
                <div class="console-counter">
                    <div class="icon-box" data-type="info"><ui-icon color="normal" value="info"></ui-icon><span class="info">0</span></div>
                    <div class="icon-box" data-type="warn"><ui-icon color="normal" value="warn"></ui-icon><span class="warn">0</span></div>
                    <div class="icon-box" data-type="error"><ui-icon color="normal" value="error"></ui-icon><span class="error">0</span></div>
                </div>
             </div>`,
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../dist/right.css'), 'utf8'),
    $: {
        counter: '.console-counter',
        iconInfo: 'ui-icon[value="info"]',
        iconWarn: 'ui-icon[value="warn"]',
        iconError: 'ui-icon[value="error"]',
        info: '.info',
        warn: '.warn',
        error: '.error',
    },
    methods: {
        clear() {
            this.updateCounter({ info: 0, warn: 0, error: 0, log: 0 });
        },
        updateCounter(data) {
            this.$.info.innerText = `${data.info}`;
            this.$.warn.innerText = `${data.warn}`;
            this.$.error.innerText = `${data.error}`;
            this.$.iconInfo?.setAttribute('color', data.info ? 'true' : 'normal');
            this.$.iconWarn?.setAttribute('color', data.warn ? 'true' : 'normal');
            this.$.iconError?.setAttribute('color', data.error ? 'true' : 'normal');
        },
    },
    async ready() {
        // 为了下面的事件绑定可以获取真实的 this
        this.clear = this.clear.bind(this);
        this.updateCounter = this.updateCounter.bind(this);
        const $iconBoxs = this.$.counter?.querySelectorAll('.icon-box');
        if (!$iconBoxs) {
            return;
        }
        Array.from($iconBoxs).forEach((box) => {
            box.addEventListener('click', async (e) => {
                // @ts-ignore
                const type = e.currentTarget?.dataset?.type;
                const hasConsole = await Editor.Panel.has('console');
                if (hasConsole) {
                    Editor.Panel.focus('console');
                    Editor.Message.send('console', 'refresh', type);
                }
                else {
                    Editor.Panel.open('console', type);
                }
            });
        });
        Editor.Message.__protected__.addBroadcastListener('console:logsUpdate', this.updateCounter);
        // 按下清除日志按钮的时候，需要清空当前显示的文字
        Editor.Logger.__protected__.on('clear', this.clear);
    },
    async close() {
        Editor.Logger.__protected__.removeListener('clear', this.clear);
        Editor.Message.__protected__.removeBroadcastListener('console:logsUpdate', this.updateCounter);
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlnaHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvZm9vdGVyL3JpZ2h0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdUNBQXdDO0FBQ3hDLCtCQUE0QjtBQUc1QixNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQ2pDLFFBQVEsRUFBRTs7Ozs7O29CQU1NO0lBQ2hCLEtBQUssRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHNCQUFzQixDQUFDLEVBQUUsTUFBTSxDQUFDO0lBQ3BFLENBQUMsRUFBRTtRQUNDLE9BQU8sRUFBRSxrQkFBa0I7UUFDM0IsUUFBUSxFQUFFLHVCQUF1QjtRQUNqQyxRQUFRLEVBQUUsdUJBQXVCO1FBQ2pDLFNBQVMsRUFBRSx3QkFBd0I7UUFDbkMsSUFBSSxFQUFFLE9BQU87UUFDYixJQUFJLEVBQUUsT0FBTztRQUNiLEtBQUssRUFBRSxRQUFRO0tBQ2xCO0lBQ0QsT0FBTyxFQUFFO1FBRUwsS0FBSztZQUNELElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUQsYUFBYSxDQUFDLElBQWlCO1lBQzNCLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSyxDQUFDLFNBQVMsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUssQ0FBQyxTQUFTLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFNLENBQUMsU0FBUyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBRTFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzVFLENBQUM7S0FDSjtJQUNELEtBQUssQ0FBQyxLQUFLO1FBQ1Asd0JBQXdCO1FBQ3hCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVuRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNoRSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQUUsT0FBTztTQUFFO1FBRTNCLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDbEMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3RDLGFBQWE7Z0JBQ2IsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsSUFBZSxDQUFDO2dCQUV2RCxNQUFNLFVBQVUsR0FBRyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLFVBQVUsRUFBRTtvQkFDWixNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDOUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDbkQ7cUJBQU07b0JBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUN0QztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFNUYsMEJBQTBCO1FBQzFCLE1BQU0sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFDRCxLQUFLLENBQUMsS0FBSztRQUNQLE1BQU0sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNuRyxDQUFDO0NBQ0osQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgSUxvZ0NvdW50ZXIsIGxvZ1R5cGUgfSBmcm9tICcuLi8uLi9AdHlwZXMvcHJpdmF0ZSc7XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yLlBhbmVsLmRlZmluZSh7XG4gICAgdGVtcGxhdGU6IGA8ZGl2IGNsYXNzPVwiY29uc29sZS1mb290ZXItcmlnaHRcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29uc29sZS1jb3VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJpY29uLWJveFwiIGRhdGEtdHlwZT1cImluZm9cIj48dWktaWNvbiBjb2xvcj1cIm5vcm1hbFwiIHZhbHVlPVwiaW5mb1wiPjwvdWktaWNvbj48c3BhbiBjbGFzcz1cImluZm9cIj4wPC9zcGFuPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaWNvbi1ib3hcIiBkYXRhLXR5cGU9XCJ3YXJuXCI+PHVpLWljb24gY29sb3I9XCJub3JtYWxcIiB2YWx1ZT1cIndhcm5cIj48L3VpLWljb24+PHNwYW4gY2xhc3M9XCJ3YXJuXCI+MDwvc3Bhbj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImljb24tYm94XCIgZGF0YS10eXBlPVwiZXJyb3JcIj48dWktaWNvbiBjb2xvcj1cIm5vcm1hbFwiIHZhbHVlPVwiZXJyb3JcIj48L3VpLWljb24+PHNwYW4gY2xhc3M9XCJlcnJvclwiPjA8L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgPC9kaXY+YCxcbiAgICBzdHlsZTogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vZGlzdC9yaWdodC5jc3MnKSwgJ3V0ZjgnKSxcbiAgICAkOiB7XG4gICAgICAgIGNvdW50ZXI6ICcuY29uc29sZS1jb3VudGVyJyxcbiAgICAgICAgaWNvbkluZm86ICd1aS1pY29uW3ZhbHVlPVwiaW5mb1wiXScsXG4gICAgICAgIGljb25XYXJuOiAndWktaWNvblt2YWx1ZT1cIndhcm5cIl0nLFxuICAgICAgICBpY29uRXJyb3I6ICd1aS1pY29uW3ZhbHVlPVwiZXJyb3JcIl0nLFxuICAgICAgICBpbmZvOiAnLmluZm8nLFxuICAgICAgICB3YXJuOiAnLndhcm4nLFxuICAgICAgICBlcnJvcjogJy5lcnJvcicsXG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG5cbiAgICAgICAgY2xlYXIoKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvdW50ZXIoeyBpbmZvOiAwLCB3YXJuOiAwLCBlcnJvcjogMCwgbG9nOiAwIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZUNvdW50ZXIoZGF0YTogSUxvZ0NvdW50ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuJC5pbmZvIS5pbm5lclRleHQgPSBgJHtkYXRhLmluZm99YDtcbiAgICAgICAgICAgIHRoaXMuJC53YXJuIS5pbm5lclRleHQgPSBgJHtkYXRhLndhcm59YDtcbiAgICAgICAgICAgIHRoaXMuJC5lcnJvciEuaW5uZXJUZXh0ID0gYCR7ZGF0YS5lcnJvcn1gO1xuXG4gICAgICAgICAgICB0aGlzLiQuaWNvbkluZm8/LnNldEF0dHJpYnV0ZSgnY29sb3InLCBkYXRhLmluZm8gPyAndHJ1ZScgOiAnbm9ybWFsJyk7XG4gICAgICAgICAgICB0aGlzLiQuaWNvbldhcm4/LnNldEF0dHJpYnV0ZSgnY29sb3InLCBkYXRhLndhcm4gPyAndHJ1ZScgOiAnbm9ybWFsJyk7XG4gICAgICAgICAgICB0aGlzLiQuaWNvbkVycm9yPy5zZXRBdHRyaWJ1dGUoJ2NvbG9yJywgZGF0YS5lcnJvciA/ICd0cnVlJyA6ICdub3JtYWwnKTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGFzeW5jIHJlYWR5KCkge1xuICAgICAgICAvLyDkuLrkuobkuIvpnaLnmoTkuovku7bnu5Hlrprlj6/ku6Xojrflj5bnnJ/lrp7nmoQgdGhpc1xuICAgICAgICB0aGlzLmNsZWFyID0gdGhpcy5jbGVhci5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvdW50ZXIgPSB0aGlzLnVwZGF0ZUNvdW50ZXIuYmluZCh0aGlzKTtcblxuICAgICAgICBjb25zdCAkaWNvbkJveHMgPSB0aGlzLiQuY291bnRlcj8ucXVlcnlTZWxlY3RvckFsbCgnLmljb24tYm94Jyk7XG4gICAgICAgIGlmICghJGljb25Cb3hzKSB7IHJldHVybjsgfVxuXG4gICAgICAgIEFycmF5LmZyb20oJGljb25Cb3hzKS5mb3JFYWNoKChib3gpID0+IHtcbiAgICAgICAgICAgIGJveC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFzeW5jIChlKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBlLmN1cnJlbnRUYXJnZXQ/LmRhdGFzZXQ/LnR5cGUgYXMgbG9nVHlwZTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGhhc0NvbnNvbGUgPSBhd2FpdCBFZGl0b3IuUGFuZWwuaGFzKCdjb25zb2xlJyk7XG4gICAgICAgICAgICAgICAgaWYgKGhhc0NvbnNvbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlBhbmVsLmZvY3VzKCdjb25zb2xlJyk7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5NZXNzYWdlLnNlbmQoJ2NvbnNvbGUnLCAncmVmcmVzaCcsIHR5cGUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5QYW5lbC5vcGVuKCdjb25zb2xlJywgdHlwZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIEVkaXRvci5NZXNzYWdlLl9fcHJvdGVjdGVkX18uYWRkQnJvYWRjYXN0TGlzdGVuZXIoJ2NvbnNvbGU6bG9nc1VwZGF0ZScsIHRoaXMudXBkYXRlQ291bnRlcik7XG5cbiAgICAgICAgLy8g5oyJ5LiL5riF6Zmk5pel5b+X5oyJ6ZKu55qE5pe25YCZ77yM6ZyA6KaB5riF56m65b2T5YmN5pi+56S655qE5paH5a2XXG4gICAgICAgIEVkaXRvci5Mb2dnZXIuX19wcm90ZWN0ZWRfXy5vbignY2xlYXInLCB0aGlzLmNsZWFyKTtcbiAgICB9LFxuICAgIGFzeW5jIGNsb3NlKCkge1xuICAgICAgICBFZGl0b3IuTG9nZ2VyLl9fcHJvdGVjdGVkX18ucmVtb3ZlTGlzdGVuZXIoJ2NsZWFyJywgdGhpcy5jbGVhcik7XG4gICAgICAgIEVkaXRvci5NZXNzYWdlLl9fcHJvdGVjdGVkX18ucmVtb3ZlQnJvYWRjYXN0TGlzdGVuZXIoJ2NvbnNvbGU6bG9nc1VwZGF0ZScsIHRoaXMudXBkYXRlQ291bnRlcik7XG4gICAgfSxcbn0pO1xuIl19