import React, { useEffect } from 'react';
import * as microsoftTeams from "@microsoft/teams-js";

// Loaded once the implicit grant flow completed
const AuthStart = () => {
    useEffect(() => {
        microsoftTeams.initialize();
        microsoftTeams.getContext((context) => {
            // Close the popup
            return microsoftTeams.authentication.notifySuccess();
        });
    })

    return (
        <div>
            <h1>Consent flow completed</h1>
        </div>
    );
}

export default AuthStart;