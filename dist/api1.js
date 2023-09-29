"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const assetController_1 = require("./controller/assetController");
const walletController_1 = require("./controller/walletController");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.post('/createAsset', assetController_1.createAsset);
app.post('/signTransaction/:assetId', assetController_1.signTransaction);
app.post('/whitelist/:assetId', assetController_1.whitelist);
app.post('/mint/:assetId', assetController_1.mint);
app.post('/transfer/:assetId', assetController_1.transfer);
app.get('/generate-wallet', walletController_1.generateWallet);
app.get('/isWhiteListed/:assetId/:address', assetController_1.isWhiteListed);
app.get('/assets/:assetId', assetController_1.assets);
app.get('/assetBalance/:assetId/:address', assetController_1.assetBalance);
app.get('/existingSupply/:assetId/', assetController_1.existingSupply);
// create polygon Id
app.get('/createPolygonId', createPolygonId);
//create zkp credential
app.post('/createAgeCredentials', createAgeCredentials);
app.post('/createKYCCredentials', createKYCCredentials);
app.post('/createKYBCredentials', createKYCBredentials);
app.post('/createAccrediationCredentials', createAccrediationCredentials);
app.post('/createSanctionCredentials', createSanctionCredentials);
app.post('/createPEPCredentials', createPEPCredentials);
app.post('/createTxMonitoringCredentials', createTxMonitoringCredentials);
//issue zkp credentials
app.post('/issueAgeCredentials', issueAgeCredentials);
app.post('/issueKYCCredentials', issueKYCCredentials);
app.post('/issueKYBCredentials', issueKYCBredentials);
app.post('/issueAccrediationCredentials', issueAccrediationCredentials);
app.post('/issuePEPCredentials', issuePEPCredentials);
app.post('/issueSanctionCredentials', issueSanctionCredentials);
app.post('/issueTxMonitoringCredentials', issueTxMonitoringCredentials);
// set zkp request
app.post('/setAgeZkpRequest', setAgeZkpRequest);
app.post('/setKYCZkpRequest', setKYCZkpRequest);
app.post('/setKYBCZkpRequest', setKYBCZkpRequest);
app.post('/setAccrediationZkpRequest', setAccrediationZkpRequest);
app.post('/setSanctionZkpRequest', setSanctionZkpRequest);
app.post('/setPEPZkpRequest', setPEPZkpRequest);
app.post('/setTxMonitoringZkpRequest', setTxMonitoringZkpRequest);
// verify zkp proof
app.post('/verifyAgeZkpRequest', verifyAgeZkpRequest);
app.post('/verifyKYCZkpRequest', verifyKYCZkpRequest);
app.post('/verifyKYBCZkpRequest', verifyKYBCZkpRequest);
app.post('/verifyAccrediationZkpRequest', verifyAccrediationZkpRequest);
app.post('/verifySanctionZkpRequest', verifySanctionZkpRequest);
app.post('/verifyPEPZkpRequest', verifyPEPZkpRequest);
app.post('/verifyTxMonitoringZkpRequest', verifyTxMonitoringZkpRequest);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=api1.js.map