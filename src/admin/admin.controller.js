import express from "express";
import { checkAdmin } from "../methods.js";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const app = express.Router();

app.get('/users', checkAdmin, async (req, res) => {
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

app.put('/allow/:id', checkAdmin,  async (req, res) => {
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

app.put('/revoke/:id', checkAdmin, async (req, res) => {
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

export default app;