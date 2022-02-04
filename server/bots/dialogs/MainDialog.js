/**
 * MainDialog.js returns a class extending the ComponentDialog class
 * 
 * This class provides the implementation of the bot's Main dialog. As this bot is supposed to support
 * various intents/scenarios in the future (like Leave Request, Feedback, Employee Performance, ...)
 * a Main dialog has been implemented, which is dynamically calling the sub-dialogs based on the 
 * requires scenario. If e.g. the user types Leave, the Main dialog starts the LeaveRequestDialog. 
 * 
 * The Main dialog is implemented as a waterfall dialog with three steps, containing an introduction message 
 * resulting in a text prompt, asking the user which scenario to load. Once the user types the desired scenario
 * the sub dialog is loaded and progressed. On the end of the sub dialog a final message is shown which is 
 * provided by the waterfall dialog of the Main dialog, to inform the user about the restart of the waterfall dialog. 
 * 
 * The Main Dialog 
 *   -> Consists of a "Main" Waterfall Dialog 
 *      -> Loads sub-dialogs like the "Leave Request" Waterfall Dialog
 *  
 */


import { NullTelemetryClient, InputHints } from 'botbuilder'
import { ComponentDialog, TextPrompt, DialogSet,  DialogTurnStatus, WaterfallDialog } from 'botbuilder-dialogs'
import { MessageFactory } from 'botbuilder'

// Set contants 
const MAIN_DIALOG = 'MainDialog';

const TEXT_PROMPT = 'TextPrompt'
const MAIN_WATERFALL_DIALOG = 'MainWaterfallDialog';

class MainDialog extends ComponentDialog  {
    constructor(dialogs) {
        super(MAIN_DIALOG);

        // Add basic dialog components required by the waterfall dialog like in this case a "Text Prompt"
        this.addDialog(new TextPrompt(TEXT_PROMPT));

        // Add required dialogs to the Main dialog 
        // including the main waterfall dialog and subsequent "sub-dialogs"
        // like the Leave Request sub-dialog which is a waterfall dialog again
        this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actionStep.bind(this),
                this.finalStep.bind(this)
        ]));
        this.addDialog(dialogs.leaveRequestDialog);
        
        // For the start of the Main dialog, set the Main waterfall dialog as default
        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a DialogContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        // Creates the dialog context
        const dialogContext = await dialogSet.createContext(turnContext);
        dialogContext.dialogs.telemetryClient = new NullTelemetryClient();

        const results = await dialogContext.continueDialog();

        // If the turn status is empty, the Main dialog is loaded which will again 
        // load the main waterfall dialog 
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the Main waterfall dialog.
     * Prompts the user for a command
     */
     async introStep(stepContext) {
        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : `What can I help you with today?\nSay something like "Leave Request" or "Feedback"!`;
        const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt('TextPrompt', { prompt: promptMessage });
    }

    /**
     * Second step in the Main waterfall dialog
     * It hands off to the respective child dialogs
     */
     async actionStep(stepContext) {
        let userInput = stepContext.context.activity.text.toLowerCase();
        // Very simplified handling of user input. This can be implemented in a much more enhanced style
        // using language understanding tools like Luis https://docs.microsoft.com/en-us/azure/cognitive-services/luis/
        switch (userInput) {
            case 'leave request':
            case 'leave': {
                // Load the Leave Request Waterfall Dialog 
                return await stepContext.beginDialog('leaveRequestDialog', InputHints.IgnoringInput);
            }
            case 'feedback': {
                // Feedback scenario is not implemented yet
                const getFeedbackMessageText = 'Feedback dialog will be implemented soon!';
                await stepContext.context.sendActivity(getFeedbackMessageText, getFeedbackMessageText, InputHints.IgnoringInput);
                break;
            }

            default: {
                // Catch all for unhandled intents
                const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way.`;
                await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
                break;
            }
        }

        return await stepContext.next();
    }

    /**
     * Final step in the main waterfall dialog
     * Restart the main dialog once the sub dialog has finished
     */
    async finalStep(stepContext) {
        // Restart the main dialog with a different message the second time around
        return await stepContext.replaceDialog(this.initialDialogId, { restartMsg: 'What else can I do for you? \nSay something like "Leave Request" or "Feedback"!'});
    }
}

export default MainDialog
