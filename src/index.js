import express from "express";
import { config as configureEnv } from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import pkg from "@slack/bolt";
import { PrismaClient } from '@prisma/client'
import { addAdmin, checkAdmin, login } from "./methods.js";
import { isProd } from "./utils.js";

const prisma = new PrismaClient()

const app = express();

const { App } = pkg;

configureEnv();
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());


const slackApp = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    port: 8080,
    socketMode: false,
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server started at port", PORT);
});

app.post('/slack', async (req, res) => {
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

// ADMIN FEATURES
app.post('/add-admin', async (req, res) => {
    if (isProd()) return res.status(403).send({
        success: false,
        message: "This feature is not available in production"
    })

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).send({
            success: false,
            message: "Please provide all the required fields"
        })
    }

    addAdmin({ name, email, password }).then((success) => {
        if (success) {
            return res.send({
                success: true,
                message: "Admin added successfully"
            })
        }
        return res.status(500).send({
            success: false,
            message: "Something went wrong"
        })
    })

})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send({
            success: false,
            message: "Please provide all the required fields"
        })
    }

    login({ email, password }).then((response) => {
        if (response.success) {
            res.cookie("jwt", response.token, {
                httpOnly: true,
                secure: isProd(),
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 1 // 1 day
            })
            return res.send({
                success: true,
                message: "Logged in successfully",
                token: response.token
            })
        }
        return res.status(401).send({
            success: false,
            message: response.message
        })
    })
})

app.use('/admin', checkAdmin)
app.get('/admin/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.send({
            success: true,
            users
        })
    } catch (e) {
        res.status(500).send({
            success: false,
            message: e.message
        })
    }
})

app.put('/admin/allow/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.update({
            where: {
                id
            },
            data: {
                allowedAccess: true
            }
        })
        res.send({
            success: true,
            message: "User allowed"
        })
    } catch (e) {
        res.status(500).send({
            success: false,
            message: e.message
        })
    }
})

app.put('/admin/revoke/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.user.update({
            where: {
                id
            },
            data: {
                allowedAccess: false
            }
        })
        res.send({
            success: true,
            message: "User access revoked"
        })
    } catch (e) {
        res.status(500).send({
            success: false,
            message: e.message
        })
    }
})