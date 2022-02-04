
import React, { useEffect } from 'react';
import * as microsoftTeams from "@microsoft/teams-js";

const AuthEnd = () => {
    useEffect(() => {
        microsoftTeams.getContext((context) => {

            // Build an Azure AD request that authenticate the user and ask them to and to consent to any missing permissions
            const tenantId = context['tid'];
            const clientId = process.env.REACT_APP_MICROSOFT_APP_ID;

            let queryParams = {
                tenant: tenantId,
                client_id: clientId,
                response_type: "code",
                scope: process.env.REACT_APP_APP_SCOPES,
                redirect_uri: window.location.origin + "/auth-end"
            }

            const authorizeEndpoint =
            `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
            new URLSearchParams(queryParams).toString();

            //Redirect to the Azure authorization endpoint. When  flow completes, the user will be directed to auth-end
            window.location.assign(authorizeEndpoint);
        });
    }, [])

    return (
        <div>
            <h1>Redirecting to consent page...</h1>
        </div>
    );
}

export default AuthEnd;
