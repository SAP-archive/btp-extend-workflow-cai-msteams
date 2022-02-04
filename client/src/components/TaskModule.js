/**
 * TaskModule.js provides a custom React component allowing the user to approve or reject workflows
 * 
 * Approving or rejecting a workflow in SAP SuccessFactors requires the usage of Principal Propagation, as 
 * a workflow cannot be modified by technical user. It can only be changed by the current workflow owner. 
 * 
 * Using a customer React component allows us to make use of the current Microsoft Teams session context which 
 * contains a token that can be used for the Principal Propagation flow. The React component is loaded in 
 * task module, and based on the URL parameters, it will either trigger an approval or rejection of the
 * leave request via the API endpoints provided by the extension application (appRouter.js).
 *  
 */

import React, { useState, useEffect, useContext } from 'react';
import * as microsoftTeams from "@microsoft/teams-js";
import { Flex, Loader, Button, Text } from '@fluentui/react-northstar'

// Load custom modules and files
import TeamsContext from '../context/TeamsContext.js';
import * as clientService from '../service/TeamsClientService.js'
import './TaskModule.css'

const TaskModule = () => {

    // get Teams Context and an AuthCode send to the extension application API
    // being used for validating the request eligibility and starting the Principal Propagation flow
    const { teamsContext, authCode } = useContext(TeamsContext);

    // set some state fields
    const [consentRequired, setConsentRequired] = useState(false)
    const [actionExecuted, setActionExecuted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    // Default fields for task modules
    const [replyToId, setReplyToId] = useState('')
    const [taskType, setTaskType] = useState('')
    const [taskAction, setTaskAction] = useState('')

    // Fields for Leave Request handling
    const [senderName, setSenderName] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [timeType, setTimeType] = useState('')

    // Function to show a consent popup in case the user needs to consent the permissions required by the application
    // Important: Not intensively tested as "Admin Consent" is used for this tutorial
    const showConsentPopup = () => {
        microsoftTeams.authentication.authenticate({
            url: window.location.origin + "/auth-start",
            width: 600,
            height: 535,
            successCallback: (() => {
                setConsentRequired(false);
            })
        });
    }

    // Function to submit the actual task once the leave request workflow has been confirmed or rejected
    // Will finally close the task module and send back the decision to the Teams bot environment using postMessage
    const submitTask = () => {
        // Sender name, date aso. are required to update the adaptive card based on the decision
        // ReplyToId contains the id of the adaptive card which needs to be updated based on the approval/rejection decision
        microsoftTeams.tasks.submitTask({
            taskType: taskType,
            taskAction: taskAction,
            replyToId: replyToId,
            status: errorMessage ? 'error' : 'success',
            dataStore: {
                senderName: senderName,
                startDate: startDate,
                endDate: endDate,
                timeType: timeType
            }
        }, process.env.REACT_APP_MICROSOFT_APP_ID);
    }

    useEffect(async () => {
        if (teamsContext && authCode) {

            // Extract the URL parameters containing all required information to 
            // approve or reject to correct leave request workflow
            const params = new URLSearchParams(window.location.search);
            const taskType = params.has('taskType') ? params.get('taskType') : "";
            const taskAction = params.has('taskAction') ? params.get('taskAction') : "";

            setTaskType(taskType);
            setTaskAction(taskAction);
            setReplyToId(params.has('replyToId') ? params.get('replyToId') : "");

            // parameters need to be stored as they're send back to Microsoft Teams once 
            // the workflow was approved or rejceted to update the original notification
            setSenderName(params.has('senderName') ? params.get('senderName') : "");
            setStartDate(params.has('startDate') ? params.get('startDate') : "");
            setEndDate(params.has('endDate') ? params.get('endDate') : "");
            setTimeType(params.has('timeType') ? params.get('timeType') : "");

            try {
                // Set payload required to update the leave request workflow status
                let payload = {
                    approvalStatus: taskAction,
                    workflowId: params.has('workflowId') ? params.get('workflowId') : "",
                }
                // Use the client service to call the extension application APIs, 
                // allowing us to update the workflow status of the leave request
                await clientService.updateWorkflow(authCode, teamsContext, payload);

                setMessage('Action successfully triggered!')
                setErrorMessage('')

                setActionExecuted(true);
                setLoading(false);
            } catch (error) {
                // Catch the invalid_grant or interaction_required error which indicates that
                // an additional user consent might be required 
                // Important: Not tested intensively as Admin Consent used in tutorial
                if (error.data === 'invalid_grant' || error.data === 'interaction_required') {
                    setConsentRequired(true);
                    setLoading(false);
                } else {
                    // In case there is an error while approving or rejecting the leave request
                    // the error message is displayed here for further reference
                    setMessage('Error triggering the action!')
                    setErrorMessage(error.data)

                    setActionExecuted(true);
                    setLoading(false);
                }
            }
        }
    }, [teamsContext, authCode, consentRequired]);

    // UI of the approval task module 

    // Loading indicator as long as approval/rejection process is running
    // Success or error message once the workflow update process has finsished including a button to close the task module
    // Button to start the login process in case a user consent is required (e.g. if a Graph call would be used) - Not tested in detail 
    return (
        <div className="container">
            {loading ? (
                <Flex hAlign="center" className="content-loader">
                    <Loader />
                </Flex>
            ) : (
                <div>
                    {consentRequired === false ? (
                        <div>
                            {actionExecuted ? (
                                <div className="content-message">
                                    <Flex column gap="gap.small">
                                        <Flex hAlign="center">
                                            <div>
                                                <Text size={"large"} weight={"bold"} content={message} />
                                            </div>
                                        </Flex>
                                        {errorMessage ? (
                                            <Flex hAlign="center">
                                                <div>
                                                    <Text align={"center"} size={"small"} content={errorMessage} />
                                                </div>
                                            </Flex>
                                        ) : ''}
                                        <Flex hAlign="center">
                                            <Button primary content={"Close"} onClick={submitTask} />
                                        </Flex>
                                    </Flex>
                                </div>
                            ) : (
                                <Flex hAlign="center" className="content-loader">
                                    <Loader />
                                </Flex>
                            )}
                        </div>
                    )
                        : (
                            <div className="content-login">
                                <Flex column gap="gap.large">
                                    <Flex column gap="gap.small">
                                        <Flex hAlign="center">
                                            <div>
                                                <Text size={"large"} weight={"bold"} content={"You need to sign in to use this app!"} />
                                            </div>
                                        </Flex>
                                        <Flex hAlign="center">
                                            <Button primary content={"Sign In"} onClick={showConsentPopup} />
                                        </Flex>
                                    </Flex>
                                </Flex>
                            </div>
                        )}
                </div>
            )}
        </div>
    )
}

export default TaskModule