import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config as configureEnv } from "dotenv";
import express from "express";
import adminController from './admin/admin.controller.js';
import authController from './auth/auth.controller.js';
import { checkJWT } from "./methods.js";
import slackController from './slack/slack.controller.js';

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
app.use(cookieParser());

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
