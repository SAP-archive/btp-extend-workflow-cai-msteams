# SuccessFactors

As SAP Cloud Integration will be the integration layer for the communication between SAP Conversational AI and SAP SuccessFactors, we will need to configure the respective user credentials to allow system-to-system interaction between both products. In the first part of this mission, you've already imported the relevant integration flows into your Cloud Integration tenant. You can use these integration flows as provided (except of providing some configuration parameters before deployment). One of these configuration parameters is the name of the credential configuration within Cloud Integration. This credential configuration will be done within the following part of the mission.

1 Create a technical API user in SAP SuccessFactors
2 Create a Key-Pair in SAP Cloud Integration
3 Create an OAuth2 client in SAP SuccessFactors 
4 Create the credential configuration in SAP Cloud Integration
5 Replace the credential configuration in your integration flows

This part of the mission is based on the following SAP Blog post published in March 2021. It describes in a comprehensive way, how the OAuth2 SAML Bearer authentication can be implemented with a fixed user.

https://blogs.sap.com/2021/03/26/sap-cloud-integration-oauth2-saml-bearer-x.509-certificate-authentication-support-in-successfactors-connector/

The OAuth2 SAML Bearer approach is required, as the Basic Authentication will be deprecated from SuccessFactors side in one of the upcoming releases. 

## 1 Create a technical API user in SAP SuccessFactors

1.1 In this simplified integration approach, we're using a technical user for the communication between SAP Cloud Integration and SAP SuccessFactors. As SAP Cloud Integration acts as an integration layer between SAP Conversational AI and SAP SuccessFactors, the user will never get in touch with this technical user but is restricted in calling endpoints provided by SAP Cloud Integration, fulfilling exactly the purpose the user is supposed to use. 

1.2 As SAP SuccessFactors will retire the usage of Basic Authentication in the upcoming releases, we will make use of the OAuth2 SAML Bearer authentication approach in this case. Before you begin to go throught the steps described in the SAP Blog linked above, please create a technical API user in SAP SuccessFactors, which can use for this scenario. For simplification reasons, in our sample scenario we've used an administrative user like **sfadmin**. In a productive environment, you might need to ask your administrator to create a separate user for this purpose. 

1.3 A technical SAP SuccessFactors user for this scenario should be allowed to access the OData APIs of SAP SuccessFactors using OAuth2, should be allowed to create and modify the EmployeeTime records of all users in the system and to read basic user information of all users (like the direct manager of an employee, the user id or e-mail address) 


## 2 Create a Key-Pair in SAP Cloud Integration

Follow Step 1 of the linked SAP Blog post, to create a Key-Pair for your technical user (if your technical user is e.g. sfadmin, you have to provide **sfadmin** as the **Common Name - CN** when creating the certificate) in SAP Cloud Integration. As described in the blog, please download the certificate of the Key-Pair on your local device. You will need it when configuring the OAuth2 client within SAP SuccessFactors. 

> Hints: Give your Key-Pair a meaningful name which you can easily recognize. 

Note down the name which you've given your Key-Pair. You will need it in a later step. 


## 3 Create an OAuth client in SAP SuccessFactors

Follow Step 2 of the linked SAP Blog post, to create an OAuth2 client within SAP SuccessFactors, in which you store the certficate, you just downloaded in Step 2. You do not have to bind this OAuth2 client to a specific user but please give it a meaningful name, which shows that this OAuth2 client is used by your SAP Cloud Integration instance. The Application Url in the configuration, can be freely chosen and has (as of today) no influence on our mission. You can e.g. take the url of your SAP Cloud Integration instance like: https://abc123.integrationsuite.cfapps.eu20.hana.ondemand.com

> Hints: Make sure you only copy the certificate value between —–BEGIN CERTIFICATE—– and —–END CERTIFICATE—– </br>
> Don't forget to note the API key of your OAuth2 client which you just created. You will need it in the next step. The API key is generated, after you've saved your OAuth2 client configuration. 


## 4 Create a credential configuration in SAP Cloud Integration

Follow step 3 of the linked SAP Blog post, to create the OAuth2 SAML Bearer credential configuration within your SAP Cloud Integration instance. Give your credential configuration a meaningful and recognizable name (e.g. in our case SFSF_DC4 as we're connecting to an SAP SuccessFactors instance running in datacenter 4). The Token Service Url should be like the following format:

https://<SuccessFactors API endpoint>/oauth/token

Sample for SAP SuccessFactors Salesdemo DC4 landscape:
https://apisalesdemo4.successfactors.com/oauth/token

The latest SAP SuccessFactors landscape API endpoints can be found in the following KBA:
https://userapps.support.sap.com/sap/support/knowledge/en/2215682

Make sure that for the Key-Pair alias, you provide the identifier/name of the Key-Pair which you've defined in step 2. A sample of the credential configuration (in this case for an SAP Salesdemo tenant in SAP SuccessFactors datacenter 4) could look similar to this. Please make sure you replace the respective values with your own settings as described in this mission and the blog post. Once finished, please note down the **Name** which you've given your configuration. You will need it in the next step. 

![SFSF](./images/sfsf010.png) 


## 5 Replace the credential configuration in your integration flows

5.1 Once you've created your personal SAP SuccessFactors credential configuration in Step 4, you have to include it into your SAP SuccessFactors backend calls embedded in the Integration Flows. You've imported these Integration Flows in Part 1 of this mission. Please open the two integration flows and perfporm the following steps. 

5.2 If you e.g. open the **Approve Leave Request** integration flow, please click on **Configure** in the read-only mode. This allows you to set some variables, which are embedded in the intgration flow and require your customer specific landscape settings. 

![SFSF](./images/sfsf020.png) 

5.3 From the **Receiver** dropdown, please select SFSF and select the Adapter Type **SuccessFactors**. Please be aware, that there might be multiple Adapter Type instances called **SuccessFactors**! In this case, please repeat the steps for all available Adapter Type instances. 

![SFSF](./images/sfsf035.png) 

5.4 In the uploaded flows provided in Part 1 of this tutorials, a dummy value has been inserted into the **Address** and **Credential Name** field. Please replace these values with your customer specific SAP SuccessFactors API endpoint and the name of your credential configuration from step 4. Once you've set the respective field values for all SFSF Adapter Types, save or redeploy the Integration Flow to your tenant. 

![SFSF](./images/sfsf030.png) 

A sample of how such a configuration could look like for an SAP SuccessFactors Salesdemo system running in datacenter 4 could look like the following. 

![SFSF](./images/sfsf040.png) 