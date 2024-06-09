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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv = require("dotenv");
dotenv.config();
var massa_web3_1 = require("@massalabs/massa-web3");
/** Consts section */
var debugMode = true;
var tgToken = getEnvVariable("ACHETA_TELEGRAM_TOKEN");
var tgChat = getEnvVariable("ACHETA_TELEGRAM_CHAT");
var tgURL = "https://api.telegram.org/bot".concat(tgToken, "/sendMessage?chat_id=").concat(tgChat, "&text=");
var tgCourierDelayMs = 2100;
var exchangeURL = "https://api.bitget.com/api/v2/spot/market/tickers?symbol=MASUSDT";
var exchangeDelayMs = 5000;
var publicApiURL = "https://mainnet.massa.net/api/v2";
var graphIntervalMs = 500;
var graphShiftMs = 120000;
var graphLookupMs = 500;
var operationLookupMs = 100;
var timeOrigin = Date.now() - graphShiftMs;
var graphStart;
var graphEnd;
var w3Client = new massa_web3_1.PublicApiClient({
    providers: [{
            url: publicApiURL,
            type: massa_web3_1.ProviderType.PUBLIC
        }],
    retryStrategyOn: true
});
/** End of Consts section */
/** Global vars section */
var massaPrice = {
    currentValue: 0.0,
    fixedValue: 0.0,
    tresholdPercent: 2,
};
var massaBlocks = new Array();
var massaOps = new Array();
var tgMessages = new Array();
/** End of Global vars section */
/** Tools */
function getEnvVariable(key) {
    var value = process.env[key];
    if (!value)
        throw new Error("Missing ".concat(key, " in .env file"));
    return value;
}
function sendTgMessage(tgMessage) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debugMode ? console.debug("Sending message '".concat(tgMessage, "' to chat '").concat(tgChat, "'")) : {};
                    return [4 /*yield*/, fetch(tgURL + tgMessage)
                            .then(function (response) {
                            if (response.ok) {
                                debugMode ? console.debug("Sent message '".concat(tgMessage, "' to chat '").concat(tgChat, "' with result '").concat(response.status, "' (").concat(response.statusText, ")")) : {};
                            }
                            else {
                                throw new Error("Cannot send message to tgChat ".concat(tgChat, ": ").concat(response.status, " (").concat(response.statusText, ")"));
                            }
                            return true;
                        })
                            .catch(function (err) {
                            console.error(err);
                            return false;
                        })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/** End of Tools */
/**
 * TG Courier
 */
setInterval(function () {
    return __awaiter(this, void 0, void 0, function () {
        var tgMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debugMode ? console.debug("TG Courier interval run") : {};
                    tgMessage = tgMessages.shift();
                    if (tgMessage === undefined) {
                        debugMode ? console.debug("No TG messages in Array") : {};
                        return [2 /*return*/];
                    }
                    else {
                        debugMode ?
                            console.debug("Found '".concat(tgMessage, "' message in queue, trying to deliver...")) :
                            console.log("Found another message in tgQueue, trying to deliver...");
                    }
                    return [4 /*yield*/, sendTgMessage(tgMessage)];
                case 1:
                    (_a.sent()) ?
                        console.log("Sent TG message successfully") :
                        console.log("Error sending TG message");
                    return [2 /*return*/];
            }
        });
    });
}, tgCourierDelayMs);
/**
 * Update MAS price
 *
 * Get new value every ${exchangeDelayMS} milliseconds from ${exchangeURL}
 * If the new price differs from the old one by more than a ${massaPriceTresholdPercent}, the notification procedure is called.
 */
setInterval(function () {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    debugMode ? console.debug("MAS Price updater interval run") : {};
                    return [4 /*yield*/, fetch(exchangeURL)
                            .then(function (response) {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!response.ok) {
                                                throw new Error("Cannot fetch from '".concat(exchangeURL, "': ").concat(response.status, " (").concat(response.statusText, ")"));
                                            }
                                            else {
                                                debugMode ? console.debug("MAS Price update got ".concat(response.status, " with ").concat(response.text, " value")) : {};
                                            }
                                            return [4 /*yield*/, response.json()];
                                        case 1: return [2 /*return*/, _a.sent()];
                                    }
                                });
                            });
                        })
                            .then(function (data) {
                            return __awaiter(this, void 0, void 0, function () {
                                var massaPriceDiff;
                                return __generator(this, function (_a) {
                                    if (data['msg'] != "success") {
                                        throw new Error("Wrong msg value: '".concat(data['msg'], "'"));
                                    }
                                    else {
                                        debugMode ? console.log("Got ".concat(data, " from exchange, new MAS Price value: ").concat(data['data'].at(-1)['lastPr'], ", fixedValue: ").concat(massaPrice.fixedValue)) : {};
                                        massaPrice.currentValue = parseFloat(data['data'].at(-1)['lastPr']);
                                    }
                                    massaPriceDiff = massaPrice.currentValue - massaPrice.fixedValue;
                                    if (Math.abs(massaPriceDiff) > (massaPrice.fixedValue / 100 * massaPrice.tresholdPercent)) {
                                        (massaPriceDiff >= 0) ?
                                            tgMessages.push(" \uD83D\uDFE2 MAS Price: ".concat(massaPrice.fixedValue, " \u2192 ").concat(massaPrice.currentValue, " USDT")) :
                                            tgMessages.push(" \uD83D\uDD34 MAS Price: ".concat(massaPrice.fixedValue, " \u2192 ").concat(massaPrice.currentValue, " USDT"));
                                        massaPrice.fixedValue = massaPrice.currentValue;
                                    }
                                    return [2 /*return*/];
                                });
                            });
                        })
                            .catch(function (err) { console.log(err); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}, exchangeDelayMs);
