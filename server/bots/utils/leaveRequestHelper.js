/**
 * leaveRequestHandler.js provides additional functions for the botActivityHandler to handle 
 * all leave request related actions and to reduce the amount of duplicated coding. 
 * 
 * These functions are mainly used by the messaging extension and the tab implementation based on 
 * adaptive cards. As these extension components are handled by the bot framework, the respective
 * function calls can be found in the botActivityHandler.js
 *   
 */

import { CardFactory } from 'botbuilder'

// Load custom modules and functions
import SfsfClient from '../../services/SfsfClient.js'
import GraphClient from '../../services/GraphClient.js'
import AuthClient from '../../services/AuthClient.js'
import * as adaptiveCards from '../../models/adaptiveCard.js'

/**
 * Fetches user profile and user photo from Microsoft Graph API
 * Graph token needs to be passed from calling context botActivityHandler
 * Returns an adaptive card for Introduction of Leave Request flow
 */
const getLeaveRequestIntroCard = async (userId, graphToken) => {
    
    const client = new GraphClient(graphToken);
    const profile = await client.getUserProfile(userId);
    const photo = await client.getUserPhoto(userId);
    let date = new Date();

    let cardData = {
        graphData : {
            profile : profile,
            photo : photo
        },
        dataStore : {
            dateString : date.toDateString(),
            dateUTCString : date.toUTCString()
        }
    }
    
    return(CardFactory.adaptiveCard(adaptiveCards.leaveRequestIntroCard(cardData)));
};

/** 
 * Reads the available time types for a user from SAP SuccessFactors
 * OAuth token to obtain SAML Assertion and to start token exchange needs to be passed
 * from the calling context botActvityHandler. Returns an adaptive card offering the user 
 * to select the time type for his leave request.
 */
const getLeaveRequestTimeTypesCard = async (activityData, btpToken) => {
   
    const authClient = new AuthClient();
    const btpOAuthToken = await authClient.getAccessTokenForBtpAccess('', btpToken)

    // Get client for SFSF data
   const client = new SfsfClient();

   // Prepare data required for SFSF call
   const requestData = {
        profile : activityData.graphData.profile
   }

   // Get Time Type result from SFSF
   var result = await client.getTimeTypes(btpOAuthToken, requestData);
   
   // SFSF call returns weired JSON...
   var timeTypes  = result.TimeTypes;

   // Get Employee Id from SFSF data
   const employeeId = timeTypes.employeeId;

   // Parse time types to card display format
   timeTypes = timeTypes.TimeTypes.TimeType.map((timeType) => {
       return {
           typeId: timeType.externalCode,
           typeText: `${timeType.externalName_localized}`
       }
   })

   
   let description = "Please select a Leave Type."

   // The dataStore object is enriched with additional information in each step, 
   // and is included into the dataStore object of the next adaptive card 
   let data = {
        graphData : activityData.graphData,
        dataStore : { 
            ...activityData.dataStore, 
            ...{
                employeeId: employeeId,
            }   
        },
        description: description,
        timeTypes:  timeTypes
   }
   return (CardFactory.adaptiveCard(adaptiveCards.leaveRequestTimeTypesCard(data)));
};


/** 
 * Reads the available balance for the time type selected by a user from SAP SuccessFactors
 * OAuth token to obtain SAML Assertion and to start token exchange needs to be passed
 * from the calling context botActvityHandler. Returns an adaptive card asking the user
 * to provide start and end date of his leave request and shows him the available 
 * balance for the selecte time type.
 */
const getLeaveRequestFormCard = async (activityData, btpToken) => {
   
    const authClient = new AuthClient();
    const btpOAuthToken = await authClient.getAccessTokenForBtpAccess('', btpToken)
   
    // Get client for SAP SuccessFactors requests
   const client = new SfsfClient();

   const timeType = activityData["Input.TimeType"];

   const requestData = {
        employeeId : activityData.dataStore.employeeId,
        leaveType : activityData["Input.TimeType"]
   }

   // Get Time Balance
   let timeBalance = await client.getTimeBalance(btpOAuthToken, requestData);

   // If the time balance for the selected time type is limited like for vacation
   // then the balance will be displayed in the adaptive card. Otherwise there will
   // be a hint that the balance for the selected time type is unlimited. 
   if(!timeBalance.balanceUnlimited){
        // Convert single return balance object to array for unified handling
        timeBalance.TimeAccountBalance = timeBalance.TimeAccountBalance instanceof Array 
                                        ? timeBalance.TimeAccountBalance 
                                        : [timeBalance.TimeAccountBalance];

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

   let data = {
        graphData : activityData.graphData,
        dataStore : { 
            ...activityData.dataStore, 
            ...{
                timeType: timeType,
            }   
        },
        timeBalance : timeBalance,
        description: "Please select the first and last day of your Leave Request. Feel free to add an additional comment."
   }

   return (CardFactory.adaptiveCard(adaptiveCards.leaveRequestFormCard(data)));
};

/** 
 * Trys to create the leave request in SAP SuccessFactors and returns a success or error card
 * OAuth token to obtain SAML Assertion and to start token exchange needs to be passed
 * from the calling context botActvityHandler.After sending the leave request to SAP SuccessFactors
 * depending on the result (success or error), an adaptive card is sent to the user, to inform
 * him whether the leave request was created or if there was an error. 
 */
const getLeaveRequestCreateCard = async (activityData, btpToken) => {

    const authClient = new AuthClient();
    const btpOAuthToken = await authClient.getAccessTokenForBtpAccess('', btpToken)
    
    // Get client for SFSF data
    const client = new SfsfClient();
    const startDate = activityData["Input.StartDate"];
    const endDate = activityData["Input.EndDate"];

    const requestData = {
        employeeMail : activityData.graphData.profile.mail,
        startDate : startDate,
        endDate : endDate,
        timeType : activityData.dataStore.timeType,
        employeeId : activityData.dataStore.employeeId
    }

    
   // The leave request is created and if there's no error, a success adaptive card is returned
   // In case of an error, a respective error adaptive card is returned including the error message
   try{
        await client.createLeaveRequest(btpOAuthToken, requestData);
        let cardData = {
            graphData : activityData.graphData,
            dataStore : { 
                ...activityData.dataStore, 
                ...{
                    startDate: startDate,
                    endDate: endDate,
                }   
            },
            description: "The following Leave Request has been created in SAP SuccessFactors"
        }
        return (CardFactory.adaptiveCard(adaptiveCards.leaveRequestSuccessCard(cardData)));

    }catch(error){
        let cardData = {
            graphData : activityData.graphData,
            dataStore : { 
                ...activityData.dataStore, 
                ...{
                    startDate: startDate,
                    endDate: endDate,
                }   
            },
            error: error,
            description: "Error while creating your Leave Request in SAP SuccessFactors"
        }
        return (CardFactory.adaptiveCard(adaptiveCards.leaveRequestErrorCard(cardData)));
    }
}

export {
    getLeaveRequestIntroCard,
    getLeaveRequestTimeTypesCard,
    getLeaveRequestFormCard,
    getLeaveRequestCreateCard
}