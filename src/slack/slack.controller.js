import express from "express";
import pkg from "@slack/bolt";

const { App } = pkg;
const slackApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    port: 8080,
    socketMode: false,
});

const app = express.Router();

app.post('/', async (req, res) => {
    if (req.body.type === "url_verification") {
        return res.send(req.body.challenge);
    }
    res.status(200).send('OK')
})


app.post('/send-message/:channel', async (req, res) => {
    const { channel } = req.params;
    const { message } = req.body;
    const channels = await slackApp.client.conversations.list({
        types: "public_channel,private_channel",
    });
    const channelId = channels.channels.find(c => c.name === channel)?.id;
    if (!channelId) {
        return res.status(404).send(`Channel ${channel} not found`);
    }
    // continue with sending message to the channel
    await slackApp.client.chat.postMessage({
        channel: channelId,
        text: message,
    });
    res.send({
        success: true,
        message: "Message sent successfully"
    })
})

export default app;