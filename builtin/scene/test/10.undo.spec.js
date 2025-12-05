const { expect, should } = require('chai');
const exp = require('constants');
const { UndoCommand, UndoManagerBase} = require('../dist/script/export/undo/base');

describe('undo系统基类测试', () => {
    describe('UndoCommand测试', () => {
        it('接口校验', () => {
            const command = new UndoCommand();
            expect(typeof(command.toPerformUndo)).to.equal('boolean');
            expect(typeof(command.perform)).to.equal('function');
            expect(typeof(command.undo)).to.equal('function');
            expect(typeof(command.redo)).to.equal('function');
        });
    });

    describe('UndoManagerBase类', () => {
        const undo = new UndoManagerBase();

        const c1 = new UndoCommand();
        c1.tag = 'command1';

        const c2 = new UndoCommand();
        c2.tag = 'command2';

        const c3 = new UndoCommand();
        c3.tag = 'command3';

        const m1 = new UndoCommand();
        m1.tag = 'commandGroup1';

        const m2 = new UndoCommand();
        m2.tag = 'commandGroup2';
        function checkMultiCollaboration(size) {
            if (undo._multiCollaboration) {
                expect(undo._multiCommandArray.length).to.equal(size);
            }
        }
        it('接口检查', () => {
            expect(typeof(undo._commandArray)).to.equal('object');
            expect(typeof(undo._index)).to.equal('number');
            expect(typeof(undo._multiCollaboration)).to.equal('boolean');
            expect(typeof(undo._multiCommandArray)).to.equal('object');
            expect(typeof(undo.undo)).to.equal('function');
            expect(typeof(undo.redo)).to.equal('function');
            expect(typeof(undo.push)).to.equal('function');
            expect(typeof(undo.reset)).to.equal('function');
            expect(typeof(undo.save)).to.equal('function');
            expect(typeof(undo.isDirty)).to.equal('function');
        });
  
        it('push', () => {
            expect(undo.isDirty()).to.equal(false);
            undo.push(c1);
            undo.push(c2);
            undo.push(m1);
            undo.push(m2);
            expect(undo._commandArray.length).to.equal(4);
            checkMultiCollaboration(4);
            expect(undo._commandArray[0]).to.equal(c1);
            expect(undo._commandArray[1]).to.equal(c2);
            expect(undo._commandArray[2]).to.equal(m1);
            expect(undo._commandArray[3]).to.equal(m2);

        });
        
        it('undo', async () => {
            // 确认command.undo有被调用
            undo.reset();
            undo.push(c1);
            undo.push(c2);
            undo.push(m1);
            expect(undo._index).to.equal(2);
            await undo.undo();
            expect(undo._index).to.equal(1);
            expect(undo._commandArray.length).to.equal(3);
            checkMultiCollaboration(4);
            expect(undo._commandArray[undo._commandArray.length - 1].toPerformUndo).to.equal(true);
            
            undo.push(m2);
            expect(undo._index).to.equal(2);
            expect(undo._commandArray.length).to.equal(3);
            checkMultiCollaboration(5);
            expect(undo._commandArray[0]).to.equal(c1);
            expect(undo._commandArray[1]).to.equal(c2);
            expect(undo._commandArray[2]).to.equal(m2);

            await undo.undo();
            expect(undo._index).to.equal(1);
            expect(undo._commandArray.length).to.equal(3);
            checkMultiCollaboration(6);
            expect(undo._commandArray[2].toPerformUndo).to.equal(true);
            expect(undo._commandArray[2]).to.equal(m2);

            await undo.undo();
            expect(undo._index).to.equal(0);
            expect(undo._commandArray.length).to.equal(3);
            checkMultiCollaboration(7);
            expect(undo._commandArray[1].toPerformUndo).to.equal(true);
            expect(undo._commandArray[1]).to.equal(c2);
        });
        // c1 c2 m2 index = 0
        it('save and is dirty', async () => {

            expect(undo.isDirty()).to.equal(true);
            undo.save();
            expect(undo.isDirty()).to.equal(false);
            
        });

        it('redo', async () => {
            // 确认command.undo有被调用
            await undo.redo();
            checkMultiCollaboration(8);
            expect(undo._commandArray[undo._index - 1].toPerformUndo).to.equal(false);
            expect(undo._index).to.equal(1);
            expect(undo.isDirty()).to.equal(true);
        });

        it('reset', async () => {
            undo.reset();
            expect(undo._commandArray.length).to.equal(0);
            should(undo._lastSavedCommand).not.exist();
            expect(undo.isDirty()).to.equal(false);
        });

    });

});
