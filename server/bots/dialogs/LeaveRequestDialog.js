/**
 * LeaveRequestDialog.js returns a class extending the CancelAndHelpDialog class
 * 
 * The CancelAndHelpDialog class can be found in the utils and is an extension of the standard ComponentDialog class.
 * It offers additional features to handle communication interruptions (e.g. user cancels or requires help).
 * 
 * This class provides the implementation of the bot's Leave Request dialog. It is loaded by the Waterfall Dialog of 
 * the Main Dialog, in case the user goes for the Leave Request scenario. The Leave Request dialog is also implemented
 * as Watefall Dialog consisting of multiple steps, to get the information required to send a new Leave Request to 
 * SAP SuccessFactors. 
 */

// Load standard modules
import { WaterfallDialog, ChoicePrompt, ChoiceFactory } from 'botbuilder-dialogs'
import { CardFactory, ActivityTypes, MessageFactory } from 'botbuilder'

// Load custom modules and functions
import GraphClient from '../../services/GraphClient.js'
import SfsfClient from '../../services/SfsfClient.js'
import CancelAndHelpDialog from './utils/CancelAndHelpDialog.js'
import SsoOAuthPrompt from './utils/SsoOauthPrompt.js'
import AuthClient from '../../services/AuthClient.js'
import * as adaptiveCards from '../../models/adaptiveCard.js'

// Set constants
const OAUTH_PROMPT_GRAPH = 'OAuthPromptGraph';
const OAUTH_PROMPT_BTP = 'OAuthPromptBtp';
const CHOICE_PROMPT = 'ChoicePrompt';
const WATERFALL_DIALOG  = 'WaterfallDialog';

