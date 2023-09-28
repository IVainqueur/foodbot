import express from "express";
import { isProd } from "../utils.js";
import { addAdmin, login } from "../methods.js";

const app = express.Router();

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
                secure: true,
                sameSite: "none",
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

export default app;