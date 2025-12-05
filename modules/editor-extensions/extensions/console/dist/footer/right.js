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
        Editor.Message.__protected__.addBroadcastListener('console:logsUpdate', this.updateCounter);
        // 按下清除日志按钮的时候，需要清空当前显示的文字
        Editor.Logger.__protected__.on('clear', this.clear);
    },
    async close() {
        Editor.Logger.__protected__.removeListener('clear', this.clear);
        Editor.Message.__protected__.removeBroadcastListener('console:logsUpdate', this.updateCounter);
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlnaHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvZm9vdGVyL3JpZ2h0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdUNBQXdDO0FBQ3hDLCtCQUE0QjtBQUc1QixNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQ2pDLFFBQVEsRUFBRTs7Ozs7O29CQU1NO0lBQ2hCLEtBQUssRUFBRSx1QkFBWSxDQUFDLFdBQUksQ0FBQyxTQUFTLEVBQUUsc0JBQXNCLENBQUMsRUFBRSxNQUFNLENBQUM7SUFDcEUsQ0FBQyxFQUFFO1FBQ0MsT0FBTyxFQUFFLGtCQUFrQjtRQUMzQixRQUFRLEVBQUUsdUJBQXVCO1FBQ2pDLFFBQVEsRUFBRSx1QkFBdUI7UUFDakMsU0FBUyxFQUFFLHdCQUF3QjtRQUNuQyxJQUFJLEVBQUUsT0FBTztRQUNiLElBQUksRUFBRSxPQUFPO1FBQ2IsS0FBSyxFQUFFLFFBQVE7S0FDbEI7SUFDRCxPQUFPLEVBQUU7UUFFTCxLQUFLO1lBQ0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQy9ELENBQUM7UUFFRCxhQUFhLENBQUMsSUFBaUI7WUFDM0IsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFLLENBQUMsU0FBUyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSyxDQUFDLFNBQVMsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQU0sQ0FBQyxTQUFTLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFMUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLFlBQVksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN0RSxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDNUUsQ0FBQztLQUNKO0lBQ0QsS0FBSyxDQUFDLEtBQUs7UUFDUCx3QkFBd0I7UUFDeEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRW5ELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2hFLElBQUksQ0FBQyxTQUFTLEVBQUU7WUFBRSxPQUFPO1NBQUU7UUFFM0IsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNsQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDdEMsYUFBYTtnQkFDYixNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxJQUFlLENBQUM7Z0JBRXZELE1BQU0sVUFBVSxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3JELElBQUksVUFBVSxFQUFFO29CQUNaLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUM5QixNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUNuRDtxQkFBTTtvQkFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ3RDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUU1RiwwQkFBMEI7UUFDMUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUNELEtBQUssQ0FBQyxLQUFLO1FBQ1AsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ25HLENBQUM7Q0FDSixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBJTG9nQ291bnRlciwgbG9nVHlwZSB9IGZyb20gJy4uLy4uL0B0eXBlcy9wcml0YXRlJztcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3IuUGFuZWwuZGVmaW5lKHtcbiAgICB0ZW1wbGF0ZTogYDxkaXYgY2xhc3M9XCJjb25zb2xlLWZvb3Rlci1yaWdodFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb25zb2xlLWNvdW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImljb24tYm94XCIgZGF0YS10eXBlPVwiaW5mb1wiPjx1aS1pY29uIGNvbG9yPVwibm9ybWFsXCIgdmFsdWU9XCJpbmZvXCI+PC91aS1pY29uPjxzcGFuIGNsYXNzPVwiaW5mb1wiPjA8L3NwYW4+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJpY29uLWJveFwiIGRhdGEtdHlwZT1cIndhcm5cIj48dWktaWNvbiBjb2xvcj1cIm5vcm1hbFwiIHZhbHVlPVwid2FyblwiPjwvdWktaWNvbj48c3BhbiBjbGFzcz1cIndhcm5cIj4wPC9zcGFuPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaWNvbi1ib3hcIiBkYXRhLXR5cGU9XCJlcnJvclwiPjx1aS1pY29uIGNvbG9yPVwibm9ybWFsXCIgdmFsdWU9XCJlcnJvclwiPjwvdWktaWNvbj48c3BhbiBjbGFzcz1cImVycm9yXCI+MDwvc3Bhbj48L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICA8L2Rpdj5gLFxuICAgIHN0eWxlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi9kaXN0L3JpZ2h0LmNzcycpLCAndXRmOCcpLFxuICAgICQ6IHtcbiAgICAgICAgY291bnRlcjogJy5jb25zb2xlLWNvdW50ZXInLFxuICAgICAgICBpY29uSW5mbzogJ3VpLWljb25bdmFsdWU9XCJpbmZvXCJdJyxcbiAgICAgICAgaWNvbldhcm46ICd1aS1pY29uW3ZhbHVlPVwid2FyblwiXScsXG4gICAgICAgIGljb25FcnJvcjogJ3VpLWljb25bdmFsdWU9XCJlcnJvclwiXScsXG4gICAgICAgIGluZm86ICcuaW5mbycsXG4gICAgICAgIHdhcm46ICcud2FybicsXG4gICAgICAgIGVycm9yOiAnLmVycm9yJyxcbiAgICB9LFxuICAgIG1ldGhvZHM6IHtcblxuICAgICAgICBjbGVhcigpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ291bnRlcih7IGluZm86IDAsIHdhcm46IDAsIGVycm9yOiAwLCBsb2c6IDAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlQ291bnRlcihkYXRhOiBJTG9nQ291bnRlcikge1xuICAgICAgICAgICAgdGhpcy4kLmluZm8hLmlubmVyVGV4dCA9IGAke2RhdGEuaW5mb31gO1xuICAgICAgICAgICAgdGhpcy4kLndhcm4hLmlubmVyVGV4dCA9IGAke2RhdGEud2Fybn1gO1xuICAgICAgICAgICAgdGhpcy4kLmVycm9yIS5pbm5lclRleHQgPSBgJHtkYXRhLmVycm9yfWA7XG5cbiAgICAgICAgICAgIHRoaXMuJC5pY29uSW5mbz8uc2V0QXR0cmlidXRlKCdjb2xvcicsIGRhdGEuaW5mbyA/ICd0cnVlJyA6ICdub3JtYWwnKTtcbiAgICAgICAgICAgIHRoaXMuJC5pY29uV2Fybj8uc2V0QXR0cmlidXRlKCdjb2xvcicsIGRhdGEud2FybiA/ICd0cnVlJyA6ICdub3JtYWwnKTtcbiAgICAgICAgICAgIHRoaXMuJC5pY29uRXJyb3I/LnNldEF0dHJpYnV0ZSgnY29sb3InLCBkYXRhLmVycm9yID8gJ3RydWUnIDogJ25vcm1hbCcpO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgYXN5bmMgcmVhZHkoKSB7XG4gICAgICAgIC8vIOS4uuS6huS4i+mdoueahOS6i+S7tue7keWumuWPr+S7peiOt+WPluecn+WunueahCB0aGlzXG4gICAgICAgIHRoaXMuY2xlYXIgPSB0aGlzLmNsZWFyLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMudXBkYXRlQ291bnRlciA9IHRoaXMudXBkYXRlQ291bnRlci5iaW5kKHRoaXMpO1xuXG4gICAgICAgIGNvbnN0ICRpY29uQm94cyA9IHRoaXMuJC5jb3VudGVyPy5xdWVyeVNlbGVjdG9yQWxsKCcuaWNvbi1ib3gnKTtcbiAgICAgICAgaWYgKCEkaWNvbkJveHMpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgQXJyYXkuZnJvbSgkaWNvbkJveHMpLmZvckVhY2goKGJveCkgPT4ge1xuICAgICAgICAgICAgYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKGUpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgY29uc3QgdHlwZSA9IGUuY3VycmVudFRhcmdldD8uZGF0YXNldD8udHlwZSBhcyBsb2dUeXBlO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaGFzQ29uc29sZSA9IGF3YWl0IEVkaXRvci5QYW5lbC5oYXMoJ2NvbnNvbGUnKTtcbiAgICAgICAgICAgICAgICBpZiAoaGFzQ29uc29sZSkge1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuUGFuZWwuZm9jdXMoJ2NvbnNvbGUnKTtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLk1lc3NhZ2Uuc2VuZCgnY29uc29sZScsICdyZWZyZXNoJywgdHlwZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4oJ2NvbnNvbGUnLCB0eXBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgRWRpdG9yLk1lc3NhZ2UuX19wcm90ZWN0ZWRfXy5hZGRCcm9hZGNhc3RMaXN0ZW5lcignY29uc29sZTpsb2dzVXBkYXRlJywgdGhpcy51cGRhdGVDb3VudGVyKTtcblxuICAgICAgICAvLyDmjInkuIvmuIXpmaTml6Xlv5fmjInpkq7nmoTml7blgJnvvIzpnIDopoHmuIXnqbrlvZPliY3mmL7npLrnmoTmloflrZdcbiAgICAgICAgRWRpdG9yLkxvZ2dlci5fX3Byb3RlY3RlZF9fLm9uKCdjbGVhcicsIHRoaXMuY2xlYXIpO1xuICAgIH0sXG4gICAgYXN5bmMgY2xvc2UoKSB7XG4gICAgICAgIEVkaXRvci5Mb2dnZXIuX19wcm90ZWN0ZWRfXy5yZW1vdmVMaXN0ZW5lcignY2xlYXInLCB0aGlzLmNsZWFyKTtcbiAgICAgICAgRWRpdG9yLk1lc3NhZ2UuX19wcm90ZWN0ZWRfXy5yZW1vdmVCcm9hZGNhc3RMaXN0ZW5lcignY29uc29sZTpsb2dzVXBkYXRlJywgdGhpcy51cGRhdGVDb3VudGVyKTtcbiAgICB9LFxufSk7XG4iXX0=