// Extend from CancelAndHelpDialog, which is a standard ComponentDialog enhanced by additional
// features for interrupting a dialog e.g. by typing "help" or "cancel"
class LeaveRequestDialog extends CancelAndHelpDialog {
    constructor(dialogId) {
        super(dialogId || 'leaveRequestDialog');

        // Add OAuth prompt to obtain Graph Connection token to the dialog
        this.addDialog(new SsoOAuthPrompt(OAUTH_PROMPT_GRAPH, {
            connectionName: process.env.CONNECTION_NAME_GRAPH,
            text: 'Please Sign In',
            title: 'Sign In',
            timeout: 300000
        }));

         // Add OAuth prompt to obtain SAP BTP Connection token to the dialog
        this.addDialog(new SsoOAuthPrompt(OAUTH_PROMPT_BTP, {
            connectionName: process.env.CONNECTION_NAME_BTP,
            text: 'Please Sign In',
            title: 'Sign In',
            timeout: 300000
        }));

        // Add a standard choice prompt to the dialog
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT))

        // Add the Leave Request Waterfall Dialog to the dialog
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                // 1 - Show Intro card - User Interaction
                this.showIntro.bind(this),

                // 2 - Get Graph token before requesting Graph Data
                this.getGraphToken.bind(this),

                // 3 - Request Graph data right after fetching token
                this.getGraphData.bind(this),

                // 4 - Get OAuth token to obtain SAML assertion for SAP BTP access
                this.getBtpToken.bind(this),

                // 5 - Request time types right after fetching token - User Interaction
                this.getTimeTypes.bind(this), 

                // 6 - Get OAuth token to obtain SAML assertion for SAP BTP access
                this.getBtpToken.bind(this),

                // 7 - Show Leave request form including balances - User Interaction
                this.getLeaveDetails.bind(this),

                // 8 - Get OAuth token to obtain SAML assertion for SAP BTP access
                this.getBtpToken.bind(this),

                // 9 - Send leave request and show confirmation
                this.createLeaveRequest.bind(this),
        ]));

        // Start the Leave Request Dialog by running the WaterfallDialog definded above
        this.initialDialogId = WATERFALL_DIALOG;
    }

    /**
     * First step of Leave Request Waterfall Dialog 
     * Show Leave Request Intro Card (Adaptive Card) 
     */
    async showIntro(stepContext) {
        const cardData = { description: "Do you want to create a new Leave Request or to review existing Leave Requests?"}
        var card = CardFactory.adaptiveCard(adaptiveCards.leaveRequestIntroCard(cardData, false));
        card.contentType = 'application/vnd.microsoft.card.adaptive';
        var activity = MessageFactory.attachment(card);

        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: activity,
            choices: ChoiceFactory.toChoices(["Create", "View"]),
            style: 0
        });;
    }

    /**
     * Second step of Leave Request Waterfall Dialog 
     * Get a new OAuth token for Microsoft Graph access by starting the OAuth prompt as new Dialog
     */
    async getGraphToken(stepContext) {  
        if(!stepContext.result){
            await stepContext.context.sendActivity("An error occured! Please restart the conversation!");
            return await stepContext.endDialog();
        }

        return await stepContext.beginDialog(OAUTH_PROMPT_GRAPH);
    }

    /**
     * Third step of Leave Request Waterfall Dialog 
     * Fetch the profile information of the current chat bot user from Microsoft Graph using the 
     * Microsoft Graph OAuth token of the previous Waterfall Dialog step
     */
    async getGraphData(stepContext) { 
        if(!stepContext.result){
            // stepContext.context returns the current TurnContext
            await stepContext.context.sendActivity("An error occured! Please restart the conversation!");
            return await stepContext.endDialog();
        }
        
        // Use resulting token of previous Waterfall Dialog step to create a new Graph Client
        const graphClient = new GraphClient(stepContext.result.token);
        const profile = await graphClient.getProfile();

        // Save graph data in the step context to allow accesss in a later step
        stepContext.values.graphData = { profile : profile };

        return await stepContext.next('Success');
    }

    /**
     * Leave Request Waterfall Dialog step wich is being used multiple times 
     * Get a new OAuth token for the SAP BTP OAuth connection by starting the OAuth prompt as new Dialog
     * This OAuth token can then be used to obtain a new SAML assertion for BTP access
     */
    async getBtpToken(stepContext) {   
        if(!stepContext.result){
            // stepContext.context returns the current TurnContext
            await stepContext.context.sendActivity("An error occured! Please restart the conversation!");
            return await stepContext.endDialog();
        }
        return await stepContext.beginDialog(OAUTH_PROMPT_BTP);
    }

    /**
     * Fifth step of Leave Request Waterfall Dialog 
     * Load the available time types for the current chat bot user and display them in an adaptive card, 
     * so the user can choose which time type he wants to create a leave request for. Use the OAuth token
     * of the previous Waterfall Dialog step to get access to SAP BTP 
     */
    async getTimeTypes(stepContext) {
        if(!stepContext.result){
            // stepContext.context returns the current TurnContext
            await stepContext.context.sendActivity("An error occured! Please restart the conversation!");
            return await stepContext.endDialog();
        }

        // The result will contain the OAuth token obtained in the previous Waterfall Dialog step
        const result = stepContext.result;

        // Send loading information and save the message id to the replyToIDs
        var loadingMsgResponse = await stepContext.context.sendActivity("...Time Types being fetched!...One moment please...");
        
        // Show typing indicator until data arrives
        await stepContext.context.sendActivity({ type : ActivityTypes.Typing });

        // Get Btp OAuth token issued by XSUAA using the OAuth token provided by the SAP BTP OAuth Connection
        // A token exchange using a SAML assertion is conducted by the AuthClient
        const authClient = new AuthClient();
        const btpOAuthToken = await authClient.getAccessTokenForBtpAccess('', result.token);

        // Prepare data required for SFSF call
        const requestData = {
            profile : stepContext.values.graphData.profile
        }

        // Get client for SFSF data
        const client = new SfsfClient();

        // Get Time Type result from SFSF
        var reqRes = await client.getTimeTypes(btpOAuthToken, requestData);

        // Get Employee Id from SFSF data
        const employeeId = reqRes.TimeTypes.employeeId;

        // Parse time types to card display format
        var timeTypes = reqRes.TimeTypes.TimeTypes.TimeType.map((timeType) => {
            return {
                typeId: timeType.externalCode,
                typeText: `${timeType.externalName_localized}`
            }
        })

        const date = new Date();

        // Fill the cardData object which contains all data being displayed on the adaptive card 
        let cardData = {
                graphData : stepContext.values.graphData,
                dataStore : { 
                    employeeId: employeeId,
                    dateString : date.toDateString(),
                    dateUTCString : date.toUTCString()
                },
                description: 'Please select a Leave Type.',
                timeTypes:  timeTypes
        }

        var card = CardFactory.adaptiveCard(adaptiveCards.leaveRequestTimeTypesCard(cardData, false));
        card.contentType = 'application/vnd.microsoft.card.adaptive';

        // Delete loading message
        await stepContext.context.deleteActivity(loadingMsgResponse.id);

        // Return the adaptive card for time type selection to the chat bot user
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: MessageFactory.attachment(card),
            choices: ChoiceFactory.toChoices(["Continue", "Cancel"]),
            style: 0
        });
    }

    /**
     * Sventh step of Leave Request Waterfall Dialog 
     * Load the available balance for the time type selected by the user and provide him an adaptive card
     * to request additional input on the Leave and Return date. Use the OAuth token of the previous 
     * Waterfall Dialog step to get access to SAP BTP. SAP BTP Connection token is not cached, as user
     * might continue a dialog when the validity of a token has already expired. 
     */
    async getLeaveDetails(stepContext) { 
        const selection = stepContext.context.activity.value;

        // Check if user selected a Time Type
        if(!stepContext.result || !selection["Input.TimeType"]){
            await stepContext.context.sendActivity("An error occured! Please restart the conversation!");
            return await stepContext.endDialog();
        }

        // Send status and save the message id to the replyToIds
        var loadingMsgResponse = await stepContext.context.sendActivity("...Time Balance being fetched!...One moment please...");

        // Show typing indicator until data arrives
        await stepContext.context.sendActivity({ type : ActivityTypes.Typing });

        const selectedTimeType = selection["Input.TimeType"];

        // Create an object containing the required data for the available time type balance from SAP SuccessFactors
        const requestData = {
            employeeId : selection.dataStore.employeeId,
            leaveType : selectedTimeType
        }
        
        // Get Btp OAuth token issued by XSUAA using the OAuth token provided by the SAP BTP OAuth Connection
        // A token exchange using a SAML assertion is conducted by the AuthClient
        const authClient = new AuthClient();
        const btpOAuthToken = await authClient.getAccessTokenForBtpAccess('', stepContext.result.token);

        // Get client for SAP SuccessFactors data requests
        const client = new SfsfClient();

        // Get Time Balance for selected Time Type
        var timeBalance = await client.getTimeBalance(btpOAuthToken, requestData);

        // In case the balance is not limited (e.g. Sick leave), just a default 
        // information "Unlimited Balance" is displayed to the user instead of the balance value
        if(!timeBalance.balanceUnlimited){
            // Convert single return balance object to array for unified handling
            // If user has open balances for multiple years, an array is returned, in case of one year an object is returned
            timeBalance.TimeAccountBalance = timeBalance.TimeAccountBalance instanceof Object ? [timeBalance.TimeAccountBalance] : timeBalance.TimeAccountBalance;

            // Convert time balances to required format for display on adpative card
            timeBalance = timeBalance.TimeAccountBalance.map( balance => {
                let startDate = new Date(balance.bookingStartDate);
                let endDate = new Date(balance.bookingEndDate);
                let options = { year: 'numeric', month: 'numeric', day: 'numeric' };
            
                return {
                    "title" : `${Math.round(balance.balance)} ${balance.timeUnit}`,
                    "value" : startDate.toLocaleDateString(undefined, options) + " - " + endDate.toLocaleDateString(undefined, options)
                }
            });
        }else{
            timeBalance = [{
                "title" : `Unlimited Balance`,
                "value" : `unlimited`
            }]
        }
     
        // Fill the cardData object with all data to be displayed within the adaptive card 
        let cardData = {
            graphData : selection.graphData,
            dataStore : { 
                ...selection.dataStore, 
                ...{
                    timeType: selectedTimeType,
                }   
            },
            timeBalance : timeBalance,
            description : "Please select the first and last day of your Leave Request. Feel free to add an additional comment."
        }

        // Delete loading information message
        await stepContext.context.deleteActivity(loadingMsgResponse.id);

        var card = CardFactory.adaptiveCard(adaptiveCards.leaveRequestFormCard(cardData, false));
        card.contentType = 'application/vnd.microsoft.card.adaptive';

        // Return the adaptive card so the user can provide the remaining information like start and end date of the Leave Request
        return await stepContext.prompt(CHOICE_PROMPT, {
            prompt: MessageFactory.attachment(card),
            choices: ChoiceFactory.toChoices(["Continue", "Cancel"]),
            style: 0
        });
    }

    /**
     * Nineth step of Leave Request Waterfall Dialog 
     * After user has provided the Start and End date of his leave request, the leave request can be send to SAP SuccessFactors.
     * Use the OAuth token of the previous Waterfall Dialog step to get access to SAP BTP. An adaptive card is returned to the user
     * informing him whether the Leave Request was successfully created or if an error occured. 
     */
    async createLeaveRequest(stepContext) {   
        const selection = stepContext.context.activity.value;

        // Check if the user provided a Start and an EndDate
        if (stepContext.result && selection["Input.StartDate"] && selection["Input.EndDate"]) {
            // Send loading information and save the message id to the replyToIDs
            const loadingMsgResponse = await stepContext.context.sendActivity("...Leave Request sent to SAP SuccessFactors!...One moment please...");

            // Show typing indicator until data arrives
            await stepContext.context.sendActivity({ type : ActivityTypes.Typing });

            const startDate = selection["Input.StartDate"];
            const endDate = selection["Input.EndDate"];

            // Fill requestData object containing all required data to create a Leave Request in SAP SuccessFactors
            const requestData = {
                startDate : startDate,
                endDate : endDate,
                timeType : selection.dataStore.timeType,
                employeeId : selection.dataStore.employeeId
            }

            // Get Btp OAuth token issued by XSUAA using the OAuth token provided by the SAP BTP OAuth Connection
            // A token exchange using a SAML assertion is conducted by the AuthClient
            const authClient = new AuthClient();
            const btpOAuthToken = await authClient.getAccessTokenForBtpAccess('', stepContext.result.token);
            
            // Get client for SFSF data
            const client = new SfsfClient();
            
            var card = {}
            var cardData = '';
            
            // Create the Leave Request in SAP SuccessFactors and return a success message using an adaptive card
            // In case of an error, return an adaptive card containing the respective error message
            try{
                await client.createLeaveRequest(btpOAuthToken, requestData);
                cardData = {
                    graphData : selection.graphData,
                    dataStore : { 
                        ...selection.dataStore, 
                        ...{
                            startDate: startDate,
                            endDate: endDate,
                        }   
                    },
                    description: "The following Leave Request has been created in SAP SuccessFactors"
                }
                card = CardFactory.adaptiveCard(adaptiveCards.leaveRequestSuccessCard(cardData, false));

            }catch(error){
                cardData = {
                    dataStore : { 
                        ...selection.dataStore, 
                        ...{
                            startDate: startDate,
                            endDate: endDate,
                        }   
                    },
                    error: error,
                    description: "Error while creating your Leave Request in SAP SuccessFactors"
                }
                card = CardFactory.adaptiveCard(adaptiveCards.leaveRequestErrorCard(cardData, false));
            }

            card.contentType = 'application/vnd.microsoft.card.adaptive';
            
            // Delete loading information message
            await stepContext.context.deleteActivity(loadingMsgResponse.id);

            // Return the adaptive card (success or error message)
            await stepContext.context.sendActivity({ attachments: [card] });

            // End the dialog after this step and return to the last step of the Main Waterfall dialog
            return await stepContext.endDialog();
        
        }else{
            await stepContext.context.sendActivity("An error occured! Please restart the conversation!");
            // End the dialog and return to the last step of the Main Waterfall dialog
            return await stepContext.endDialog();
        }
    }
}

export default LeaveRequestDialog
