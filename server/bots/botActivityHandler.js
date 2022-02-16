/**
 * botActivityHandler.js returns a new instance of the extended TeamsActivityHandler class
 * 
 * This handler allows us include the respective bot dialogs and handles all advanced bot related
 * features like implementing Messaging Extension, implementing tabs based on adaptive cards and
 * all subsequent calls triggered by these bot enhancements. It is of high importance for this project.
 * 
 * It also connects to further services like the BlobStorage container. Check the very end of this 
 * file where actual instance of the extended class is created.
 */

import { 
    TeamsActivityHandler, 
    CardFactory, 
    tokenExchangeOperationName,
    ConversationState,
    UserState,
    TurnContext,
    MessageFactory
} from 'botbuilder'

import { BlobsStorage } from 'botbuilder-azure-blobs'

// Load custom modules and functions
import TokenExchangeHelper from './utils/TokenExchangeHelper.js'
import MainDialog from './dialogs/MainDialog.js'
import AuthClient from '../services/AuthClient.js'
import * as leaveRequestHelper from './utils/leaveRequestHelper.js'
import * as adaptiveCards from '../models/adaptiveCard.js'

// Load the the leave request Waterfall dialog
import LeaveRequestDialog from './dialogs/LeaveRequestDialog.js'
const LEAVE_REQUEST_DIALOG = 'leaveRequestDialog';

// Set further configuration parameters
const USER_CONFIGURATION = 'userConfigurationProperty';
const conversationReferencesStoragePropertyName = 'conversationReferences';

/** 
 * Extend TeamsActivityHandler class for the BotActivityHandler
 * Besides the actual bot dialogs, all bot related actions are implemented in this class by
 * overwriting the methods of the TeamsActivityHandler class. 
 * 
 * https://docs.microsoft.com/en-us/dotnet/api/microsoft.bot.builder.teams.teamsactivityhandler?view=botbuilder-dotnet-stable
 * 
 * If you're interested in further details on Single-Sign-On using bots, please check the following links by Microsoft.
 * This Microsoft Teams extension application is based on the linked GitHub repository propvided by Microsoft!
 * 
 * https://docs.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/auth-aad-sso-bots
 * https://github.com/OfficeDev/Microsoft-Teams-Samples/tree/main/samples/app-sso/nodejs 
 */
class BotActivityHandler extends TeamsActivityHandler {
    _botStorage; 

