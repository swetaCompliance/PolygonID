import express from 'express';
import {
  healthCheck,
  createPolygonId,
  createAgeCreadential,
  createKYCCreadential,
  createKYBCreadential,
  createSanctionCreadential,
  createPEPCreadential,
  createAccCreadential
} from './polyController';


const app = express();
app.use(express.json());


// create polygon Id
app.get('/healthCheck', healthCheck);
app.get('/createPolygonId', createPolygonId);
app.get('/createAgeCreadential',createAgeCreadential);
app.get('/createKYCCreadential',createKYCCreadential);
app.get('/createKYBCreadential',createKYBCreadential);
app.get('/createSanctionCreadential',createSanctionCreadential);
app.get('/createPEPCreadential',createPEPCreadential);
app.get('/createAccCreadential', createAccCreadential);




const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});