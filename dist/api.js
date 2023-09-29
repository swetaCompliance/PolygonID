"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const polyController_1 = require("./polyController/polyController");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// create polygon Id
app.get('/healthCheck', polyController_1.healthCheck);
app.get('/createPolygonId', polyController_1.createPolygonId);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=api.js.map