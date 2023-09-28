import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config as configureEnv } from "dotenv";
import express from "express";
import adminController from './admin/admin.controller.js';
import authController from './auth/auth.controller.js';
import { checkAppToken, checkJWT, requestAppToken } from "./methods.js";
import slackController from './slack/slack.controller.js';
import path from 'path';
import { fileURLToPath } from 'url';

let __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

configureEnv();
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://foodbot-devportal.vercel.app',
    ],
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers', 'Set-Cookie');
    next();
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server started at port", PORT);
});

app.use('/slack', checkJWT, slackController);

// ADMIN FEATURES
app.use('/auth', authController)
app.use('/admin', adminController)

// request token
app.get('/request-token', (req, res) => {
    res.sendFile(__dirname + '/html/requestToken.html')
})

app.post('/request-token', async (req, res) => {
    let { name } = req.body;
    if (!name) return res.status(400).send({
        success: false,
        message: "Invalid request"
    })
    await requestAppToken(name);
    res.redirect('/token?name=' + name)
})

app.get('/token', (req, res) => {
    res.sendFile(__dirname + '/html/checkToken.html')
})

app.get('/get-token/:name', async (req, res) => {
    let { name } = req.params;
    let token = await checkAppToken(name);
    if (!token) return res.status(401).send({
        success: false,
        message: "Unauthorized"
    })
    res.send({
        success: true,
        token
    })
})