    constructor(conversationState, userState, dialog, storage) {
        super();
       
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');

        // Set this variables
        this.conversationState = conversationState;
        this.userState = userState;

        // the dialog variable contains the MainDialog contains the Leave Request bot dialog 
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        this.userConfigurationProperty = userState.createProperty(USER_CONFIGURATION);
        this._botStorage = storage;

        // Create new instances of the TokenExchangeHelper class supporting the SSO process 
        this._ssoOAuthHelperGraph = new TokenExchangeHelper(process.env.CONNECTION_NAME_GRAPH,storage);
        this._ssoOAuthHelperBtp = new TokenExchangeHelper(process.env.CONNECTION_NAME_BTP,storage);

        // Handler for bot messages arriving. This will trigger the Main Dialog to be loaded if no conversation exists yet. 
        this.onMessage(async (context, next) => {
            console.log('Running dialog with Message Activity.');

            // Run the Dialog with the new message Activity.
            await this.dialog.run(context, this.dialogState);

            // By calling next() you ensure that the next handler is run.
            await next();
        });

        /** 
         * Handler once the bot is added by a new user sending out a welcome message
         */
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    // Send out Welcome card 
                    const welcomeCard = CardFactory.adaptiveCard(adaptiveCards.welcomeCard());
                    await context.sendActivity({ attachments: [welcomeCard] });
                    await dialog.run(context, conversationState.createProperty('DialogState'));
                }
            }
            await next();
        });

        /** 
         * Save to conversation reference once the conversation is updated 
         * The latest conversation reference is required by the bot to send notifications to the correct receipient
         */
        this.onConversationUpdate(async (context, next) => {
            const conversationReference = TurnContext.getConversationReference(context.activity);
            const userId = conversationReference.user?.aadObjectId;
            if (userId) {
                try {
                    // Conversation Reference is stored in the BlobStorage container if not available yet
                    const storeItems = await this._botStorage.read([conversationReferencesStoragePropertyName]);
                    if (!storeItems[conversationReferencesStoragePropertyName]) storeItems[conversationReferencesStoragePropertyName] = {};
                    const conversationReferences = storeItems[conversationReferencesStoragePropertyName];
                    conversationReferences[userId] = conversationReference;
                    await this._botStorage.write(storeItems);
                } catch (error) {
                    console.log(error);
                }
            }
            await next();
        })
    }

    /**
     * Method allows to retreive a user's conversation reference from the BlogStorage container
     */
    async getConversationReference(userId)   {
        try {
            const storeItems = await this._botStorage.read([conversationReferencesStoragePropertyName]);
            if (!storeItems[conversationReferencesStoragePropertyName]) return null;
            const conversationReferences = storeItems[conversationReferencesStoragePropertyName];
            const conversationReference = conversationReferences[userId];
            return conversationReference;
        } catch (error) {
            console.log(error);
            return null;
        }
    }


    /**
     * Override the TeamsActivityHandler.run() method to save state changes after the bot logic completes.
     */
    async run(context) {
        await super.run(context);
        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }

    /**
     * Override the TeamsActivityHandler.handleTeamsMessagingExtensionFetchTask() method which allows us to 
     * implement messaging extensions. Once the user clicks on a messaging extension within the message pane,
     * this method is called with the respecitve commandId. 
     */
    async handleTeamsMessagingExtensionFetchTask(context, action) {
        // Handler to load the leave request messaging extension
        if (action.commandId === 'LEAVEREQUEST') {
            const magicCode = action.state && Number.isInteger(Number(action.state)) ? action.state : '';
            // Try to request a new Microsoft Graph token from the botAdapter
            var tokenResponse = await context.adapter.getUserToken(context,process.env.CONNECTION_NAME_GRAPH, magicCode);

            // Check if user is logged in and Graph Token exists. If not, a SilentAuth process will be started. 
            // After a success callback, the current method will run again.
            if (!tokenResponse || !tokenResponse.token) {
                return this._getTokenForConnectionMsgExt(context, process.env.CONNECTION_NAME_GRAPH);
            }

            // Get the Azure AD id of the current app user
            const userId = context.activity.from.aadObjectId;
            // Load the leave request intro card providing the current user id and a Microsoft Graph token
            const leaveRequestIntroCard = await leaveRequestHelper.getLeaveRequestIntroCard(userId, tokenResponse.token);

            // The messaging extension in this case is implementead as an adaptive card within a task module
            return {
                task: {
                    type: 'continue',
                    value: {
                        card: leaveRequestIntroCard,
                        heigth: 'medium',
                        width: 'medium',
                        title: 'Leave Request'
                    }
                }
            }
        }

        // Handler to load the logout messaging extension
        if (action.commandId === 'SignOutCommand') {
            const adapter = context.adapter;
            // Sign out the current app user from both OAuth connevctions (Microsoft Graph and SAP BTP)
            await adapter.signOutUser(context, process.env.CONNECTION_NAME_GRAPH);
            await adapter.signOutUser(context, process.env.CONNECTION_NAME_BTP);

            // Send a success card 
            const card = CardFactory.adaptiveCard(adaptiveCards.signedOutCard());
            return {
                task: {
                    type: 'continue',
                    value: {
                        card: card,
                        heigth: 200,
                        width: 400,
                        title: 'Adaptive Card: Inputs'
                    }
                }
            };
        }

        return await super.handleTeamsMessagingExtensionFetchTask(context, action);
    }

    /**
     * Override the TeamsActivityHandler.handleTeamsMessagingExtensionSubmitAction() method which allows us to 
     * handle Submit Actions triggered from within a messaging extension (e.g. when a user clicks on a button
     * in a task module). 
     * 
     */
    async handleTeamsMessagingExtensionSubmitAction(context, action) {
        // Handler for leave request submit actions
        if(action.data.origin.startsWith('leaveRequest')){
            var activityData = action.data;

            // In case of cancellation, return null which closes the task module
            if(activityData.action === 'cancel' || activityData.action === 'return') return null;
            
            // Submit action is triggered by the Leave Request Intro Card
            if(activityData.origin ==='leaveRequestIntroCard') {
                const magicCode = action.state && Number.isInteger(Number(action.state)) ? action.state : '';

                // Try to get an OAuth token required get a SAML assertion for SAP BTP access
                var tokenResponse = await context.adapter.getUserToken(context,process.env.CONNECTION_NAME_BTP,magicCode);

                // Check if user is logged in and a BTP token exists. If not, a SilentAuth process will be started. 
                // After a success callback, the current method will run again.
                if (!tokenResponse || !tokenResponse.token) {
                    return this._getTokenForConnectionMsgExt(context, process.env.CONNECTION_NAME_BTP);
                }

                // Return an adaptive card which allows the user to select the desired time time for his leave request
                // activityData contains information to be displayed in the adaptive card and is enriched within every step
                // of the messaging extension process (e.g. after this step, the selected time type will be added)
                const leaveRequestTimeTypesCard = await leaveRequestHelper.getLeaveRequestTimeTypesCard(activityData, tokenResponse.token);

                // Return the adaptive card for the time type selection within a task module which is used by the
                // messaging extension and displayed to the user
                return {
                    task: {
                        type: 'continue',
                        value: {
                            card: leaveRequestTimeTypesCard,
                            heigth: 'medium',
                            width: 'medium',
                            title: 'Leave Request'
                        }
                    }
                }
            }

            // Submit action is triggered by the Leave Request Time Types Card
            if(activityData.origin === 'leaveRequestTimeTypesCard') {
                const magicCode = action.state && Number.isInteger(Number(action.state)) ? action.state : '';
                // see above
                const tokenResponse = await context.adapter.getUserToken(context,process.env.CONNECTION_NAME_BTP,magicCode);

                // see above
                if (!tokenResponse || !tokenResponse.token){
                return this._getTokenForConnectionMsgExt(context, process.env.CONNECTION_NAME_BTP);
                }
                
                const btpToken = tokenResponse.token;

                // Return an adaptive card which allows the user to provide a start and end date of his leave request and shows 
                // him or her how much balance for the selected time type is still available. 
                // activityData contains information to be displayed in the adaptive card and is enriched within every step
                // of the messaging extension process (e.g. after this step, the selected start and end date will be added)
                const leaveRequestFormCard = await leaveRequestHelper.getLeaveRequestFormCard(activityData, btpToken);

                // Return the adaptive card for the start and end date selection within a task module which is used by the
                // messaging extension and displayed to the user
                return {
                    task: {
                        type: 'continue',
                        value: {
                            card: leaveRequestFormCard,
                            heigth: 'medium',
                            width: 'medium',
                            title: 'Leave Request'
                        }
                    }
                }
            }

            // Submit action is triggered by the Leave Request Form Card
            if(activityData.origin === 'leaveRequestFormCard') {
                const magicCode = action.state && Number.isInteger(Number(action.state)) ? action.state : '';
                // see above
                const tokenResponse = await context.adapter.getUserToken(context,process.env.CONNECTION_NAME_BTP,magicCode);

                // see above
                if (!tokenResponse || !tokenResponse.token){ 
                    return this._getTokenForConnectionMsgExt(context, process.env.CONNECTION_NAME_BTP);
                }
                
                // The leave request is send to SAP SuccessFactors and an adaptive card is returned, informing the user
                // about the success or failure of the leave request creation within SAP SuccessFactors.  
                const leaveRequestCreateCard = await leaveRequestHelper.getLeaveRequestCreateCard(activityData, tokenResponse.token);

                // Return an adaptive card with a success message or an error message depending on the creation result
                // of the Leave Request within SAP SuccessFactors. 
                return {
                    task: {
                        type: 'continue',
                        value: {
                            card: leaveRequestCreateCard,
                            heigth: 'medium',
                            width: 'medium',
                            title: 'Leave Request'
                        }
                    }
                }
            }
            
        }
        
        return await super.handleTeamsMessagingExtensionSubmitAction(context, action);
    }


    /**
     * Override the TeamsActivityHandler.handleTeamsTabFetch() method which allows us to handle extension 
     * use-cases in which a bot is providing content for an Microsoft Teams tab in form of adaptive cards. This
     * simplifies the usage of tab extensions as no custom React component needs to be developed
     */
    async handleTeamsTabFetch(context, tabRequest){

        // Handle leave request tab request (tabEntityId is defined in manifest.json file)
        if(tabRequest.tabContext.tabEntityId === 'com.sap.sfsf.tab.leaverequest'){
            const magicCode = context.activity.value && context.activity.value.state ? context.activity.value.state : '';
                    
            // Try to get an OAuth token required to obtain a valid SAML assertion for SAP BTP access
            // See details above in handleTeamsMessagingExtensionSubmitAction method. 
            const tokenResponse = await context.adapter.getUserToken(context, process.env.CONNECTION_NAME_BTP, magicCode);

            // see handleTeamsMessagingExtensionSubmitAction method
            // Instead of a "silentAuth" process, in this case an "auth" card is returned to the user 
            // It seems that tabs implemented via the botActivitHandler and adaptive cards don't support silentAuth
            if (!tokenResponse || !tokenResponse.token) {
                return this._getTokenForConnectionTabCards(context, process.env.CONNECTION_NAME_BTP)
            }

            const userId = context.activity.from.aadObjectId;
            const authClient = new AuthClient();

            /**
             * Get an OAuth token for Microsoft Graph access via Application level permissions
             * 
             * IMPORTANT: Making use of the application permissions in this case is not ideal as a user context would be available
             * to make use of delegate permissions. BUT - tabs implemented via the botActivityHandler and adaptive cards
             * don't support the usage of multiple OAuth connections at the same time. This would result in multiple login
             * windows which is not acceptable from a usability perspective. As the BTP OAuth Connections HAS TO BE USED
             * to obtain a valid SAML Assertion for BTP access, it was decided to use the application permissions for 
             * the Microsoft Graph access in this case! Once the usage of multiple OAuth connections is supported for tabs implemented
             * by the botActivityHandler, this should be changed. 
             */
            const graphToken = await authClient.getAccessTokenForApplication();

            // Load the leave request intro card providing the current user id and the Microsoft Graph token 
            const leaveRequestIntroCard = await leaveRequestHelper.getLeaveRequestIntroCard(userId, graphToken);

            // Return the adaptive card which is displayed within the Leave Request tab of the Microsoft Teams extension
            return {
                tab: {
                    type: 'continue',
                    value: {
                        cards: [{
                            card: leaveRequestIntroCard.content
                        }]
                    },
                    responseType: 'tab'
                } 
            }
        }

        return await super.handleTeamsTabFetch(context, tabRequest);
    }

    /**
     * Override the TeamsActivityHandler.handleTeamsTabSubmit() method which allows us to handle Submit Actions triggered 
     * from within the tab component of the Microsoft Teams extension. This is the case if the tab implementation makes use of 
     * the botActivityHandler framework and displays adaptive cards provided by this handler (see above)
     */
    async handleTeamsTabSubmit(context, tabSubmit){
        if(tabSubmit.tabContext.tabEntityId === 'com.sap.sfsf.tab.leaverequest'){
            const activityData = tabSubmit.data;
            const magicCode = context.activity.value && context.activity.value.state ? context.activity.value.state : '';
    
            /** 
             * A BTP token will be required for all adpative cards displayed in the tab as either
             * time types need to be fetched, the balance of a time type needs to be loaded or the final
             * leave request needs to be created within SAPSuccessFactors. As the user might pause the interaction
             * with the different steps of the tab extensions, the initial token might not be valid anymore, 
             * which is why a new token is requested before a new adaptive card is loaded in the tab
             */
            const tokenResponse = await context.adapter.getUserToken(context, process.env.CONNECTION_NAME_BTP,magicCode);

            // see above
            if (!tokenResponse || !tokenResponse.token) {
                return this._getTokenForConnectionTabCards(context, process.env.CONNECTION_NAME_BTP);
            }

            // Check if user cancelled within the adpative card
            if(activityData.action !== 'cancel' && activityData.action !== 'return'){

                // Submit action is triggered by the Leave Request Intro Card within the tab extension
                if(activityData.origin === 'leaveRequestIntroCard') {

                    // Create the Leave Request Time Types adaptive card 
                    // activityData contains information to be displayed in the adaptive card and is enriched within every step
                    // of the messaging extension process (e.g. after this step, the selected time type will be added)
                    const timeTypesCard = await leaveRequestHelper.getLeaveRequestTimeTypesCard(activityData, tokenResponse.token);
                    
                    // Return the adaptive card to the tab extension so it will be rendered
                    // for the user within the Leave Request tab of the Microsoft Teams extension
                    return {
                        tab: {
                            type: 'continue',
                            value: {
                                cards: [{
                                    card: timeTypesCard.content
                                }]
                            },
                        }
                    }
                }
                
                // Submit action is triggered by the Leave Request Time Types Card within the tab extension
                if(activityData.origin === 'leaveRequestTimeTypesCard') {

                    // see above
                    const leaveRequestFormCard = await leaveRequestHelper.getLeaveRequestFormCard(activityData, tokenResponse.token);
                    
                    // see above
                    return {
                        tab: {
                            type: 'continue',
                            value: {
                                cards: [{
                                    card: leaveRequestFormCard.content
                                }]
                            },
                        }
                    };
                }

                // Submit action is triggered by the Leave Request Form Card within the tab extension
                if(activityData.origin === 'leaveRequestFormCard') {
                    // see above
                    const leaveRequestCreateCard = await leaveRequestHelper.getLeaveRequestCreateCard(activityData, tokenResponse.token);
                    
                    // see above
                    return {
                        tab: {
                            type: 'continue',
                            value: {
                                cards: [{
                                    card: leaveRequestCreateCard.content
                                }]
                            },
                        }
                    }
                }

            }else{
                // Handle "Cancel" or "Back" Submit action for the Microsoft Teams tab extension scenario 
                const userId = context.activity.from.aadObjectId;
                const authClient = new AuthClient();
                // see above
                const graphToken = await authClient.getAccessTokenForApplication();
                // If user cancels or clicks on back the Leave Request Intro Card is loaded again
                const leaveRequestIntroCard = await leaveRequestHelper.getLeaveRequestIntroCard(userId, graphToken);

                return {
                    tab: {
                        type: 'continue',
                        value: {
                            cards: [{
                                card: leaveRequestIntroCard.content
                            }]
                        },
                        responseType: 'tab'
                    } 
                }
            }
        }

        return await super.handleTeamsTabSubmit(context, tabSubmit);
    }

    /**
     * Override the TeamsActivityHandler.handleTeamsTaskModuleFetch() method which allows us to handle extension 
     * use-cases in which a the botActvitiyHandler is used to provide the content of a custom task module.
     * 
     * In this case the desired task module is loaded, when a user clicks on the action buttons of the leave request
     * notifications like (Approve/Reject). 
     */
    async handleTeamsTaskModuleFetch(context, taskModuleRequest){

        // Check if the task module to be fetched is for the Leave Request scenario
        // The custom parameter data.origin has been set in the Leave Request notification adaptive card submit buttons
        if(taskModuleRequest.data.origin === 'leaveRequest'){
            let dataStore = taskModuleRequest.data.dataStore;
            
            // As the task module will not render an adaptive card in this case (like for the messaging extension scenario)
            // but will load a custom React component hosted by our extension application, the respective URL including 
            // required parameters needs to be concatenated. 

            // The replyToId is the id of the leave request notification bot message which needs to be passed to the task
            // module as the message (adaptive card) needs to be updated once the manager approved or rejected a leave request
            let url =  this._getTaskModuleUrl(
                context.activity.replyToId,
                taskModuleRequest.data.origin,
                taskModuleRequest.data.action,
                {
                    workflowId : dataStore.workflowId,
                    startDate:  dataStore.startDate,
                    endDate:  dataStore.endDate,
                    timeType:  dataStore.timeType,
                    senderName:  dataStore.senderName
                }
            );
            
            // The task module is loaded and by providing the url parameter, it will render the React component within
            // the task module which opens as a popup for the user once he or she clicks on the notification action
            return {
                task: {
                    type: 'continue',
                    value: {
                        title: 'Task Module',
                        width: 'medium',
                        height: 'small',
                        url: url,
                        fallbackUrl : url
                    }
                }
            }
        }

        return await super.handleTeamsTaskModuleFetch(context, taskModuleRequest);
    }

    /**
     * Override the TeamsActivityHandler.handleTeamsTaskModuleSubmit() method which allows us to handle Submit Actions triggered 
     * from within a custom task module. This is the case if the task module has not been loaded from within a messaging extension
     * (see above) but like in our case e.g. wen the user clicks on one of the Action buttons of the Leave Request notification.
     */
    async handleTeamsTaskModuleSubmit(context, taskModuleSubmit){
        if(taskModuleSubmit.data.taskType){
            // The custom data object taskType has been injected by the React component
            // The custom React componenten loaded in the task module makes use of the postMessage technology to send
            // communication back to Microsoft Teams and the bot which is finally reaching the current method
            if(taskModuleSubmit.data.taskType === 'leaveRequest'){
                // As the purpose of the React component in the task module is to approve or reject a workflow in SAP SuccessFactors
                // we need to check, whether this action was executed successfully or if an error occured. If successfull, we need
                // to update the original notification with either "Approved" or "Rejected" status
                if(taskModuleSubmit.data.status === 'success'){
                    let data = taskModuleSubmit.data;
                    let dataStore = data.dataStore;

                    // Beautify date for adaptive card visualization
                    var startDate = new Date(dataStore.startDate);
                    startDate = startDate.toISOString().split('T')[0];

                    var endDate = new Date(dataStore.endDate);
                    endDate = endDate.toISOString().split('T')[0];

                    // Updated adaptive card data. If a Leave request is confirmed or rejected, the original notification card
                    // is changed and either approved or rejected is shown together withe the employee name. 
                    // The photo is not displayed anymore 
                    let cardData = {
                        timeType : dataStore.timeType,
                        startDate : startDate,
                        endDate : endDate,
                        senderName : dataStore.senderName
                    }

                    // Update the original adaptive card
                    const message = MessageFactory.attachment(adaptiveCards.leaveRequestNotificationCard(cardData, false, data.taskAction));
                    message.id = data.replyToId;

                    await context.updateActivity(message);    
                    return null;
                }else{
                    return null;
                }
            }
        }
        return await super.handleTeamsTaskModuleSubmit(context, taskModuleSubmit);
    }


    /**
     * Override the TeamsActivityHandler.onInvokeActivity() according to Microsoft Teams samples for Single Sign On
     */
    async onInvokeActivity(context) {
        const valueObj = context.activity.value;

        if (valueObj.authentication) {
            const authObj = valueObj.authentication;
            if (authObj.token) {
                // If the token is NOT exchangeable, then do NOT deduplicate requests.
                if (await this.tokenIsExchangeable(context)) {
                    return await super.onInvokeActivity(context);
                } else {
                    const response = {
                        status: 412
                    };
                    return response;
                }
            }
        }
        return await super.onInvokeActivity(context);
    }

    /**
     * Override the TeamsActivityHandler.tokenIsExchangeable() according to Microsoft Teams samples for Single Sign On
     */
    async tokenIsExchangeable(context) {
        let tokenExchangeResponse = null;
        try {
            const valueObj = context.activity.value;
            const tokenExchangeRequest = valueObj.authentication;
            tokenExchangeResponse = await context.adapter.exchangeToken(
                context, 
                process.env.CONNECTION_NAME_GRAPH, 
                context.activity.from.id,
                { token: tokenExchangeRequest.token }
            );
        } catch (err) {
            console.log('tokenExchange error: ' + err);
            // Ignore Exceptions
            // If token exchange failed for any reason, tokenExchangeResponse above stays null, 
            // and hence we send back a failure invoke response to the caller.
        }
        if (!tokenExchangeResponse || !tokenExchangeResponse.token) {
            return false;
        }
        return true;
    }

    /**
     * Override the TeamsActivityHandler.handleTeamsSigninVerifyState() according to Microsoft Teams samples for Single Sign On
     */
    async handleTeamsSigninVerifyState(context, state) {
        await this.dialog.run(context, this.dialogState);
    }

    /**
     * Override the TeamsActivityHandler.onSignInInvoke() according to Microsoft Teams samples for Single Sign On
     * 
     * This is invoked when the TokenExchangeInvokeRequest is coming back from the Client 
     * https://docs.microsoft.com/en-us/microsoftteams/platform/bots/how-to/authentication/auth-aad-sso-bots
     */
    async onSignInInvoke(context) {
        // The tokenExchangeOperationName should be signin/tokenExchange
        if (context.activity && context.activity.name === tokenExchangeOperationName) {
            // The ssoOAuthHelper will attempt the exchange, and if successful, it will cache the result in TurnState.
            // This is then read by SsoOAuthPrompt, and processed accordingly 

            if(context.activity.value.CONNECTION_NAME_GRAPH === process.env.CONNECTION_NAME_BTP){
                // If the token is not exchangeable, do not process this activity further.
                // The ssoOAuthHelper will send the appropriate response if the token is not exchangeable.
                if (!await this._ssoOAuthHelperBtp.shouldProcessTokenExchange(context)) return;
            }

            if(context.activity.value.CONNECTION_NAME_GRAPH === process.env.CONNECTION_NAME_GRAPH){
                if (!await this._ssoOAuthHelperGraph.shouldProcessTokenExchange(context)) return;
            }

        }
        // Run the dialog with the new context including the exchanged token
        await this.dialog.run(context, this.dialogState);
    }

     /**
     * Override the TeamsActivityHandler.onTokenResponseEvent() according to Microsoft Teams samples for Single Sign On
     */
    async onTokenResponseEvent(context) {
        // Run the Dialog with the new Token Response Event Activity.
        await this.dialog.run(context, this.dialogState);
    }


     /**
     * Helper method to get new token for messaging extension scenario
     * Makes use of the silentAuth adaptive card allowing Single Sign On 
     */
    async _getTokenForConnectionMsgExt (context, connection){

        // There is no token, so the user has not signed in yet.
        // Retrieve the OAuth Sign in Link to use in the MessagingExtensionResult Suggested Actions
        const signInLink = await context.adapter.getSignInLink(
            context,
            connection,
        );

        return {
            composeExtension: {
                type: 'silentAuth',
                suggestedActions: {
                    actions: [
                        {
                            type: 'openUrl',
                            value: signInLink,
                            title: 'Setup your access for the first time!'
                        }
                    ]
                }
            }
        };
    }

    /**
     * Helper method to get new token for the tab extension scenario implemented va the bot framework
     * Makes use of the auth adaptive card, which does not support single sign on
     * silentAuth adaptive card is not working in case of tabs implemented via the bot framework 
     */
    async _getTokenForConnectionTabCards (context, connection){
        // Retrieve the OAuth Sign in Link
        const signInLink = await context.adapter.getSignInLink(context,connection);

        return {
            tab: {
                type: "auth",
                suggestedActions: {
                    actions: [
                        {
                            type: "openUrl",
                            value: signInLink,
                            title: "Sign in to this app"
                        }
                    ]
                }
            }
        };
    }

     /**
     * Helper method to get the url for loading the task module 
     */
    _getTaskModuleUrl(replyToId, taskType, taskAction, payloadData) {
        let url =  `https://${process.env.DOMAIN}/task-module`;

        url += `?replyToId=${encodeURIComponent(replyToId)}`;
        url += `&taskType=${encodeURIComponent(taskType)}`;
        url += `&taskAction=${encodeURIComponent(taskAction)}`;
        
        for (const [key, value] of Object.entries(payloadData)) {
            url += `&${key}=${encodeURIComponent(value)}`;
        }
        return url;
    }

}

