"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
module.exports = Editor.Panel.define({
    template: `<div class="console-footer-right">
                <div class="console-counter">
                    <div class="icon-box" data-type="log"><ui-icon color="normal" value="info"></ui-icon><span class="log">0</span></div>
                    <div class="icon-box" data-type="warn"><ui-icon color="normal" value="warn"></ui-icon><span class="warn">0</span></div>
                    <div class="icon-box" data-type="error"><ui-icon color="normal" value="error"></ui-icon><span class="error">0</span></div>
                </div>
             </div>`,
    style: fs_extra_1.readFileSync(path_1.join(__dirname, '../../dist/right.css'), 'utf8'),
    $: {
        counter: '.console-counter',
        iconInfo: 'ui-icon[value="info"]',
        iconWarn: 'ui-icon[value="warn"]',
        iconError: 'ui-icon[value="error"]',
        log: '.log',
        warn: '.warn',
        error: '.error',
    },
    methods: {
        clear() {
            this.updateCounter({ log: 0, warn: 0, error: 0 });
        },
        updateCounter(data) {
            this.$.log.innerText = `${data.log}`;
            this.$.warn.innerText = `${data.warn}`;
            this.$.error.innerText = `${data.error}`;
            this.$.iconInfo?.setAttribute('color', data.log ? 'true' : 'normal');
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
        Editor.Message.addBroadcastListener('console:logsUpdate', this.updateCounter);
        // 按下清除日志按钮的时候，需要清空当前显示的文字
        Editor.Logger.on('clear', this.clear);
    },
    async close() {
        Editor.Logger.removeListener('clear', this.clear);
        Editor.Logger.removeListener('console:logsUpdate', this.updateCounter);
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlnaHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvZm9vdGVyL3JpZ2h0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdUNBQXdDO0FBQ3hDLCtCQUE0QjtBQUc1QixNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQ2pDLFFBQVEsRUFBRTs7Ozs7O29CQU1NO0lBQ2hCLEtBQUssRUFBRSx1QkFBWSxDQUFDLFdBQUksQ0FBQyxTQUFTLEVBQUUsc0JBQXNCLENBQUMsRUFBRSxNQUFNLENBQUM7SUFDcEUsQ0FBQyxFQUFFO1FBQ0MsT0FBTyxFQUFFLGtCQUFrQjtRQUMzQixRQUFRLEVBQUUsdUJBQXVCO1FBQ2pDLFFBQVEsRUFBRSx1QkFBdUI7UUFDakMsU0FBUyxFQUFFLHdCQUF3QjtRQUNuQyxHQUFHLEVBQUUsTUFBTTtRQUNYLElBQUksRUFBRSxPQUFPO1FBQ2IsS0FBSyxFQUFFLFFBQVE7S0FDbEI7SUFDRCxPQUFPLEVBQUU7UUFFTCxLQUFLO1lBQ0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQsYUFBYSxDQUFDLElBQWlCO1lBQzNCLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUssQ0FBQyxTQUFTLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFNLENBQUMsU0FBUyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBRTFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNyRSxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdEUsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzVFLENBQUM7S0FDSjtJQUNELEtBQUssQ0FBQyxLQUFLO1FBQ1Asd0JBQXdCO1FBQ3hCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVuRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNoRSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQUUsT0FBTztTQUFFO1FBRTNCLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDbEMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3RDLGFBQWE7Z0JBQ2IsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsSUFBZSxDQUFDO2dCQUV2RCxNQUFNLFVBQVUsR0FBRyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLFVBQVUsRUFBRTtvQkFDWixNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDOUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDbkQ7cUJBQU07b0JBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUN0QztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUU5RSwwQkFBMEI7UUFDMUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBQ0QsS0FBSyxDQUFDLEtBQUs7UUFDUCxNQUFNLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xELE1BQU0sQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUMzRSxDQUFDO0NBQ0osQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgSUxvZ0NvdW50ZXIsIGxvZ1R5cGUgfSBmcm9tICcuLi8uLi9AdHlwZXMvcHJpdGF0ZSc7XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yLlBhbmVsLmRlZmluZSh7XG4gICAgdGVtcGxhdGU6IGA8ZGl2IGNsYXNzPVwiY29uc29sZS1mb290ZXItcmlnaHRcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29uc29sZS1jb3VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJpY29uLWJveFwiIGRhdGEtdHlwZT1cImxvZ1wiPjx1aS1pY29uIGNvbG9yPVwibm9ybWFsXCIgdmFsdWU9XCJpbmZvXCI+PC91aS1pY29uPjxzcGFuIGNsYXNzPVwibG9nXCI+MDwvc3Bhbj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImljb24tYm94XCIgZGF0YS10eXBlPVwid2FyblwiPjx1aS1pY29uIGNvbG9yPVwibm9ybWFsXCIgdmFsdWU9XCJ3YXJuXCI+PC91aS1pY29uPjxzcGFuIGNsYXNzPVwid2FyblwiPjA8L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJpY29uLWJveFwiIGRhdGEtdHlwZT1cImVycm9yXCI+PHVpLWljb24gY29sb3I9XCJub3JtYWxcIiB2YWx1ZT1cImVycm9yXCI+PC91aS1pY29uPjxzcGFuIGNsYXNzPVwiZXJyb3JcIj4wPC9zcGFuPjwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgIDwvZGl2PmAsXG4gICAgc3R5bGU6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uL2Rpc3QvcmlnaHQuY3NzJyksICd1dGY4JyksXG4gICAgJDoge1xuICAgICAgICBjb3VudGVyOiAnLmNvbnNvbGUtY291bnRlcicsXG4gICAgICAgIGljb25JbmZvOiAndWktaWNvblt2YWx1ZT1cImluZm9cIl0nLFxuICAgICAgICBpY29uV2FybjogJ3VpLWljb25bdmFsdWU9XCJ3YXJuXCJdJyxcbiAgICAgICAgaWNvbkVycm9yOiAndWktaWNvblt2YWx1ZT1cImVycm9yXCJdJyxcbiAgICAgICAgbG9nOiAnLmxvZycsXG4gICAgICAgIHdhcm46ICcud2FybicsXG4gICAgICAgIGVycm9yOiAnLmVycm9yJyxcbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcblxuICAgICAgICBjbGVhcigpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ291bnRlcih7IGxvZzogMCwgd2FybjogMCwgZXJyb3I6IDAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlQ291bnRlcihkYXRhOiBJTG9nQ291bnRlcikge1xuICAgICAgICAgICAgdGhpcy4kLmxvZyEuaW5uZXJUZXh0ID0gYCR7ZGF0YS5sb2d9YDtcbiAgICAgICAgICAgIHRoaXMuJC53YXJuIS5pbm5lclRleHQgPSBgJHtkYXRhLndhcm59YDtcbiAgICAgICAgICAgIHRoaXMuJC5lcnJvciEuaW5uZXJUZXh0ID0gYCR7ZGF0YS5lcnJvcn1gO1xuXG4gICAgICAgICAgICB0aGlzLiQuaWNvbkluZm8/LnNldEF0dHJpYnV0ZSgnY29sb3InLCBkYXRhLmxvZyA/ICd0cnVlJyA6ICdub3JtYWwnKTtcbiAgICAgICAgICAgIHRoaXMuJC5pY29uV2Fybj8uc2V0QXR0cmlidXRlKCdjb2xvcicsIGRhdGEud2FybiA/ICd0cnVlJyA6ICdub3JtYWwnKTtcbiAgICAgICAgICAgIHRoaXMuJC5pY29uRXJyb3I/LnNldEF0dHJpYnV0ZSgnY29sb3InLCBkYXRhLmVycm9yID8gJ3RydWUnIDogJ25vcm1hbCcpO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgYXN5bmMgcmVhZHkoKSB7XG4gICAgICAgIC8vIOS4uuS6huS4i+mdoueahOS6i+S7tue7keWumuWPr+S7peiOt+WPluecn+WunueahCB0aGlzXG4gICAgICAgIHRoaXMuY2xlYXIgPSB0aGlzLmNsZWFyLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMudXBkYXRlQ291bnRlciA9IHRoaXMudXBkYXRlQ291bnRlci5iaW5kKHRoaXMpO1xuXG4gICAgICAgIGNvbnN0ICRpY29uQm94cyA9IHRoaXMuJC5jb3VudGVyPy5xdWVyeVNlbGVjdG9yQWxsKCcuaWNvbi1ib3gnKTtcbiAgICAgICAgaWYgKCEkaWNvbkJveHMpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgQXJyYXkuZnJvbSgkaWNvbkJveHMpLmZvckVhY2goKGJveCkgPT4ge1xuICAgICAgICAgICAgYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZSA9IGUuY3VycmVudFRhcmdldD8uZGF0YXNldD8udHlwZSBhcyBsb2dUeXBlO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaGFzQ29uc29sZSA9IGF3YWl0IEVkaXRvci5QYW5lbC5oYXMoJ2NvbnNvbGUnKTtcbiAgICAgICAgICAgICAgICBpZiAoaGFzQ29uc29sZSkge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuUGFuZWwuZm9jdXMoJ2NvbnNvbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnY29uc29sZScsICdyZWZyZXNoJywgdHlwZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4oJ2NvbnNvbGUnLCB0eXBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgRWRpdG9yLk1lc3NhZ2UuYWRkQnJvYWRjYXN0TGlzdGVuZXIoJ2NvbnNvbGU6bG9nc1VwZGF0ZScsIHRoaXMudXBkYXRlQ291bnRlcik7XG5cbiAgICAgICAgLy8g5oyJ5LiL5riF6Zmk5pel5b+X5oyJ6ZKu55qE5pe25YCZ77yM6ZyA6KaB5riF56m65b2T5YmN5pi+56S655qE5paH5a2XXG4gICAgICAgIEVkaXRvci5Mb2dnZXIub24oJ2NsZWFyJywgdGhpcy5jbGVhcik7XG4gICAgfSxcbiAgICBhc3luYyBjbG9zZSgpIHtcbiAgICAgICAgRWRpdG9yLkxvZ2dlci5yZW1vdmVMaXN0ZW5lcignY2xlYXInLCB0aGlzLmNsZWFyKTtcbiAgICAgICAgRWRpdG9yLkxvZ2dlci5yZW1vdmVMaXN0ZW5lcignY29uc29sZTpsb2dzVXBkYXRlJywgdGhpcy51cGRhdGVDb3VudGVyKTtcbiAgICB9LFxufSk7XG4iXX0=