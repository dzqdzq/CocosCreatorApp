const { expect, should } = require('chai');
const exp = require('constants');
const { UndoCommand, UndoManagerBase} = require('../dist/script/export/undo/base');

describe('undo系统基类测试', () => {
    describe('UndoCommand测试', () => {
        it('默认值', () => {
            const command = new UndoCommand();
            expect(command.tag).to.equal('');
            command.tag = 'test tag';
            expect(command.tag).to.equal('test tag');
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

        it('默认值检查', () => {
            
        });
  
        it('push', () => {
            expect(undo.isDirty()).to.equal(false);
            undo.push(c1);
            undo.push(c2);
            undo.push(m1);
            undo.push(m2);
            expect(undo._commandArray.length).to.equal(4);
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
            await undo.undo();
            expect(undo._commandArray.length).to.equal(4);
            expect(undo._commandArray[undo._commandArray.length - 1]._forUndo).to.equal(true);
            
            undo.push(m2);
            await undo.undo();

            expect(undo._commandArray.length).to.equal(6);
            expect(undo._commandArray[undo._commandArray.length - 1]._forUndo).to.equal(true);

            await undo.undo();
            expect(undo._commandArray.length).to.equal(7);
            expect(undo._commandArray[undo._commandArray.length - 1]._originalCommand).to.equal(m2);
        });

        it('push', async () => {
            undo.push(m2);
            expect(undo._commandArray.length).to.equal(6);
            await undo.undo();
            expect(undo._commandArray.length).to.equal(7);
            expect(undo._commandArray[undo._commandArray.length - 1]._forUndo).to.equal(true);  
        });

        it('save and is dirty', async () => {

            expect(undo.isDirty()).to.equal(true);
            undo.save();
            expect(undo.isDirty()).to.equal(false);

        });

        it('redo', async () => {
            // 确认command.undo有被调用
            await undo.redo();
            expect(undo._commandArray.length).to.equal(8);
            expect(undo.isDirty()).to.equal(true);
        });

        it('reset', () => {
            undo.reset();
            expect(undo._commandArray.length).to.equal(0);
            should(undo._lastSavedCommand).not.exist();
            expect(undo.isDirty()).to.equal(false);
        });

        // it('maxCommandSize', () => {
        //     undo.reset();
        //     undo.maxCommandSize = 3;
        //     undo.push(c1);
        //     undo.push(c2);
        //     undo.push(m1);
        //     undo.push(m2);
        //     expect(undo._commandArray.length).to.equal(3);
        //     expect(undo._commandArray.includes(c1)).to.equal(false);
        //     expect(undo._commandArray.includes(c2)).to.equal(true);
        //     expect(undo._commandArray.includes(m1)).to.equal(true);
        //     expect(undo._commandArray.includes(m2)).to.equal(true);
        //     undo.maxCommandSize = 200;
        // });

        // it('remove', () => {
        //     undo.reset();
        //     undo.push(c1);
        //     undo.push(c2);
        //     undo.push(m1);
        //     undo.push(m2);
        //     expect(undo._commandArray.length).to.equal(4);
        //     expect(undo._index).to.equal(3);
        //     undo.remove(m1);
        //     expect(undo._commandArray.length).to.equal(3);
        //     expect(undo._index).to.equal(2);
        //     expect(undo._commandArray.includes(m1)).to.equal(false);
        //     expect(undo._commandArray.includes(m2)).to.equal(true);
        //     expect(undo._commandArray.includes(c1)).to.equal(true);
        //     expect(undo._commandArray.includes(c2)).to.equal(true);
        // });

        // describe('merge and split', () => {
        //     it('push commands:c1->c2->m1->m2->c3 and merge', () => {
        //         undo.reset();
        //         undo.push(c1);
        //         undo.push(c2);
        //         undo.push(m1);
        //         undo.push(m2);
        //         undo.push(c3);

        //         undo.merge('');
        //         expect(undo._commandArray.length).to.equal(5);
        //         expect(undo._index).to.equal(4);
        //         should(c1.groupCommands).not.exist();
        //         should(c2.groupCommands).not.exist();
        //         should(c3.groupCommands).not.exist();

        //         undo.merge('group1');
        //         expect(undo._commandArray.length).to.equal(4);
        //         expect(undo._index).to.equal(3);
        //         expect(undo._commandArray.includes(m1)).to.equal(false);
        //         expect(m2.groupCommands.length).to.equal(1);
        //         expect(m2.groupCommands.includes(m1)).to.equal(true);
        //         should(c1.groupCommands).not.exist();
        //         should(c2.groupCommands).not.exist();
        //         should(c3.groupCommands).not.exist();

        //     });

        //     it('undo', async () => {
        //         await undo.undo();
        //         expect(undo._index).to.equal(2);
        //         expect(undo._commandArray.length).to.equal(4);
        //         // to do mock undo function;
        //         await undo.undo();
        //         expect(undo._index).to.equal(1);
        //         expect(undo._commandArray.length).to.equal(4);

        //         await undo.undo();
        //         expect(undo._index).to.equal(0);
        //         expect(undo._commandArray.length).to.equal(4);
                
        //         await undo.undo();
        //         expect(undo._index).to.equal(-1);
        //         expect(undo._commandArray.length).to.equal(4);

        //         await undo.undo();
        //         expect(undo._index).to.equal(-1);
        //     });

        //     it('redo', async () => {
        //         await undo.redo();
        //         expect(undo._index).to.equal(0);

        //         await undo.redo();
        //         expect(undo._index).to.equal(1);

        //         await undo.redo();
        //         expect(undo._index).to.equal(2);

        //         await undo.redo();
        //         expect(undo._index).to.equal(3);
        //         expect(undo._commandArray.length).to.equal(4);

        //         await undo.redo();
        //         expect(undo._index).to.equal(3);
        //         expect(undo._commandArray.length).to.equal(4);
        //     });

        //     it('split when no undo performed', () => {
        //         undo.split('group1');
        //         expect(undo._index).to.equal(4);
        //         expect(undo._commandArray.length).to.equal(5);
        //         expect(undo._commandArray[2]).to.equal(m1);
        //         expect(undo._commandArray[3]).to.equal(m2);
        //         should(m2.groupCommands).not.exist();
        //         should(m1.groupCommands).not.exist();
        //     });
            
        //     it('merge when m2 is undo', async () => {
        //         await undo.undo();
        //         await undo.undo();
        //         expect(undo._index).to.equal(2);
        //         expect(undo._commandArray[2]).to.equal(m1);
        //         // _index => m1 
        //         undo.merge('group1');
        //         expect(undo._index).to.equal(2);
        //         expect(undo._commandArray.length).to.equal(4);
        //         expect(undo._commandArray.includes(m2)).to.equal(false);
                
        //         should(m1.groupCommands).not.exist();
        //         should(m2.groupCommands).not.exist();
        //     });
        // });

    });

});
