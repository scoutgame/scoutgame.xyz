"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
require("@testing-library/jest-dom");
var react_1 = require("@testing-library/react");
var user_event_1 = require("@testing-library/user-event");
var react_2 = require("react");
var testUtils_1 = require("../testUtils");
var confirmationDialogBox_1 = require("./confirmationDialogBox");
describe('/components/confirmationDialogBox', function () {
    var dialogPropsWithCnfrmBtnText = {
        heading: 'test-heading',
        subText: 'test-sub-text',
        confirmButtonText: 'test-btn-text',
        onConfirm: jest.fn(),
        onClose: jest.fn()
    };
    var dialogProps = {
        heading: 'test-heading',
        onConfirm: jest.fn(),
        onClose: jest.fn()
    };
    it('confirmDialog should match snapshot', function () { return __awaiter(void 0, void 0, void 0, function () {
        var container;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            result = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<confirmationDialogBox_1["default"] dialogBox={dialogPropsWithCnfrmBtnText}/>));
                            container = result.container;
                            return [2 /*return*/];
                        });
                    }); })];
                case 1:
                    _a.sent();
                    expect(container).toMatchSnapshot();
                    return [2 /*return*/];
            }
        });
    }); });
    it('confirmDialog with Confirm Button Text should match snapshot', function () { return __awaiter(void 0, void 0, void 0, function () {
        var containerWithCnfrmBtnText;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, react_1.act)(function () { return __awaiter(void 0, void 0, void 0, function () {
                        var result;
                        return __generator(this, function (_a) {
                            result = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<confirmationDialogBox_1["default"] dialogBox={dialogPropsWithCnfrmBtnText}/>));
                            containerWithCnfrmBtnText = result.container;
                            return [2 /*return*/];
                        });
                    }); })];
                case 1:
                    _a.sent();
                    expect(containerWithCnfrmBtnText).toMatchSnapshot();
                    return [2 /*return*/];
            }
        });
    }); });
    it('confirm button click, run onConfirm Function once', function () {
        var result = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<confirmationDialogBox_1["default"] dialogBox={dialogProps}/>));
        user_event_1["default"].click(result.getByTitle('Confirm'));
        expect(dialogProps.onConfirm).toBeCalledTimes(1);
    });
    it('confirm button (with passed prop text), run onConfirm Function once', function () {
        var resultWithConfirmBtnText = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<confirmationDialogBox_1["default"] dialogBox={dialogPropsWithCnfrmBtnText}/>));
        user_event_1["default"].click(resultWithConfirmBtnText.getByTitle(dialogPropsWithCnfrmBtnText.confirmButtonText));
        expect(dialogPropsWithCnfrmBtnText.onConfirm).toBeCalledTimes(1);
    });
    it('cancel button click runs onClose function', function () {
        var result = (0, react_1.render)((0, testUtils_1.wrapDNDIntl)(<confirmationDialogBox_1["default"] dialogBox={dialogProps}/>));
        user_event_1["default"].click(result.getByTitle('Cancel'));
        expect(dialogProps.onClose).toBeCalledTimes(1);
    });
});
