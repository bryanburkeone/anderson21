const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeANiceEmail } = require('../mail');
const { hasPermission } = require('../utils');


const Mutations = {
    async createItem(parent, args, ctx, info) {
        // TODO: check if logged in
        if(!ctx.request.userId){
            throw new Error('you must be logged in to do that');
        }

        const item = await ctx.db.mutation.createItem({
            data: {
                user: {
                    connect: {
                        id: ctx.request.userId,
                    },
                },
                ...args
            }
        }, info);
        return item
    },
    async updateItem(parent, args, ctx, info) {
        const updates = { ...args}
        delete updates.id;
        return ctx.db.mutation.updateItem(
            {
                data: updates,
                where: {
                    id: args.id,
                }
            },
            info
        );
    },
    async deleteItem(parent, args, ctx, info) {
        const where = { id: args.id };
        // find the item
        const item = await ctx.db.query.item({ where }, `{id, title}`);
        // check if they own that item or have the permissions
        //todo
        // delete it
        return ctx.db.mutation.deleteItem({ where}, info);
    },
    async signup(parent, args, ctx, info) {
        // lowercase their email
        args.email = args.email.toLowerCase();
        //hash there password
        const password = await bcrypt.hash(args.password, 10);
        //create user in db
        const user = await ctx.db.mutation.createUser({
            data: {
                ...args,
                password,
                permissions: { set: ['USER']}
            }
        }, info
        );
        const token = jwt.sign({ userId: user.id}, process.env.APP_SECRET);
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        //finally return user to the browser
        return user
    },
    async signin(parent, { email, password }, ctx, info) {
        console.log(email)
        //check if there is a user with that email
        const user = await ctx.db.query.user({ where: { email : email }});
        //check if their password is correct
        if(!user) {
            throw new Error(`No such user found for email ${email}`)
        }
        //generate the jwt token
        const valid = await bcrypt.compare(password, user.password);
        if(!valid) {
            throw new Error(`Invalid Password`)
        }
        //set the cookie with the token
        const token = jwt.sign({ userId: user.id}, process.env.APP_SECRET);
        //return the user
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365
        });

        return user
    },
    async signout(parent, args, ctx, info) {
       ctx.response.clearCookie('token');
       return { message: 'goodbye!'}
    },
    async requestReset(parent, args, ctx, info) {
        //check if this is a real user
        const user = await ctx.db.query.user({ where: { email: args.email } });
        if (!user) {
            throw new Error(`No such user found for email ${args.email}`);
        }
        //set a reset token and expiry on that user
        //making new reset token
        const randomBytesPromiseified = promisify(randomBytes);
        const resetToken = (await randomBytesPromiseified(20)).toString('hex');
        // 1 hour from now
        const resetTokenExpiry = Date.now() + 36000000;
        // email them that reset token
        const res = await ctx.db.mutation.updateUser({
            where: { email: args.email },
            data: { resetToken, resetTokenExpiry }
        });
        //email them that reset token
        const mailRes = await transport.sendMail({
            from: 'bryan@bryan.com',
            to: user.email,
            subject: 'your password reset token',
            html: makeANiceEmail(
                `your password reset token is here |n|n 
                <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">click here to reset</a>`
            )
        });
        //return message
        return { message: "thanks!"}
    },
    async resetPassword(parent, args, ctx, info) {
        //check if the passwords match
        if(args.password !== args.confirmPassword){
            throw new Error(`passwords dont match`);
        }
        const [user] = await ctx.db.query.users({
            //check if its a legit reset token
            //check if its expired
            //find user by
            where: {
                resetToken: args.resetToken,
                resetTokenExpiry_gte: Date.now() - 3600000
            }
        });
        if(!user) {
            throw new Error(`this token is either invalid or expired`);
        }
        //hash their new password
        const password = await bcrypt.hash(args.password, 10)
        //save the new hashed password to the user and remve the old reset token fields
        const updatedUser = await ctx.db.mutation.updateUser({
            where: { email: user.email },
            data: {
                password,
                resetToken: null,
                resetTokenExpiry: null
            }
        });
        //generate a new jwt cookie
        //sign new cookie to user
        const token = jwt.sign({ userId: user.id}, process.env.APP_SECRET);
        ctx.response.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365,
        });
        //return new user
        return updatedUser;
    },
    async updatePermissions(parent, args, ctx, info) {
       //check if the user is logged in
        if(!ctx.request.userId) {
            throw new Error('you must be logged in')
        }
       //query the current user
        const currentUser = await ctx.db.query(
            {
                where: {
                    id : ctx.request.userId
                },
            },
            info
        );
       //check if they have permissions to do this
        hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
        // update the permissions
        return ctx.db.mutation.updateUser({
            data: {
                permissions: {
                    set: args.permissions
                }
            },
            where: {
                id: args.userId
            }
        })
    },
};

module.exports = Mutations;
