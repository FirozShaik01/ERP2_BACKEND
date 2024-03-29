const express = require('express')
const Constants = require('../utils/Constants/response_messages');
const ReceiptServices = require('../services/receipts_service');
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();
const router = express.Router()

router.post('/createReceipt', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SALES PERSON" || req.aud.split(":")[1] === "CHANNEL PARTNER") {
            const commission_holder_id = req.aud.split(":")[0]
            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.createReceipt(req.body, commission_holder_id)

            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SALES PERSON and CHANNEL PARTNER has access to createReceipt",
            })
        }
    }
    catch (err) {
        next(err);
    }
})

router.get('/getPendingReceiptsList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {

            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.getPendingReceiptsList()

            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to getPendingReceiptsList",
            })
        }

    } catch (err) {
        next(err);
    }
})

router.get('/getParticularReceiptData', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const { receipt_id } = req.query
            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.getParticularReceiptData(receipt_id)

            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to getParticularReceiptData",
            })
        }

    } catch (err) {
        next(err);
    }
})

router.put('/validateReceipt/:approveOrReject', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {

        const role = req.aud.split(":")[1];
        if (role === "SUPER ADMIN") { // Assuming Constants.ROLES.SUPER_ADMIN is defined elsewhere
            const { approveOrReject } = req.params;
            if (!['APPROVE', 'REJECT'].includes(approveOrReject.toUpperCase())) {
                throw new global.DATA.PLUGINS.httperrors.BadRequest("approveOrReject must be 'APPROVE'or 'REJECT'");
            }

            const receiptsServiceObj = new ReceiptServices();
            const data = await receiptsServiceObj.validateReceipt(req.body, approveOrReject.toUpperCase());
            res.status(201).send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            });
        } else {
            res.status(401).send({
                "message": "Only SUPER ADMIN has access to validateReceipt",
            });
        }
    } catch (err) {
        next(err);
    }
});

router.get('/getRejectedReceiptsList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.getRejectedReceiptsList()

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to getRejectedReceiptsList",
            })
        }


    } catch (err) {
        next(err);
    }
})

router.get('/getPartPaymentHistoryList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.getPartPaymentHistoryList()

            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to create a getPartPaymentHistory",
            })
        }


    } catch (err) {
        next(err);
    }
})

router.get('/getParticularPartPaymentHistory', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.getParticularPartPaymentHistory(req.body)

            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to create a getParticularPartPaymentHistory",
            })
        }

    } catch (err) {
        next(err);
    }
})

router.put('/editParticularPartPaymentAmount', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.editParticularPartPaymentAmount(req.body)

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN has access to editParticularPartPaymentAmount",
            })
        }

    } catch (err) {
        console.error("Error in /editParticularPartPaymentAmount route:", err.message);
        next(err);
    }
})

router.put('/deleteParticularPartPaymentAmount', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.deleteParticularPartPaymentAmount(req.body)

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN has access to editParticularPartPaymentAmount",
            })
        }

    } catch (err) {
        console.error("Error in /editParticularPartPaymentAmount route:", err.message);
        next(err);
    }
})

router.put('/deleteParticularProjectPartPayments', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.deleteParticularProjectPartPayments(req.body)

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN has access to editParticularPartPaymentAmount",
            })
        }

    } catch (err) {
        console.error("Error in /editParticularPartPaymentAmount route:", err.message);
        next(err);
    }
})

router.get('/getPartPaymentDeletedHistoryList', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.getPartPaymentDeletedHistoryList()

            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to create a getPartPaymentHistory",
            })
        }


    } catch (err) {
        next(err);
    }
})

router.get('/getParticularPartPaymentDeletedHistory', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN" || req.aud.split(":")[1] === "MANAGER") {
            const reciptsServiceObj = new ReceiptServices();
            const data = await reciptsServiceObj.getParticularPartPaymentDeletedHistory(req.body)

            res.send({
                "status": 201,
                "message": Constants.SUCCESS,
                "data": data
            })
        } else {
            res.send({
                "status": 401,
                "message": "only SUPER ADMIN and MANAGER has access to create a getParticularPartPaymentHistory",
            })
        }

    } catch (err) {
        next(err);
    }
})

router.get('/getAvailableReceiptProjectNames', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const reciptsServiceObj = new ReceiptServices();
        const data = await reciptsServiceObj.getAvailableReceiptProjectNames()
            .catch(err => {
                console.log("errors:", err.message);
                throw err;
            })

        res.send({
            "status": 201,
            "message": Constants.SUCCESS,
            "data": data
        })

    } catch (err) {
        next(err);
    }
})

module.exports = router;