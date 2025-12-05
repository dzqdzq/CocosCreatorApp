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
    style: fs_extra_1.readFileSync(path_1.join(__dirname, '../../dist/right.css'), 'utf8'),
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
        Editor.Message.addBroadcastListener('console:logsUpdate', this.updateCounter);
        // 按下清除日志按钮的时候，需要清空当前显示的文字
        Editor.Logger.on('clear', this.clear);
    },
    async close() {
        Editor.Logger.removeListener('clear', this.clear);
        Editor.Message.removeBroadcastListener('console:logsUpdate', this.updateCounter);
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlnaHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvZm9vdGVyL3JpZ2h0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdUNBQXdDO0FBQ3hDLCtCQUE0QjtBQUc1QixNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQ2pDLFFBQVEsRUFBRTs7Ozs7O29CQU1NO0lBQ2hCLEtBQUssRUFBRSx1QkFBWSxDQUFDLFdBQUksQ0FBQyxTQUFTLEVBQUUsc0JBQXNCLENBQUMsRUFBRSxNQUFNLENBQUM7SUFDcEUsQ0FBQyxFQUFFO1FBQ0MsT0FBTyxFQUFFLGtCQUFrQjtRQUMzQixRQUFRLEVBQUUsdUJBQXVCO1FBQ2pDLFFBQVEsRUFBRSx1QkFBdUI7UUFDakMsU0FBUyxFQUFFLHdCQUF3QjtRQUNuQyxJQUFJLEVBQUUsT0FBTztRQUNiLElBQUksRUFBRSxPQUFPO1FBQ2IsS0FBSyxFQUFFLFFBQVE7S0FDbEI7SUFDRCxPQUFPLEVBQUU7UUFFTCxLQUFLO1lBQ0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFRCxhQUFhLENBQUMsSUFBaUI7WUFDM0IsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFLLENBQUMsU0FBUyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSyxDQUFDLFNBQVMsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQU0sQ0FBQyxTQUFTLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFMUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDNUUsQ0FBQztLQUNKO0lBQ0QsS0FBSyxDQUFDLEtBQUs7UUFDUCx3QkFBd0I7UUFDeEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRW5ELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2hFLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFBRSxPQUFPO1NBQUU7UUFFM0IsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNsQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDdEMsYUFBYTtnQkFDYixNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxJQUFlLENBQUM7Z0JBRXZELE1BQU0sVUFBVSxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3JELElBQUksVUFBVSxFQUFFO29CQUNaLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM5QixNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUNuRDtxQkFBTTtvQkFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ3RDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRTlFLDBCQUEwQjtRQUMxQixNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFDRCxLQUFLLENBQUMsS0FBSztRQUNQLE1BQU0sQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEQsTUFBTSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDckYsQ0FBQztDQUNKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IElMb2dDb3VudGVyLCBsb2dUeXBlIH0gZnJvbSAnLi4vLi4vQHR5cGVzL3ByaXRhdGUnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvci5QYW5lbC5kZWZpbmUoe1xuICAgIHRlbXBsYXRlOiBgPGRpdiBjbGFzcz1cImNvbnNvbGUtZm9vdGVyLXJpZ2h0XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbnNvbGUtY291bnRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaWNvbi1ib3hcIiBkYXRhLXR5cGU9XCJpbmZvXCI+PHVpLWljb24gY29sb3I9XCJub3JtYWxcIiB2YWx1ZT1cImluZm9cIj48L3VpLWljb24+PHNwYW4gY2xhc3M9XCJpbmZvXCI+MDwvc3Bhbj48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImljb24tYm94XCIgZGF0YS10eXBlPVwid2FyblwiPjx1aS1pY29uIGNvbG9yPVwibm9ybWFsXCIgdmFsdWU9XCJ3YXJuXCI+PC91aS1pY29uPjxzcGFuIGNsYXNzPVwid2FyblwiPjA8L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJpY29uLWJveFwiIGRhdGEtdHlwZT1cImVycm9yXCI+PHVpLWljb24gY29sb3I9XCJub3JtYWxcIiB2YWx1ZT1cImVycm9yXCI+PC91aS1pY29uPjxzcGFuIGNsYXNzPVwiZXJyb3JcIj4wPC9zcGFuPjwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgIDwvZGl2PmAsXG4gICAgc3R5bGU6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uL2Rpc3QvcmlnaHQuY3NzJyksICd1dGY4JyksXG4gICAgJDoge1xuICAgICAgICBjb3VudGVyOiAnLmNvbnNvbGUtY291bnRlcicsXG4gICAgICAgIGljb25JbmZvOiAndWktaWNvblt2YWx1ZT1cImluZm9cIl0nLFxuICAgICAgICBpY29uV2FybjogJ3VpLWljb25bdmFsdWU9XCJ3YXJuXCJdJyxcbiAgICAgICAgaWNvbkVycm9yOiAndWktaWNvblt2YWx1ZT1cImVycm9yXCJdJyxcbiAgICAgICAgaW5mbzogJy5pbmZvJyxcbiAgICAgICAgd2FybjogJy53YXJuJyxcbiAgICAgICAgZXJyb3I6ICcuZXJyb3InLFxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuXG4gICAgICAgIGNsZWFyKCkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb3VudGVyKHsgaW5mbzogMCwgd2FybjogMCwgZXJyb3I6IDAsIGxvZzogMCB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVDb3VudGVyKGRhdGE6IElMb2dDb3VudGVyKSB7XG4gICAgICAgICAgICB0aGlzLiQuaW5mbyEuaW5uZXJUZXh0ID0gYCR7ZGF0YS5pbmZvfWA7XG4gICAgICAgICAgICB0aGlzLiQud2FybiEuaW5uZXJUZXh0ID0gYCR7ZGF0YS53YXJufWA7XG4gICAgICAgICAgICB0aGlzLiQuZXJyb3IhLmlubmVyVGV4dCA9IGAke2RhdGEuZXJyb3J9YDtcblxuICAgICAgICAgICAgdGhpcy4kLmljb25JbmZvPy5zZXRBdHRyaWJ1dGUoJ2NvbG9yJywgZGF0YS5pbmZvID8gJ3RydWUnIDogJ25vcm1hbCcpO1xuICAgICAgICAgICAgdGhpcy4kLmljb25XYXJuPy5zZXRBdHRyaWJ1dGUoJ2NvbG9yJywgZGF0YS53YXJuID8gJ3RydWUnIDogJ25vcm1hbCcpO1xuICAgICAgICAgICAgdGhpcy4kLmljb25FcnJvcj8uc2V0QXR0cmlidXRlKCdjb2xvcicsIGRhdGEuZXJyb3IgPyAndHJ1ZScgOiAnbm9ybWFsJyk7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBhc3luYyByZWFkeSgpIHtcbiAgICAgICAgLy8g5Li65LqG5LiL6Z2i55qE5LqL5Lu257uR5a6a5Y+v5Lul6I635Y+W55yf5a6e55qEIHRoaXNcbiAgICAgICAgdGhpcy5jbGVhciA9IHRoaXMuY2xlYXIuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy51cGRhdGVDb3VudGVyID0gdGhpcy51cGRhdGVDb3VudGVyLmJpbmQodGhpcyk7XG5cbiAgICAgICAgY29uc3QgJGljb25Cb3hzID0gdGhpcy4kLmNvdW50ZXI/LnF1ZXJ5U2VsZWN0b3JBbGwoJy5pY29uLWJveCcpO1xuICAgICAgICBpZiAoISRpY29uQm94cykgeyByZXR1cm47IH1cblxuICAgICAgICBBcnJheS5mcm9tKCRpY29uQm94cykuZm9yRWFjaCgoYm94KSA9PiB7XG4gICAgICAgICAgICBib3guYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBjb25zdCB0eXBlID0gZS5jdXJyZW50VGFyZ2V0Py5kYXRhc2V0Py50eXBlIGFzIGxvZ1R5cGU7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBoYXNDb25zb2xlID0gYXdhaXQgRWRpdG9yLlBhbmVsLmhhcygnY29uc29sZScpO1xuICAgICAgICAgICAgICAgIGlmIChoYXNDb25zb2xlKSB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5QYW5lbC5mb2N1cygnY29uc29sZScpO1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuTWVzc2FnZS5zZW5kKCdjb25zb2xlJywgJ3JlZnJlc2gnLCB0eXBlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuUGFuZWwub3BlbignY29uc29sZScsIHR5cGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBFZGl0b3IuTWVzc2FnZS5hZGRCcm9hZGNhc3RMaXN0ZW5lcignY29uc29sZTpsb2dzVXBkYXRlJywgdGhpcy51cGRhdGVDb3VudGVyKTtcblxuICAgICAgICAvLyDmjInkuIvmuIXpmaTml6Xlv5fmjInpkq7nmoTml7blgJnvvIzpnIDopoHmuIXnqbrlvZPliY3mmL7npLrnmoTmloflrZdcbiAgICAgICAgRWRpdG9yLkxvZ2dlci5vbignY2xlYXInLCB0aGlzLmNsZWFyKTtcbiAgICB9LFxuICAgIGFzeW5jIGNsb3NlKCkge1xuICAgICAgICBFZGl0b3IuTG9nZ2VyLnJlbW92ZUxpc3RlbmVyKCdjbGVhcicsIHRoaXMuY2xlYXIpO1xuICAgICAgICBFZGl0b3IuTWVzc2FnZS5yZW1vdmVCcm9hZGNhc3RMaXN0ZW5lcignY29uc29sZTpsb2dzVXBkYXRlJywgdGhpcy51cGRhdGVDb3VudGVyKTtcbiAgICB9LFxufSk7XG4iXX0=