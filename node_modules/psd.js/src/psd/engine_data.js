var iconv = require('iconv-lite')
// engineData is an array form descriptor.coffee

var MATCH_TYPE = [  hashStart,
                    hashEnd,
                    multiLineArrayStart,
                    multiLineArrayEnd,
                    property, 
                    unknownTag,
                    boolean,
                    number,
                    numberWithDecimal,
                    string];

var index = 0;
var originText = '';


var parseEngineData = function(engineData){
    originText = codeToString(engineData);
    
    var result = hashStart(originText).parse();

    return result;
}


function parseToken(text) {
    var divider = /[ \n\t]+/;
    var utf16_start = /\(\xfe\xff/;
    var utf16_end = /[^\\]\)/;
    var subIndex = 0;
    
    function getText() {
        var subText = text.substring(subIndex);
        var token = '';
        var start = utf16_start.exec(subText);
        if(start && start.index === 0) {
            var end = utf16_end.exec(subText);
            if(end.index > 0) {
                var lastIndex = end.index + end[0].length;
                token = subText.substring(0, lastIndex);
                subIndex += lastIndex;
            }
        }
        else {
            var match = divider.exec(subText);
            if(match) {
                token = subText.substring(0, match.index);
                subIndex = subIndex + match.index + match[0].length;
                if(token === '') {
                    return getText();
                }
            } else {
                token = subText.substring(subIndex);
                index += subText.length;
            }
        }

        index += subIndex;
        for(var currentType in MATCH_TYPE) {
            var parser = new MATCH_TYPE[currentType](token);
            if (parser.match){
                return {
                    parser,
                    token
                }
            }
        }
    }

    return getText();
}


function codeToString(engineData){
    return String.fromCharCode.apply(null, engineData);
}


// helper fun
function Match(reg, text){
    return reg.test(text);
}

// tyep reg
function hashStart(text){
    var reg = /^<<$/;

    return {
        type: 'hashStart',
        match: Match(reg, text),
        parse: function(){
            var obj = {};
            while(index < originText.length) {
                var kResult = parseToken(originText.substring(index));
                var kParser = kResult.parser;
                var key = '';
                var value = '';
                if(kParser.type == 'property') {
                    key = kParser.parse();
                    var vResult = parseToken(originText.substring(index));
                    var vParser = vResult.parser;
                    if(vParser.type === 'multiLineArrayStart' || vParser.type === 'hashStart') {
                        value = vParser.parse(originText.substring(index));
                    }
                    else if(vParser) {
                        value = vParser.parse();
                    }
                    
                    obj[key] = value;
                }
                else if(kParser.type == 'hashEnd') {
                    break;
                }
            }

            return obj;
        }
    }
}
function hashEnd(text){
    var reg = /^>>(\x00)*$/;

    return {
        type: 'hashEnd',
        match: Match(reg, text)
    }
}
function multiLineArrayStart(text){
    var reg = /^\[$/;

    return {
        type: 'multiLineArrayStart',
        match: Match(reg, text),
        parse: function(){
            var dataArray = [];

            while(index < originText.length) {
                var vResult = parseToken(originText.substring(index));
                var vParser = vResult.parser;
                var value = '';
                
                if(vParser.type == 'multiLineArrayEnd') {
                    break;
                }

                if(vParser.type === 'multiLineArrayStart' || vParser.type === 'hashStart') {
                    value = vParser.parse(originText.substring(index));
                }
                else if(vParser) {
                    value = vParser.parse();
                }

                dataArray.push(value);
            }

            return dataArray;
        }
    }
}
function multiLineArrayEnd(text){
    var reg = /^\]$/;

    return {
        type: 'multiLineArrayEnd',
        match: Match(reg, text)
    }
}
function property(text){
    var reg = /^\/([a-zA-Z0-9]+)$/i;

    return {
        type: 'property',
        match: Match(reg, text),
        parse: function(){
            return text.match(reg)[1];
        }
    }
}
// value reg
function boolean(text){
    var reg = /^(true|false)$/;
    return {
        type: 'boolean',
        match: Match(reg, text),
        parse: function(){
            return text === 'true'? true:false;
        }
    }
}
function number(text){
    var reg = /^-?\d+$/;
    return {
        type: 'number',
        match: Match(reg, text),
        parse: function(){
            return Number(text);
        }
    }
}
function numberWithDecimal(text){
    var reg = /^(-?\d*)\.(\d+)$/;
    return {
        type: 'numberWithDecimal',
        match: Match(reg, text),
        parse: function(){
            return Number(text);
        }
    }
}
function unknownTag(text){
    //单行数组似乎只有数字数组的情况
    var reg = /^\([a-zA-Z0-9]*\)$/;
    return {
        type: 'unknownTag',
        match: Match(reg, text),
        parse: function(){
            return text;
        }
    }
}

function string(text){
    //the text in editor has some encoding issues
    var reg = /^\((\xfe\xff([^\)]|\\\))*)\)$/;
    return {
        name: 'string',
        match: Match(reg, text),
        parse: function(){
            var txt = text.match(reg)[1];
            var bf = [];
            for (var i=0,l=txt.length;i<l;i++){
                bf.push(txt.charCodeAt(i));
            }
            return iconv.decode(new Buffer(bf), 'utf-16');//it`s utf-16 with bom
        }
    }
}

module.exports = parseEngineData;