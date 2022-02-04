
/**
 * notifyRouter.js provides the express routes used by SAP Cloud Integration 
 * to send notifications to the Microsoft Teams extension app. This route is secured 
 * by XSUAA via the respective passport strategy (see index.js in root folder)
 */

import { Router } from 'express'
import { MessageFactory } from 'botbuilder'

// Load the custom modules and functions
import GraphClient from '../../services/GraphClient.js'
import AuthClient from '../../services/AuthClient.js'
import adapter from '../../bots/botAdapter.js';
import botActivityHandler from '../../bots/botActivityHandler.js';
import * as adaptiveCards from '../../models/adaptiveCard.js'

const notifyRouter = Router()

// All notifications sent to the Microsoft Teams extension application are send to this
// express route by SAP Cloud Integration
notifyRouter.post('/notifyUser', async (req, res) => {

    // Check if body of request contains a notification else return error
    if (!req.body.Notification){ res.status(400).send('invalid parameters') };
    // Check if notification contains the LeaveRequest object else return error
    if (!req.body.Notification.LeaveRequest){ res.status(400).send('invalid parameters') };

    // Extract relevant leave request information from notification
    const leaveRequestDetails = req.body.Notification.LeaveRequest.Details.EmployeeTime.EmployeeTime;

    // If no status is sent, return error
    if (!leaveRequestDetails.approvalStatus){ res.status(400).send('invalid parameters') };

     // status
    const approvalStatus = leaveRequestDetails.approvalStatus;
    // id of the leave request
    const leaveRequestId = leaveRequestDetails.externalCode;
    // startDate
    var startDate = leaveRequestDetails.startDate
    // endDate
    var endDate = leaveRequestDetails.endDate
    // timeType
    const timeType = leaveRequestDetails.timeType
    // receiver of triggered notification
    const receiverMail = req.body.Notification.receiverMail;
    

    // In case a leave request has been created it is in Status PENDING
    if (approvalStatus.toUpperCase() === 'PENDING') {
        // Check if workflow information is available in notification, else send error
        if (!req.body.Notification.Workflow) { res.status(400).send('invalid parameters') };

        // id of the workflow and stepId
        var workflowId = req.body.Notification.Workflow.WfRequest.WfRequest.wfRequestId;
        var workflowStepId = req.body.Notification.Workflow.WfRequest.WfRequest.wfRequestStepNav.WfRequestStep.wfRequestStepId;

        // extract sender of notification
        var senderMail = req.body.Notification.senderMail;

        // Another check if all required variables are filled to send the adaptive card to the enduser
        if (!workflowId || !workflowStepId || !senderMail || !receiverMail || !startDate || !endDate || !timeType) {
            res.status(400).send('invalid parameters');

        } else {
            // Get Graph access token with Application permissions as no user context is available 
            // which could be used for on_behalf_of access
            const authClient = new AuthClient();
            const token = await authClient.getAccessTokenForApplication();

            const client = new GraphClient(token);

            // Load Microsoft Graph profile information of receiver and sender (Name, Azure Id aso) 
            const receiver = await client.getUserProfile(receiverMail);
            const sender = await client.getUserProfile(senderMail);

            if (receiver && sender) {

                // Read Microsoft Teams conversation reference for receiver so the bot knows where to send the notification
                const conversationReference = await botActivityHandler.getConversationReference(receiver.teamsId);

                if (conversationReference) {

                    // Get a photo of the sender for the adaptive card
                    const senderPhoto = await client.getUserPhoto(sender.teamsId);

                    // Continue the conversation with the recipient user by sending an adaptive card
                    // containing the "Notification" with the respective leave request information
                    await adapter.continueConversation(
                        conversationReference,
                        async (turnContext) => {
                            let cardData = {
                                workflowId: workflowId,
                                workflowStepId: workflowStepId,
                                leaveRequestId: leaveRequestId,
                                timeType: timeType,
                                startDate: startDate.split('T')[0],
                                endDate: endDate.split('T')[0],
                                receiverAzureId: receiver.teamsId,
                                senderAzureId: sender.teamsId,
                                senderName: sender.fullName,
                                senderPhoto: (senderPhoto) ? senderPhoto : 'https://' + process.env.DOMAIN + '/img/default-avatar.png'
                            }

                            // Load adaptive card instance for leave request notification
                            const card = adaptiveCards.leaveRequestNotificationCard(cardData);

                            // Send out the adaptive card to the receiver of the notification
                            await turnContext.sendActivity(MessageFactory.attachment(card))
                        }
                    );
                    res.sendStatus(200);
                } else {
                    res.status(404).send('no ConversationReference found for user ' + receiver.fullName);
                }
            } else {
                res.status(404).send('Sender or receiver not found in Azure AD');
            }
        }
    } else {
        // Check if required variables are set, otherwise return error
        if (!receiverMail || !startDate || !endDate || !timeType) {
            res.status(400).send('invalid parameters');
        } else {

            // Get Graph access token with Application permissions 
            const authClient = new AuthClient();
            const token = await authClient.getAccessTokenForApplication();

            const client = new GraphClient(token);
            // Get receiver details from Microsoft Graph
            const receiver = await client.getUserProfile(receiverMail);

            if (receiver) {
                // Fetch conversation reference required by bot for recipient of notification
                const conversationReference = await botActivityHandler.getConversationReference(receiver.teamsId);
                if (conversationReference) {

                    // Continue conversation and send leave request status update to the recipient
                    // of the "Notification" including the new status within an adaptive vcard 
                    await adapter.continueConversation(
                        conversationReference,
                        async (turnContext) => {
                            let cardData = {
                                leaveRequestId: leaveRequestId,
                                timeType: timeType,
                                startDate: startDate.split('T')[0],
                                endDate: endDate.split('T')[0],
                                status: approvalStatus.toUpperCase()
                            }

                            // Load adaptive card instance for leave request update notification
                            const card = adaptiveCards.leaveRequestUpdateNotificationCard(cardData);
                            await turnContext.sendActivity(MessageFactory.attachment(card))
                        }
                    );
                    res.sendStatus(200);
                } else {
                    // If no conversation id was found, an error is returned
                    // Recipient user has probably not used the application in Microsoft Teams before
                    res.status(404).send('No ConversationReference found for user ' + receiver.fullName);
                }
            } else {
                res.status(404).send('Receiver not found in Azure AD');
            }
        }
    }

})

export default notifyRouter