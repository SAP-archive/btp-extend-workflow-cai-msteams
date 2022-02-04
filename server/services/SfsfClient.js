/**
 * SfsfClient.js provides a class offering features for retrieving SAP SuccessFactors data
 * 
 * This class provides calls to SAP Cloud Integration acting as integration layer to SAP SuccessFactors.  
 * Authentication itself is not handled in this class but makes use of the AuthClient.js. The respective
 * access token needs to be provided when calling the methods of this class. 
 * 
 */

import axios from 'axios'

class SfsfClient {
    constructor(){
        this.ciBaseUrl = process.env.CI_BASE_URI;
        this.ciPath = process.env.CI_PATH;
    }

    // Get time types of a user
    async getTimeTypes(token, data) {
        const cpiUrl = this.ciBaseUrl + this.ciPath + '/sfsf/timeOff/timeTypes' ;

        var res = await (async () => {
            try {
                let res = await axios.post(cpiUrl, {}, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'employeeMail' : data.profile.mail
                    }
                });
                return res;
            } catch (err) {
                console.error(err);
                return err.response;
            }
        })();

        if (res.status >= 400) {
            console.error(res.data);
            throw new Error(res.data); 
        } else {
            if (res.data){
                console.log(res.status)
                return res.data;
            }else{
                console.error("HTTP Response was invalid and cannot be deserialized.");
                throw new Error("HTTP Response was invalid and cannot be deserialized."); 
            }
        }
    }

    // Get the balance of a selected time type passed in the data parameter
    async getTimeBalance(token, data) {
        const cpiUrl = this.ciBaseUrl + this.ciPath + '/sfsf/timeOff/timeBalance';

        var res = await (async () => {
            try {
                let res = await axios.post(cpiUrl, {}, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'employeeId' : data.employeeId,
                        'timeType' : data.leaveType
                    }
                });
                return res;
            } catch (err) {
                console.error(err);
                return err.response;
            }
        })();

        if (res.status >= 400) {
            console.error(res.data);
            throw new Error(res.data); 
        } else {
            if (res.data){
                console.log(res.status)
                return res.data.Message1 ? res.data.Message1 : res.data;
            }else if (res.data === ''){
                // In case the result data is empty, the balance of the time type is unlimted
                // TODO: This needs to be improved and tested in detail 
                console.log(res.status)
                return {
                    balanceUnlimited: true
                }
            }else{
                console.error("HTTP Response was invalid and cannot be deserialized.");
                throw new Error("HTTP Response was invalid and cannot be deserialized."); 
            }
        }
    }


    // Get the details of a specific leave request passed in the data parameter 
    async getLeaveRequest(token, data) {
        const cpiUrl = this.ciBaseUrl + this.ciPath + '/sfsf/timeOff/getLeaveRequest' ;

        var res = await (async () => {
            try {
                let res = await axios.post(cpiUrl, {}, {
                    headers: {
                        'leaveRequestId': data.leaveRequestId,
                        'Authorization': `Bearer ${token}` 
                    }
                });
                return res;
            } catch (err) {
                console.error(err);
                return err.response;
            }
        })();

        if (res.status >= 400) {
            console.error(res.data);
            throw new Error(res.data); 
        } else {
            if (res.data){
                console.log(res.status)
                return res.data;
            }else{
                console.error("HTTP Response was invalid and cannot be deserialized.");
                throw new Error("HTTP Response was invalid and cannot be deserialized."); 
            }
        }
    }

    // Create a new leave request based on the values passed in the data parameter
    async createLeaveRequest(token, data) {
        const cpiUrl = this.ciBaseUrl + this.ciPath + '/sfsf/timeOff/createLeaveRequest' ;

        var res = await (async () => {
            try {
                let res = await axios.post(cpiUrl, {}, {
                    headers: {
                        'employeeid': data.employeeId,
                        'startdate' : data.startDate,
                        'enddate': data.endDate,
                        'timetype': data.timeType,
                        'Authorization': `Bearer ${token}` 
                    }
                });
                return res;
            } catch (err) {
                console.error(err);
                return err.response;
            }
        })();

        if (res.status >= 400) {
            console.error(res.data);
            throw new Error(res.data); 
        } else {
            if (res.data){
                console.log(res.status)
                return res.data;
            }else{
                console.error("HTTP Response was invalid and cannot be deserialized.");
                throw new Error("HTTP Response was invalid and cannot be deserialized."); 
            }
        }
        
    }

    // Get the details of a workflow instance passed in via the data parameter
    async getWorkflow(token, data) {
        const cpiUrl = this.ciBaseUrl + this.ciPath + '/sfsf/workflow/getWorkflow' ;

        var res = await (async () => {
            try {
                let res = await axios.post(cpiUrl, {}, {
                    headers: {
                        'workflowId': data.workflowId,
                        'Authorization': `Bearer ${token}` 
                    }
                });
                return res;
            } catch (err) {
                console.error(err);
                return err.response;
            }
        })();

        if (res.status >= 400) {
            console.error(res.data);
            throw new Error(res.data); 
        } else {
            if (res.data){
                console.log(res.status)
                return res.data;
            }else{
                console.error("HTTP Response was invalid and cannot be deserialized.");
                throw new Error("HTTP Response was invalid and cannot be deserialized."); 
            }
        }
        
    }

    // Update the approval status of a workflow passed in via the data parameter
    async updateWorkflow(token, data) {
        const cpiUrl = this.ciBaseUrl + this.ciPath + '/sfsf/workflow/updateWorkflow' ;

        var res = await (async () => {
            try {
                let res = await axios.post(cpiUrl, {}, {
                    headers: {
                        'workflowId': data.workflowId,
                        'approvalStatus' : data.approvalStatus,
                        'Authorization': `Bearer ${token}` 
                    }
                });
                return res;
            } catch (err) {
                console.error(err);
                return err.response;
            }
        })();

        if (res.status >= 400) {
            console.error(res.data);
            throw new Error(res.data); 
        } else {
            if (res.data){
                console.log(res.status)
                return res.data;
            }else{
                console.error("HTTP Response was invalid and cannot be deserialized.");
                throw new Error("HTTP Response was invalid and cannot be deserialized."); 
            }
        }
        
    }
}

export default SfsfClient
