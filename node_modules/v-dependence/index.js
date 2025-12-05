'use strict';

const Manager = require('./classify/manager');

exports.create = function() {
    return new Manager();
};
