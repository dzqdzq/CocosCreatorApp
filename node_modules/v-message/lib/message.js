'use strict';

const utils = require('./utils');

class Message {

    constructor () {
        this._map = {};
        this._current = null;
    }

    /**
     * 注册一个消息类型
     * @param {string} type 
     */
    register (type) {
        this._map[type] = this._map[type] || {};
    }

    /**
     * 切换一个消息类型
     * @param {string} type 
     */
    switch (type) {
        this._current = this._map[type] || null;
    }

    /**
     * 传入一个对象，将对象内标注的元素全部加到 cache 内
     * @param {object} object 
     * @param {*} options 
     */
    append (object, options) {
        if (!this._current) {
            throw new Error('The specified type may not exist.');
        }

        if (typeof object !== 'object' || Array.isArray(object)) {
            throw new Error(`Append can only pass in one object`);
        }
    
        utils.deepCopyObject(this._current, object);
    }

    /**
     * 传入一个对象，将对象内标注的元素全部剔除
     * @param {object} object 
     * @param {*} options 
     */
    subtract (object, options) {
        if (!this._current) {
            throw new Error('The specified type may not exist.');
        }

        if (typeof object !== 'object' || Array.isArray(object)) {
            throw new Error(`Subtract can only pass in one object`);
        }

        utils.deepEliminateObject(this._current, object);
    }

    /**
     * 传入 key，建立相应的数据
     * @param {string} key 
     * @param {string} value 
     */
    add (key, value) {
        if (!this._current) {
            throw new Error('The specified type may not exist.');
        }

        let data = this._current;
        let paths = key.split('.');
        let last = paths.pop();
        paths.forEach((key) => {
            data[key] = data[key] || (isNaN(key - 0) ? {} : []);
            data = data[key];
        });
        data[last] = value;
    }

    /**
     * 传入 key，删除相应的数据
     * @param {string} key 
     */
    remove (key) {
        if (!this._current) {
            throw new Error('The specified type may not exist.');
        }
    
        let data = this._current;
        let paths = key.split('.');
        let last = paths.pop();
        paths.some((key) => {
            if (data && typeof data === 'object' && key in data) {
                data = data[key];
                return false;
            }
            data = null;
            return true;
        });
        if (data && typeof data === 'object' && last in data) {
            delete data[last];
        }
    }

    /**
     * 传入一个 key，查询对应的数据
     * @param {string} key 
     */
    query (key) {
        if (!this._current) {
            return '';
        }

        let data = this._current;
        let paths = key.split('.');
        let last = paths.pop();

        for (let i=0; i<paths.length; i++) {
            let key = paths[i];
            if (!data[key]) {
                return '';
            }
            data = data[key];
        }
        return data[last] || '';
    }
}

module.exports = Message;