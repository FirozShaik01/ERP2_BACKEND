const Constants = require('../utils/Constants/response_messages')
const JWTHelper = require('../utils/Helpers/jwt_helper')
const sendgrid = require('@sendgrid/mail')
const UsersModel = require('../utils/Models/Users/UsersModel')
const _ = require('lodash');
const { Op } = require('sequelize');

class UserService {
    constructor() {
        this.jwtObject = new JWTHelper();
    }

    async createUser(userdetails) {
        try {
            const { email_id, password, confirmpassword, role_type, user_name } = userdetails;

            // Check if email already exists with statuses 'NV' or 'A'
            const existingUser = await UsersModel.findOne({
                where: {
                    email_id: email_id,
                    status: {
                        [Op.or]: ['NV', 'A']
                    }
                }
            });

            if (existingUser) {
                const errorMessages = {
                    NV: "Given EmailId Already Register, But Might Not Approved Yet !",
                    A: "USER ALREADY IN USE WITH GIVEN EMAIL ID"
                };
                throw new global.DATA.PLUGINS.httperrors.BadRequest(errorMessages[existingUser.status]);
            }

            if (password !== confirmpassword) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("PASSWORDS DOES NOT MATCH");
            }

            const salt = await global.DATA.PLUGINS.bcrypt.genSalt(10);
            const hashedPassword = await global.DATA.PLUGINS.bcrypt.hash(password, salt);

            let additionalFields = {};
            if (role_type.toUpperCase() === 'CHANNEL PARTNER') {
                const { address, contact_no, pancard_no, bank_ac_no, bussiness_experience } = userdetails;
                if (!address || !contact_no || !pancard_no || !bank_ac_no || !bussiness_experience) {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("All fields (address, contact_no, pancard_no, bank_ac_no, bussiness_experience) are required for CHANNEL PARTNER");
                }
                additionalFields = { address, contact_no, pancard_no, bank_ac_no, bussiness_experience };
            } else {
                additionalFields = {
                    address: null,
                    contact_no: null,
                    pancard_no: null,
                    bank_ac_no: null,
                    bussiness_experience: null
                };
            }

            const currentDate = new Date().toISOString().slice(0, 10); // Simplified date handling

            const userPayload = {
                user_name,
                email_id,
                password: hashedPassword,
                role_type: role_type.toUpperCase(),
                status: "NV",
                date_of_signUp: currentDate,
                ...additionalFields
            };

            const newUser = await UsersModel.create(userPayload);

            return newUser;
        } catch (err) {
            console.error("Error in createUser: ", err.message);
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }


    async loginUser(userDetails) {
        try {
            const userData = await UsersModel.findOne({
                "where": {
                    email_id: userDetails.email_id
                }
            })

            if (userData) {
                if (userData.status === "NV") {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("Given EmailId Not Approved Yet!")
                }
                else if (userData.status === "R") {
                    throw new global.DATA.PLUGINS.httperrors.BadRequest("logIn Access For Given EmailId DENIED By SUPER ADMIN")

                }
            }

            const userPassword = userData.password;

            const isValid = await global.DATA.PLUGINS.bcrypt.compare(userDetails.password, userPassword);
            if (!isValid) {
                throw new global.DATA.PLUGINS.httperrors.Unauthorized("InCorrect Password")
            }

            // Valid email and password
            const tokenPayload = userData.user_id.toString() + ":" + userData.role_type

            const accessToken = await this.jwtObject.generateAccessToken(tokenPayload);

            // const refreshToken = await this.jwtObject.generateRefreshToken(tokenPayload);

            const data = {
                accessToken,
                ...userData.toJSON() // Assuming userData is a Sequelize model instance
            };

            // Now remove any properties you don't want to expose manually or using lodash
            delete data.password; // For example, removing the password
            delete data._previousDataValues;
            delete data._changed;
            delete data._options;
            delete data.isNewRecord;

            return data
        }
        catch (err) {
            console.error("Error in loginUser: ", err.message);

            // Rethrow if it's a known error
            if (err instanceof global.DATA.PLUGINS.httperrors.HttpError) {
                throw err;
            }

            // Throw a generic error for unknown issues
            throw new global.DATA.PLUGINS.httperrors.InternalServerError("An internal server error occurred");
        }
    }

    sendLinkToEmail(name, emailId, Link) {
        return new Promise((resolve, reject) => {
            const messageBody = {
                to: emailId,
                from: process.env.EMAIL_SENDER,
                subject: "Password Reset Request",
                html: `
                <html>
                    <head>
                        <style>
                            .button {
                                background-color: #4CAF50; /* Green */
                                border: none;
                                color: white;
                                padding: 10px 20px;
                                text-align: center;
                                text-decoration: none;
                                display: inline-block;
                                font-size: 16px;
                            }
                        </style>
                    <head>
                    <body>
                        <h2> Hello ${name}. Welcome to VRC Application </h2>
                        <p>You recently requested to reset your password for your VRC account. Use the below button to reset it. <span>
                        <b>This password reset link is only valid for the next 15 minutes.</b>
                        </span></p>
                        <p>If you did not request a password reset, please ignore this email or contact support if you have questions.
                        </p>

                        <p>
                            <a href = ${Link}> <button class = "button" > RESET YOUR PASSWORD </button> </a>
                        </p>    
                        <p>
                            Thanks, <br>
                            FINDEMY Team
                        </p>
                    </body>
                </html>
                `
            }
            sendgrid.setApiKey(process.env.EMAIL_API_KEY);
            sendgrid.send(messageBody).then(message => {
                console.log("Email Sent to the Mail");
                resolve("EMAIL SENT")
            }).catch(err => {
                console.log("Eror occured during email sending", err.message);
                reject("EMAIL NOT SENT")
            })
        })
    }

    async sendPasswordResetRequest(emailid) {
        try {

            if (!emailid) {
                return "EMAIL CANNOT BE EMPTY"
            }

            // check user exists or not
            const user = await global.DATA.MODELS.users.findOne({
                "where": {
                    emailId: emailid
                }
            }).catch(err => {
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
            })

            if (!user) {
                throw new global.DATA.PLUGINS.httperrors.NotFound("User Not Registered")
            }

            // Valid email and password
            const tokenPayload = user.id.toString();

            const accessToken = await this.jwtObject.generateAccessToken(tokenPayload);

            const Link = `${process.env.RESET_BASE_URL}/${accessToken}`
            console.log(Link);

            const response = await this.sendLinkToEmail(user.name, emailid, Link);
            return response;
        }
        catch (err) {
            throw err;
        }
    }

    async changePassword(token, password) {
        try {
            let userId = null;
            await global.DATA.PLUGINS.jsonwebtoken.verify(token, process.env.ACCESS_TOKEN_SECRETKEY, (err, decoded) => {
                if (err) {
                    return "INVALID LINK/LINK EXPIRED"
                } else {
                    // Access the decoded data
                    console.log('Decoded JWT data:', decoded);
                    userId = decoded.aud;
                    console.log('User ID:', userId);
                }
            });
            const newPassword = password;
            const randomkey = await global.DATA.PLUGINS.bcrypt.genSalt(10);
            const hashedPassword = await global.DATA.PLUGINS.bcrypt.hash(newPassword, randomkey)

            await global.DATA.MODELS.users.update({
                password: hashedPassword
            }, {
                where: {
                    id: userId
                }
            }).catch(err => {
                console.log("Error while updating the password", err.message);
                throw err;
            })

            return "Password Updated Successfully"

        }
        catch (err) {
            throw err;
        }
    }
}
module.exports = UserService;