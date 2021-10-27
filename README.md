[![REUSE status](https://api.reuse.software/badge/github.com/SAP-samples/btp-extend-workflow-cai-msteams)](https://api.reuse.software/info/github.com/SAP-samples/btp-extend-workflow-cai-msteams)

# Extend your business workflow with Microsoft Teams and Outlook (Advance Scope)

This repository contains code samples and step by step instructions 

![Solution Architecture](-/../images/Advance%20Scope.png)

## Description

The Objective of the advanced scope is similar to basic scope and the idea is to extend productivity beyond SAP ecosystem by using Microsoft Teams and Microsoft Outlook as engagement channels. In advanced scope instead of using the custom Java application and SAP Workflow Management we are demonstrating how to connect SAP SuccessFactors system for requesting the time off by using SAP Cloud Integration as an integration layer.

This mission requires you to have access to a SuccessFactors system. This includes administrative privileges to define settings like OAuth clients or to assign test users the relevant privileges to access OData APIs. This mission was created based on an SAP SuccessFactors Salesdemo environment instance. A productive landscape might differ in configuration options.

1. [Cloud Integration ](./Part1-CloudIntegration/README.md)
   - Import the required Cloud Integration flows
   - Configure the Cloud Integration flow

2. [API Management](./Part2-APIManagement/README.md)
   - Create the required API Management endpoint
   - Enable Actionable Messages (Adaptive Cards)
   - Configure the Cloud Integration flow

3. [SuccessFactors](./Part3-SuccessFactors/README.md)
   - Configure the SAP SuccessFactors - SAP CI integration
   - Apply dummy user requirements (matching mail address)
   - Create the required OAuth client configurations

4. [Conversational AI](./Part4-ConversationalAI/README.md)
   - Create an account for SAP Conversational AI and get started
   - Configure the Action to trigger Leave Request
   - APPENDIX: Getting the correct Time Types for your test user

5. [Microsoft Azure Bot](./Part5-MSAzureBot/README.md)
   - Create an Microsoft Azure Bot Channel instance
   - Configure the Conversational AI - Microsoft Azure integration

6. [Microsoft Teams App](./Part6-MSTeamsApp/README.md)
   - Create an Microsoft Teams app manifest definition
   - Upload the manifest file to your Teams organization

7. [Task Center](./Part6-MSTeamsApp/README.md)
   - Create an SAP Task Center instance
   - Configure SAP Task Center - SAP SuccessFactors integration
   - Apply your SAP Task Center destination settings

   - APPENDIX: Manual setting of the user UUID in SAP SuccessFactors

## Known Issues

No known issues at this time
## How to obtain support

[Create an issue](https://github.com/SAP-samples/btp-extend-workflow-cai-msteams/issues) in this repository if you find a bug or have questions about the content.
 
For additional support, [ask a question in SAP Community](https://answers.sap.com/questions/ask.html).

## Contributing

If you would like to contribute, please submit a pull request in the usual fashion.

## License
Copyright (c) 2021 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSES/Apache-2.0.txt) file.
