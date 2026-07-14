"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQR = generateQR;
const qrcode_1 = __importDefault(require("qrcode"));
async function generateQR(data) {
    return qrcode_1.default.toDataURL(data, { width: 256, margin: 2 });
}
//# sourceMappingURL=qr.js.map