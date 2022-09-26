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
var react_1 = require("react");
var react_redux_1 = require("react-redux");
var react_2 = require("@testing-library/react");
var redux_mock_store_1 = require("redux-mock-store");
require("@testing-library/jest-dom");
var testUtils_1 = require("../../testUtils");
require("isomorphic-fetch");
var testBlockFactory_1 = require("../../test/testBlockFactory");
var tableRow_1 = require("./tableRow");
describe('components/table/TableRow', function () {
    var _a;
    var board = testBlockFactory_1.TestBlockFactory.createBoard();
    var view = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    var view2 = testBlockFactory_1.TestBlockFactory.createBoardView(board);
    view2.fields.sortOptions = [];
    var card = testBlockFactory_1.TestBlockFactory.createCard(board);
    var cardTemplate = testBlockFactory_1.TestBlockFactory.createCard(board);
    cardTemplate.fields.isTemplate = true;
    var state = {
        users: {},
        comments: {
            comments: {}
        },
        contents: {
            contents: {}
        },
        cards: {
            cards: (_a = {},
                _a[card.id] = card,
                _a)
        }
    };
    var mockStore = (0, redux_mock_store_1["default"])([]);
    test('should match snapshot', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store, component, container;
        return __generator(this, function (_a) {
            store = mockStore(state);
            component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <tableRow_1["default"] board={board} activeView={view} card={card} isSelected={false} focusOnMount={false} onSaveWithEnter={jest.fn()} showCard={jest.fn()} readonly={false} offset={0} resizingColumn='' columnRefs={new Map()} onDrop={jest.fn()}/>
      </react_redux_1.Provider>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot, read-only', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store, component, container;
        return __generator(this, function (_a) {
            store = mockStore(state);
            component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <tableRow_1["default"] board={board} card={card} activeView={view} isSelected={false} focusOnMount={false} onSaveWithEnter={jest.fn()} showCard={jest.fn()} readonly={true} offset={0} resizingColumn='' columnRefs={new Map()} onDrop={jest.fn()}/>
      </react_redux_1.Provider>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot, isSelected', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store, component, container;
        return __generator(this, function (_a) {
            store = mockStore(state);
            component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <tableRow_1["default"] board={board} card={card} activeView={view} isSelected={true} focusOnMount={false} onSaveWithEnter={jest.fn()} showCard={jest.fn()} readonly={false} offset={0} resizingColumn='' columnRefs={new Map()} onDrop={jest.fn()}/>
      </react_redux_1.Provider>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot, collapsed tree', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store, component, container;
        return __generator(this, function (_a) {
            view.fields.collapsedOptionIds = ['value1'];
            view.fields.hiddenOptionIds = [];
            store = mockStore(state);
            component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <tableRow_1["default"] board={board} card={card} activeView={view} isSelected={false} focusOnMount={false} onSaveWithEnter={jest.fn()} showCard={jest.fn()} readonly={false} offset={0} resizingColumn='' columnRefs={new Map()} onDrop={jest.fn()}/>
      </react_redux_1.Provider>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot, display properties', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store, component, container;
        return __generator(this, function (_a) {
            view.fields.visiblePropertyIds = ['property1', 'property2'];
            store = mockStore(state);
            component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <tableRow_1["default"] board={board} card={card} activeView={view} isSelected={false} focusOnMount={false} onSaveWithEnter={jest.fn()} showCard={jest.fn()} readonly={false} offset={0} resizingColumn='' columnRefs={new Map()} onDrop={jest.fn()}/>
      </react_redux_1.Provider>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
    test('should match snapshot, resizing column', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store, component, container;
        return __generator(this, function (_a) {
            view.fields.visiblePropertyIds = ['property1', 'property2'];
            store = mockStore(state);
            component = (0, testUtils_1.wrapDNDIntl)(<react_redux_1.Provider store={store}>
        <tableRow_1["default"] board={board} card={card} activeView={view} isSelected={false} focusOnMount={false} onSaveWithEnter={jest.fn()} showCard={jest.fn()} readonly={false} offset={0} resizingColumn='property1' columnRefs={new Map()} onDrop={jest.fn()}/>
      </react_redux_1.Provider>);
            container = (0, react_2.render)(component).container;
            expect(container).toMatchSnapshot();
            return [2 /*return*/];
        });
    }); });
});
