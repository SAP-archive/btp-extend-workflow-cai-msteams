import axios from "axios";

/*
 * https://github.com/OfficeDev/Microsoft-Teams-Samples/blob/main/samples/app-sso/nodejs/client/src/service/TeamsClientService.js 
 */

// Get the Microsoft Teams client context from the teamsClient object
const clientContext = async (teamsClient, timeout = 10000) => {
    return new Promise((resolve, reject) => {
        let shouldReject = true;
        teamsClient.getContext((teamsContext) => {
            shouldReject = false;
            resolve({
                ...teamsContext,
                meetingId: teamsContext.meetingId,
                conversationId: teamsContext.chatId,
            });
        });
        setTimeout(() => {
            if (shouldReject) {
                console.error("Error getting context: Timeout. Make sure you are running the app within teams context and have initialized the sdk");
                reject("Error getting context: Timeout");
            }
        }, timeout);
    });
}


// Call to the extension application API to update the status of a workflow
// Processed by server/api/router/appRouter.js express route
const updateWorkflow = async (authCode, context, data) => {
    const payload = {
        context: context,
        data: data
    }

    const config = {
        headers: {
            Authorization: `Bearer ${authCode}`
        },
        validateStatus: () => {
            return true
        }
    }

    return new Promise((resolve, reject) => {
        axios.post('/api/sfsf/workflow', payload, config).then((result) => {
            if (result.status >= 200 && result.status < 300) {
                resolve(result.data);
            } else {
                let error = result;
                console.log(error)
                reject(error);
            }
        })
    })
}

// Sample call to the extension application API to read a user's azure profile
// Will be processed by server/api/router/appRouter.js express route
// Currently not in use but could e.g. be used in a custom tab extension
const getUserProfile = async (authCode, context, userId) => {
    const payload = {
        context: context,
        userId: userId ? userId : ''
    }

    const config = {
        headers: {
            Authorization: `Bearer ${authCode}`
        },
        validateStatus: () => {
            return true
        }
    }

    return new Promise((resolve, reject) => {
        axios.post(`/api/user/profile`, payload, config).then((result) => {
            if (result.status >= 200 && result.status < 300) {
                resolve(result.data);
            } else {
                let error = result;
                console.log(error)
                reject(error);
            }
        })
    })
}

// Sample call to the extension application API to read a user's azure photo
// Will be processed by server/api/router/appRouter.js express route
// Currently not in use but could e.g. be used in a custom tab extension
const getUserPhoto = async (authCode, context, userId) => {
    const payload = {
        context: context,
        userId: userId ? userId : ''
    }

    const config = {
        headers: {
            Authorization: `Bearer ${authCode}`
        },
        validateStatus: () => {
            return true
        }
    }

    return new Promise((resolve, reject) => {
        axios.post(`/api/user/photo`, payload, config).then((result) => {
            if (result.status >= 200 && result.status < 300) {
                resolve(result.data);
            } else {
                let error = result;
                console.log(error)
                reject(error);
            }
        })
    })
}

// Sample call to the extension application API to read the details of a leave request
// Will be processed by server/api/router/appRouter.js express route
// Currently not in use but could e.g. be used in a custom tab extension
const getLeaveRequest = async (authCode, data) => {
    const config = {
        headers: {
            Authorization: `Bearer ${authCode}`
        },
        validateStatus: () => {
            return true
        }
    }

    return new Promise((resolve, reject) => {
        axios.get(`/api/sfsf/leaverequest/${data.leaveRequestId}`, config).then((result) => {
            if (result.status >= 200 && result.status < 300) {
                resolve(result.data);
            } else {
                let error = result;
                console.log(error)
                reject(error);
            }
        })
    })
}


export {
    clientContext,
    updateWorkflow,
    getUserProfile,
    getUserPhoto,
    getLeaveRequest
}
