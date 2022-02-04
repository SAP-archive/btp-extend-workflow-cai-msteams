
/**
 * appRouter.js provides the express routes used by the client app (React component)
 * to retrieve data to be displayed in the UI or to trigger actions like approving
 * or rejecting a leave request in SAP SuccessFactors
 */

import { Router } from 'express'

// Load custom modules
import AuthClient from '../../services/AuthClient.js'
import GraphClient  from '../../services/GraphClient.js'
import SfsfClient  from '../../services/SfsfClient.js'

const appRouter = Router();

// Route to read a specific leave request from SAP SuccessFactors
appRouter.get('/sfsf/leaverequest/:leaveRequestId', async (req, res) => {
    try {
        const data = {
            leaveRequestId : req.params.leaveRequestId
        }
        const authClient = new AuthClient();
        const client = new SfsfClient();
        const token = await authClient.getAccessTokenForBtpAccess(req);
        const result = await client.getLeaveRequest(token, data);
        res.json(result);

    }catch(error){
        res.status(500).send(error.message ? error.message : 'Internal server error!');
    }
});


// Route to update a workflow within SAP SuccessFactors
appRouter.post('/sfsf/workflow/', async (req, res) => {
    try {
        const authClient = new AuthClient();
        const client = new SfsfClient();
        const token = await authClient.getAccessTokenForBtpAccess(req);
        const result = await client.updateWorkflow(token, req.body.data);
        res.json(result);
    }catch(error){
        res.status(500).send(error.message ? error.message : 'Internal server error!');
    }
});


// Route to read the details of a specific workflow from SAP SuccessFactors
appRouter.get('/sfsf/workflow/:workflowId', async (req, res) => {
    try {
        const data = {
            workflowId : req.params.workflowId,
        }

        const authClient = new AuthClient();
        const client = new SfsfClient();
        const token = await authClient.getAccessTokenForBtpAccess(req);
        const result = await client.getWorkflow(token, data);
        res.json(result);

    }catch(error){
        res.status(500).send(error.message ? error.message : 'Internal server error!');
    }
});


// Route to get a user's Microsoft Graph profile information (Currently not in use)
appRouter.post('/user/profile', async (req, res) => {
    try {
        const userId = req.body.userId;
        const authClient = new AuthClient();
        const token = await authClient.getAccessTokenForGraphAccess(req);
        const client = new GraphClient(token);
        const profile = await client.getUserProfile(userId);
        res.json(profile);

    }catch(error){
        console.error(error);
        // Catch scenarios where user consent is required
        if(error.error === 'invalid_grant' || error.error === 'interaction_required'){
            res.status(500).send(error.error);
        }
        res.status(500).send(error.message ? error.message : 'Internal server error!');
    }
});


// Route to get a user's profile photo from Microsoft Graph (Currently not in use!)
appRouter.post('/user/photo', async (req, res) => {
    try {
        const userId = req.body.userId;
        const authClient = new AuthClient();
        const token = await authClient.getAccessTokenForGraphAccess(req);
        const client = new GraphClient(token);
        const photo = await client.getUserPhoto(userId);
        res.json(photo);

    }catch(error){
        console.error(error);

        if(error.error === 'invalid_grant' || error.error === 'interaction_required'){
            res.status(500).send(error.error);
        }
        res.status(500).send(error.message ? error.message : 'Internal server error!');
    }
    
});


export default appRouter;
