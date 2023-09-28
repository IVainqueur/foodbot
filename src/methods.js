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
 * @returns {boolean} - Returns true if the admin was added successfully
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
 * Add a new user
 * @async
 * @function
 * @param {...User} user - The user object
 * @returns {boolean} - Returns true if the user was added successfully
 */
export const addUser = async (user) => {
    try {
        await prisma.user.create({
            data: {
                name: user.name,
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
export const login = async (user) => {
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
        token: jwt.sign({ id: admin.id, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '1d' })
    }
}

export const checkAdmin = async (req, res, next) => {
    await checkJWT(req, res, next, true);
}

export const checkJWT = async (req, res, next, checkAdmin = false) => {
    const token = req.cookies.jwt ?? res.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).send({
            success: false,
            message: "Unauthorized"
        })
    }
    try {
        const tokenData = jwt.verify(token, process.env.JWT_SECRET);
        if (!tokenData.isAdmin && checkAdmin) throw new Error("Not ADMIN")
        console.log("[log] Admin authenticated")
        next();
    } catch (e) {
        return res.status(401).send({
            success: false,
            message: e.message
        })
    }
}

export const requestAppToken = async (username) => {
    const user = await prisma.user.findUnique({
        where: {
            name: username
        }
    })
    if(!user) {
        await addUser({
            name: username
        })
    }
    
}

export const checkAppToken = async (username) => {
    const user = await prisma.user.findUnique({
        where: {
            name: username
        }
    })
    if(user.allowedAccess) return jwt.sign({ id: user.id, isAdmin: false }, process.env.JWT_SECRET)
    return false;
}