import axios from 'axios';

export const triggerIntegration = async (integration, responseData) => {
  try {
    switch (integration.type) {
      case 'webhook':
        await triggerWebhook(integration, responseData);
        break;
      case 'slack':
        await triggerSlack(integration, responseData);
        break;
      case 'discord':
        await triggerDiscord(integration, responseData);
        break;
      // Add more integration types as needed
      default:
        console.log(`Integration type ${integration.type} not implemented`);
    }

    // Update trigger count
    integration.triggerCount += 1;
    integration.lastTriggered = new Date();
    await integration.save();
  } catch (error) {
    console.error(`Integration ${integration.name} failed:`, error);
    throw error;
  }
};

const triggerWebhook = async (integration, responseData) => {
  const { url, method = 'POST', headers = {} } = integration.config;
  
  await axios({
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    data: {
      formId: responseData.formId,
      responses: responseData.responses,
      submittedAt: responseData.submittedAt,
      metadata: {
        integrationId: integration._id,
        integrationName: integration.name
      }
    }
  });
};

const triggerSlack = async (integration, responseData) => {
  const { webhookUrl, channel } = integration.config;
  
  const message = {
    channel: channel || '#general',
    text: 'New form submission received!',
    attachments: [
      {
        color: 'good',
        fields: responseData.responses.map(response => ({
          title: response.fieldLabel,
          value: Array.isArray(response.value) ? response.value.join(', ') : response.value,
          short: true
        }))
      }
    ]
  };

  await axios.post(webhookUrl, message);
};

const triggerDiscord = async (integration, responseData) => {
  const { webhookUrl } = integration.config;
  
  const embed = {
    title: 'New Form Submission',
    color: 0x00ff00,
    fields: responseData.responses.map(response => ({
      name: response.fieldLabel,
      value: Array.isArray(response.value) ? response.value.join(', ') : response.value,
      inline: true
    })),
    timestamp: responseData.submittedAt
  };

  await axios.post(webhookUrl, {
    embeds: [embed]
  });
};