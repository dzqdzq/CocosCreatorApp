"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embeddedJsExtractor = void 0;
const selector_1 = require("../../selector");
const utils_1 = require("../../utils");
const validate_1 = require("../../../utils/validate");
function embeddedJsExtractor(selector, jsParser) {
    validate_1.Validate.required.nonEmptyString({ selector });
    validate_1.Validate.required.argument({ jsParser });
    let selectors = new selector_1.ElementSelectorSet(selector);
    return (node, fileName) => {
        if (typeof node.tagName !== 'string') {
            return;
        }
        let element = node;
        if (selectors.anyMatch(element)) {
            let source = utils_1.HtmlUtils.getElementContent(element, {
                trimWhiteSpace: false,
                preserveIndentation: true,
                replaceNewLines: false
            });
            jsParser.parseString(source, fileName, {
                lineNumberStart: element.sourceCodeLocation && element.sourceCodeLocation.startLine
            });
        }
    };
}
exports.embeddedJsExtractor = embeddedJsExtractor;
