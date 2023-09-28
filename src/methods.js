import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

/**
 * @typedef {Object} User
 * @property {string} name - The name of the user
 * @property {string} email - The email of the user
 * @property {string} password - The password of the user
 */


/**
 * Add a new admin
 * @async
 * @function
 * @param {...User} user - The user object
 * @returns {boolean} - Returns true if the user was added successfully
 */
export const addAdmin = async (user) => {
    try {
        await prisma.admin.create({
            data: {
                name: user.name,
                email: user.email,
                password: bcrypt.hashSync(user.password, Number(process.env.BCRYPT_SALT)),
            },
        })
        return true;
    } catch (e) {
        console.log(e.message)
        return false;
    }
}

/**
 * Login admin
 * @async
 * @function
 * @param {...User} user - The user object
 */
export const login = async(user) => {
    const admin = await prisma.admin.findUnique({
        where: {
            email: user.email
        }
    })
    if (!admin) return {
        success: false,
        message: "Invalid credentials"
    }

    const passwordMatch = bcrypt.compareSync(user.password, admin.password);
    if (!passwordMatch) return {
        success: false,
        message: "Invalid credentials"
    }

    return {
        success: true,
        message: "Login successful",
        token: jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '1d'})
    }
}

export const checkAdmin = async (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token) {
        return res.status(401).send({
            success: false,
            message: "Unauthorized"
        })
    }
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        console.log("[log] Admin authenticated")
        next();
    } catch (e) {
        return res.status(401).send({
            success: false,
            message: "Unauthorized"
        })
    }
}