// Create a new BlobStorage instance making use of the BlobStorage container created within AzureAD
const storage = new BlobsStorage(process.env.MICROSOFT_BLOB_CONNECTION_STRING || '', process.env.MICROSOFT_BLOB_CONTAINER_NAME || '');

// Create a new ConversationState instance providing the blobStorage instance
const conversationState = new ConversationState(storage);
// Create a new UserState instance providing the botStorage instance
const userState = new UserState(storage);

// Create a new instance of the LeaveRequest dialog which will be injected into the Main dialog before passing it to the botActivityHandler
const leaveRequestDialog = new LeaveRequestDialog(LEAVE_REQUEST_DIALOG);
// Create a new instance of the Main Dialog, which is a wrapper for the Leave Request dialog and potential further bot dialogs
// The Main dialog will be passed to the botActivtityHandler on initialization
const mainDialog = new MainDialog({
    leaveRequestDialog : leaveRequestDialog
});

// Here the actual instance of the BotActivityHandler for our extension application is created
// Besides conversationState and userState, also the mainDialog for the bot (containing all potential subdialogs) and the 
// bot storage (blobStorage container) is passed as constructor parameters. 
const botActivityHandler = new BotActivityHandler(conversationState, userState, mainDialog, storage);

export default botActivityHandler
