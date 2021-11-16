# Microsoft Azure Bot

To be able to use your SAP Conversational AI Bot within Microsoft Teams, you will need a so called Bot Channel registration within Microsoft Azure. A channel is a connection between a communication application like Microsoft Teams, Alexa or Slack and the actual bot. To create a new Bot Channel in your Azure Active Directory please make use of the following steps.

</br>

### Step 1 - Login to your Microsoft Azure (trial) account

1.1 Login to [Microsoft Azure Portal](https://portal.azure.com/#home) with your personal **Azure AD** (trial) user. 

1.2 In case you're using an Azure trial environment - Please make sure, you're within the **Default Directory** created with your Azure trial account.

![MSAzureBot](./images/mab005.png)

![MSAzureBot](./images/mab010.png)

<br>

### Step 2 - Create an Azure Bot Channel

2.1 Go to the Azure Portal [Microsoft Azure Portal](https://portal.azure.com/#home) (if not yet there).

2.2 Search for **Azure Bot** and select the corresponding offering from the Marketplace.

![MSAzureBot](./images/mab020.png)

2.3 Fill in the service detail form as follows.

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

2.4 Click on **Review and Create** to be guided to the next step. Here the message **Validation passed** should appear on the screen.

![MSAzureBot](./images/mab040.png)

2.5 Continue with **Create**. 

2.6 Wait until the deployment has finished. Then click on **"Go to Resource"**

![MSAzureBot](./images/mab050.png)

![MSAzureBot](./images/mab060.png)

You have sucessfully created your first Azure bot channel. 

<br>

## Step 3 - Get your app ID and create a secret

3.1 Open the section **Configuration** in a new browser tab.

![MSAzureBot](./images/mab070.png)

3.2 <a name="appid"></a>Note down the **Microsoft App ID**. You will need this later within SAP Conversational AI to establish the connectivity.

![MSAzureBot](./images/mab080.png)

3.3 Select **Manage** above your **Microsoft App ID** to navigate to the secrets section of the application registration.

3.4 Select **New Client secret**, give the secret a name and finish the secret creation with **Add**.

![MSAzureBot](./images/mab090.png)

![MSAzureBot](./images/mab100.png)

3.5 <a name="secret"></a>Note down the **Client Secret**. Like the Microsoft App ID, you will need it later within SAP Conversational AI to establish the connectivity.

![MSAzureBot](./images/mab110.png)

<br>

## Step 4 - Connect SAP Conversational AI to Microsoft Teams

4.1 Open a new browser tab, go to [SAP Conversational AI](https://cai.tools.sap/) and open your bot.

4.2 Go to the **Connect** tab and select Microsoft Teams via Microsoft Azure.

![MSAzureBot](./images/mab120.png)

4.3 Provide the **App ID** ([in Azure known as **Microsoft App Id**, see Step 3.2](#appid)) and **Password** ([in Azure known as Secret, see Step 3.5](#secret)). As recommended, you have propably noted down these values in the previous steps. 

![MSAzureBot](./images/mab130.png)

4.4 Click on **Connect**.

![MSAzureBot](./images/mab140.png)

4.5 Copy the Messaging endpoint which you can see on your screen. 

![MSAzureBot](./images/mab150.png)

4.6 Go back to the browser tab in which you've started the Azure bot channel configuration. Here you should see a section called **Configuration**. **Paste** the **Messaging endpoint** of SAP Conversational AI into the corresponding Input field of the Configuration form.

![MSAzureBot](./images/mab160.png)

4.7 **Apply** the changes.

4.8 The complete the connection setup between your SAP CAI bot and Microsoft teams, switch to the **Channels** section and select the **Microsoft Teams** icon.

![MSAzureBot](./images/mab170.png)

4.9 **Save** the Channel configuration without any further adjustments.

![MSAzureBot](./images/mab180.png)

<br>

### Step 5 - Test your bot in Microsoft Teams

5.1 Switch to **Channels (Preview)** and open your bot in Microsoft Teams.

![MSAzureBot](./images/mab190.png)

5.2 You'll most likely be asked if you want to use your Microsoft Teams Desktop or Web app. **Make sure you are using the Web app**. 

   > For the sake of simplicity we are using the Web app of Microsoft Teams, where you can conveniently login with any Microsoft365 user. Using the Desktop app, there might be overlaps with already logged in accounts like your Microsoft Teams office profile. 

5.3 If you are asked to log in, use your **Microsoft365 developer account**!

5.4 You can now have a conversation with the Chatbot within Microsoft Teams. 

![MSAzureBot](./images/mab200.png)
