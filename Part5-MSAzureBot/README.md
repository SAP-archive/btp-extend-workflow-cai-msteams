# Microsoft Azure Bot

To be able to use your SAP Conversational AI Bot within Microsoft Teams, you will need a so called Bot Channel registration within Microsoft Azure. A channel is a connection between a communication application like Microsoft Teams, Alexa or Slack and the actual bot. To create a new Bot Channel in your Azure Active Directory please make use of the following steps.

</br>

### Step 1 - Microsoft Azure & Microsoft Teams license

1.1 Create a Microsoft Azure (trial) account

This step of the tutorial requires an active **Microsoft Azure** account. In case you don't have access to an enterprise Azure subscription, you can create a Microsoft Azure **trial account** yourself. Therefor, please follow the steps described in the **Basic scope** of this scenario.

[Setup Free Microsoft Azure Account](https://github.com/SAP-samples/btp-extend-workflow-cai-msteams/blob/basic-scope/Part0/README.md)

1.2 Get a Microsoft Teams license

To use Microsoft Teams, a license is required. If you don't have a Microsoft Teams license yet, you can get it by either subscribing to an additional free **Microsoft365 Developer** acccount or by adding a suitable **Microsoft Teams license** to your Azure Active Directory. If you're eligible for the **Microsoft Teams Exploratory** license, you can add this license to your Azure Active Directory, by following the steps described below.

**Microsoft365 Developer acccount license**

If you subscribed to a **Microsoft365 Developer account**, please add the respective Microsoft Office365 user to your **Azure AD**. This user will be required in a later step of this tutorial to test your chatbot within Microsoft Teams. The process is also described in the **Basic scope** of this scenario. 

[Setup Microsoft365 Developer Account](https://github.com/SAP-samples/btp-extend-workflow-cai-msteams/blob/basic-scope/Part0/README.md#step-4---create-a-microsoft365-developer-account)

**Azure Active Directory license**

If you want to allow all of your Azure Active Directory users to make use of the chat bot within Microsoft Teams, you can add a respective license directly to Azure Active Directory. This can e.g. be the **Microsoft Teams Exploratory** license, which is a free trial license (usable for 12 months), allowing you to use Microsoft Teams and other Office365 features with your Active Directory users. You can find details on how to add the Microsoft Teams Exploratory License to your Azure Active Directory at the end of this unit. 

[Setup the Microsoft Teams Exploratory License](#1---add-a-microsoft-teams-exploratory-license)

**IMPORTANT:** For successfull testing, you need to ensure, that the test-users, have the same e-mail address as your dedicated SAP SuccessFactors users. Otherwise a mapping between Microsoft and SAP environment is not possible! This applies for the usage of a Microsoft365 Developer account as well as the standalone usage of Azure Active Directory. 

<br>

### Step 2 - Login to your Microsoft Azure account

2.1 Login to [Microsoft Azure Portal](https://portal.azure.com/#home) with your **Azure Active Directory** administrator user which was created when you set up your Microsoft Azure (trial) account. 

2.2 In case you're using an Azure trial environment - Please make sure, you're within the **Default Directory** created with your Azure (trial) account.

![MSAzureBot](./images/mab005.png)

![MSAzureBot](./images/mab010.png)

<br>

### Step 3 - Create an Azure Bot Channel

3.1 Go to the Azure Portal [Microsoft Azure Portal](https://portal.azure.com/#home) (if not yet there).

3.2 Search for **Azure Bot** and select the corresponding offering from the Marketplace.

![MSAzureBot](./images/mab020.png)

3.3 Fill in the service detail form as follows.

| Field Name       | Input Value                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bot handle       | A unique display name for the bot (which will appear in channels and directories – this can be changed later)                                                                        |
| Subscription     | Your Azure subscription (in  trial, only one)                                                                                                                                        |
| Resource Group   | Select a resource group. If you don’t have one yet, then create a new one (A resource group is a collection of resources that share the same lifecycle, permissions, and policies.) |
| Location         | Choose a location which is close to you, where your bot is deployed                                                                                                                                    |
| Pricing Tier     | F0 (10K Premium Messages)                                                                                                                                                            |
| Microsoft App ID | **Create new Microsoft App ID**                                                                                                                                                      |
> Make sure you select the F0 free pricing tier, unless you want to use it in production.

![MSAzureBot](./images/mab030.png)

3.4 Click on **Review and Create** to be guided to the next step. Here the message **Validation passed** should appear on the screen.

![MSAzureBot](./images/mab040.png)

3.5 Continue with **Create**. 

3.6 Wait until the deployment has finished. Then click on **"Go to Resource"**

![MSAzureBot](./images/mab050.png)

![MSAzureBot](./images/mab060.png)

You have sucessfully created your first Azure bot channel. 

<br>

## Step 4 - Get your app ID and create a secret

4.1 Open the section **Configuration** in a new browser tab.

![MSAzureBot](./images/mab070.png)

4.2 <a name="appid"></a>Note down the **Microsoft App ID**. You will need this later within SAP Conversational AI to establish the connectivity.

![MSAzureBot](./images/mab080.png)

4.3 Select **Manage** above your **Microsoft App ID** to navigate to the secrets section of the application registration.

4.4 Select **New Client secret**, give the secret a name and finish the secret creation with **Add**.

![MSAzureBot](./images/mab090.png)

![MSAzureBot](./images/mab100.png)

4.5 <a name="secret"></a>Note down the **Client Secret**. Like the Microsoft App ID, you will need it later within SAP Conversational AI to establish the connectivity.

![MSAzureBot](./images/mab110.png)

<br>

## Step 5 - Connect SAP Conversational AI to Microsoft Teams

5.1 Open a new browser tab, go to [SAP Conversational AI](https://cai.tools.sap/) and open your bot.

5.2 Go to the **Connect** tab and select Microsoft Teams via Microsoft Azure.

![MSAzureBot](./images/mab120.png)

5.3 Provide the **App ID** ([in Azure known as **Microsoft App Id**, see Step 4.2](#appid)) and **Password** ([in Azure known as Secret, see Step 4.5](#secret)). As recommended, you have propably noted down these values in the previous steps. 

![MSAzureBot](./images/mab130.png)

5.4 Click on **Connect**.

![MSAzureBot](./images/mab140.png)

5.5 Copy the Messaging endpoint which you can see on your screen. 

![MSAzureBot](./images/mab150.png)

5.6 Go back to the browser tab in which you've started the Azure bot channel configuration. Here you should see a section called **Configuration**. **Paste** the **Messaging endpoint** of SAP Conversational AI into the corresponding Input field of the Configuration form.

![MSAzureBot](./images/mab160.png)

5.7 **Apply** the changes.

5.8 The complete the connection setup between your SAP CAI bot and Microsoft teams, switch to the **Channels** section and select the **Microsoft Teams** icon.

![MSAzureBot](./images/mab170.png)

5.9 **Save** the Channel configuration without any further adjustments.

![MSAzureBot](./images/mab180.png)

<br>

### Step 6 - Test your bot in Microsoft Teams

6.1 Switch to **Channels (Preview)** and open your bot in Microsoft Teams.

![MSAzureBot](./images/mab190.png)

6.2 You'll most likely be asked if you want to use your Microsoft Teams Desktop or Web app. **Make sure you are using the Web app**. 

   > For the sake of simplicity we are using the Web app of Microsoft Teams, where you can conveniently login with any Microsoft365 user. Using the Desktop app, there might be overlaps with already logged in accounts like your Microsoft Teams office profile. 

6.3 If you are asked to log in, use your **Microsoft365 developer account**!

6.4 You can now have a conversation with the Chatbot within Microsoft Teams. 

![MSAzureBot](./images/mab200.png)


## Additional topics

### 1 - Add a Microsoft Teams Exploratory license

To use Microsoft Teams, you must assign an appropriate license to your Azure Active Directory users. Therefore, you can e.g. use the **Microsoft Teams Exploratory** license for testing purposes. You can find more information and eligibility requirements to use this free license in the official Microsoft documentation [click here](https://docs.microsoft.com/en-us/microsoftteams/teams-exploratory).

In the following, I will explain you how to activate this license for your own Azure Active Directory (if eligible). If you’ve already got an existing Microsoft Teams license, make sure you assign it to your test users accordingly.

1.1 The Microsoft Teams Exploratory license can usually be **self-assigned** by one of your Azure Active Directory users. To do so, one of your Active Directory users must login to Microsoft Teams using e.g., the Microsoft Teams Web client [click here](https://teams.microsoft.com/).

1.2 Once the first user tries to use Microsoft Teams using its Azure Active Directory credentials, the following message will appear. Checking the URL, you can see that a license for Microsoft Teams is missing and whether or not, you’re **eligible for a trial license**.

![Missing license information](./images/mab210.png)

1.3 Click on **Sign up for Teams** to get more information on available Microsoft Teams licenses. Meanwhile and if eligible, in the background, the assignment of the Exploratory license should start automatically. If the assignment does not happen automatically, please check the documentation to make sure you haven't missed any prerequisites. 

1.4 **Wait a few seconds** before reloading the current page. You should now be able to login to Microsoft Teams with the same user that triggered to automated license assignment. If not, please logout and login again.

> At the same time, the Active Directory administrators will receive an e-mail information, that the Exploratory license has been activated for the organization.

![license information](./images/mab220.png)

1.5 Once the **Exploratory license** is activated for your organization, you can assign it to other users in the Azure Portal. Therefore, login as a (user) administrator to your Azure Active Directory (https://portal.azure.com/).

1.6 Select the user you want to assign the Microsoft Teams Exploratory license and switch to the **Licenses** sub-menu to start an assignment.

> Depending on your Azure Active Directory subscription type this should also be possible via a user group license assignment [click here](https://docs.microsoft.com/en-us/azure/active-directory/fundamentals/active-directory-licensing-whatis-azure-portal). In a free Active Directory please assign the license to each test user manually.

![license assignment](./images/mab230.png)

1.7 You can now assign the Microsoft Teams Exploratory license to your user. In our development landscape, we disabled the Exchange Online feature. Click on **Save** to apply the changes.

![license options](./images/mab240.png)

1.8 If you’re facing an error messages concerning the **location** in the previous step, make sure your user is assigned to a **usage location** in its Active Directory profile.

![usage location](./images/mab250.png)

1.9 All Microsoft Teams Exploratory license users should now be able to access Microsoft Teams using the Web or Desktop client. If not, try to logout and login again. That should refresh your permissions.

