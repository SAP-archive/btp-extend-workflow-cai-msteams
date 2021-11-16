# Microsoft Teams App

To make your Leave Request Bot available to other Microsoft Teams users within your organization, you have to upload the required configuration information to your Microsoft Teams organization. 

This can be done from the Microsoft Teams client or from the Microsoft Teams admin interface. In this documentation, we will show you how to upload the app definition from your Microsoft Teams client. The process consists of three steps.

<br>

### Step 1 - Define your app's manifest file and relevant app icons

The definition of your app and the features provided by this app are described in a manifest.json file. This file contains e.g. the Id of your Microsoft Azure application registration, the name and description of your app and further information required by Microsoft Teams to host your app.

The basic version of a manifest.json file required for your Microsoft Teams app, looks like the following. For further details of the manifest.json file definition, please check the following url: </br>

https://docs.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema

```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.8/MicrosoftTeams.schema.json",
  "manifestVersion": "1.8",
  "version": "1.0.0",
  "id": "<microsoft app id>", -- e.g. b52dc093-a1b2-c1c2-c2c3-e155062c4be9
  "packageName": "<package name>", -- e.g. com.mycompany.sfsf.caileaverequest
  "developer": {
      "name": "<company name>", -- e.g. SAP
      "websiteUrl": "<url>", -- e.g. https://www.mycompany.com
      "privacyUrl": "<privacy url>", -- e.g. https://www.mycompany.com/privacy
      "termsOfUseUrl": "<terms-of-use url>" --e.g. https://www.mycompany.com/terms
  },

  "name": {
      "short": "<name of your app (<=30 chars)>", -- e.g. Leave Request
      "full": "<full name of app, if longer than 30 characters (<=100 chars)>" -- e.g. SuccessFactors Leave Request
  },
  "description": {
      "short": "<short description of your app (<= 80 chars)>", -- e.g. Leave Request
      "full": "<full description of your app (<= 4000 chars)>" -- e.g. SuccessFactors Leave Request
  },
  "icons": {
      "color": "<relative path to a transparent .png icon — 32px X 32px>", -- e.g. icon-color.png
      "outline": "<A relative path to a full color .png icon — 192px X 192px>" -- e.g. icon-outline.png
  },
  "accentColor": "<html color code>", e.g. #FFFFFF
  "bots": [
    {
      "botId": "<microsoft app id registered with bot framework>", -- e.g. b52dc093-a1b2-c1c2-c2c3-e155062c4be9
      "scopes": [
        "personal"
      ],
      "supportsFiles": false,
      "isNotificationOnly": false
    }
  ],
  "permissions": [
      "identity",
      "messageTeamMembers"
  ],

  "validDomains": [
      "*.botframework.com"
  ]
}

```

A sample manifest.json and two sample png files (icons for your app) can be found in this [GitHub repository](https://github.com/SAP-samples/btp-extend-workflow-cai-msteams/blob/advance-scope/Part6-MSTeamsApp/files). 

Please be aware, that you need to exchange the App Id within this sample manifest.json file to make your bot work! Simply search for \<<MicrosoftAppId\>> and replace the dummy value with the App Id created in Part 4 of this tutorial. 

<br>

### Step 2 - Zip your configuration files and upload them to your Microsoft Teams organization

2.1 Before you can upload your manifest.json and the corresponding png files to your Microsoft Teams organization you have to zip the three files into one archive. The name of the zip file can be chosen by you. 

![TeamsApp](./images/teams010.png) 

2.2 Open Microsoft Teams on your desktop device or go for the Microsoft Teams Web app (https://teams.microsoft.com/). Login with your **Microsoft Office 365** user, which you've added to your Microsoft Azure Active Directory. To upload new apps to your Microsoft Teams organization, the user needs the **Teams administrator** role assignment in your Microsoft Azure AD.  

![TeamsApp](./images/teams020.png) 

2.3 Within the Microsoft Teams desktop client or the Web app, click on **Apps** and then on **Upload a custom app**. Select **Upload for my org**. 

>There are also other approaches to distribute apps to Microsoft Teams users, but for a demo purpose, you can follow this approach. 

![TeamsApp](./images/teams030.png) 

2.4 Select your zip archive and confirm the upload to your Microsoft Teams organization. 

2.5 Once the upload has finished, you can find your app in the section **Built for your org**. 

![TeamsApp](./images/teams040.png) 

<br>

### Step 3 - Add the Microsoft Teams app to your user's Microsoft Teams instance

3.1 Add the app to your current user's Microsoft Teams instance, by clicking on the app tile and selecting **Add** within the popup. 

![TeamsApp](./images/teams050.png) 

3.2 The app should become visible in your left side menu of Microsoft Teams. If it doesn't open automatically, select the app manually from the menu. You can also pin it, using a right-click. 

Once the app opens the first time, you should either see a welcome message sent by the bot or you need to type a message like **Heyhey!** to initialize the conversation.

![TeamsApp](./images/teams060.png) 

![TeamsApp](./images/teams070.png) 

3.3 The last two steps (3.1 and 3.2) can now also be performed by other Microsoft Teams users within your organization, to add the app to their personal instance. 

