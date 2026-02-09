const uzcardData = require('./data/uzcard-data');

const TEMP_OTP = {};

const METHODS = {
    "cards.new.otp": cardsNewOtp,
    "cards.new.verify": cardsNewVerify,
    "cards.check.pinfl": checkPinfl,
    "cards.get": cardsGet,
    "balance.get": balanceGet,
}

function cardsNewOtp(params, req) {
    const res = {};

    const {pan, expiry} = params.card;

    const card = uzcardData
        .CARDS
        .filter(card => card.pan === pan && card.expDate === expiry)[0];

    if (!card)
        res.error = {
            "code": -200,
            "message": "Card not found!"
        }

    if (card) {
        const id = randomInt(1000000000, 9999999999);
        TEMP_OTP[id] = pan;

        res.result = {
            id: id,
            phoneMask: card.phone || "*****0000",
            token: card.token || null,
            verified: card.verified || false
        }
    }

    return res;
}

function cardsNewVerify(params, req) {
    const res = {};

    const {id, code} = params.otp;
    const pan = TEMP_OTP[id];

    if (!pan) {
        res.error = {
            code: -404,
            message: "id not found"
        }
        return res;
    }

    const card = uzcardData
        .CARDS
        .filter(card => card.pan === pan)[0];

    if (!card) {
        res.error = {
            "code": -200,
            "message": "Card not found!"
        }
        return res;
    }


    if (code === '111111') {
        res.error = {
            code: -270,
            message: "OTP has expired!"
        }
        return res;
    }

    if (code === '000000') {
        res.result = {
            id: card.token,
            username: "mockuser",
            pan: card.pan,
            status: card.status,
            phone: card.phone,
            fullName: card.fullName,
            balance: card.balance,
            sms: card.sms,
            pincnt: card.pincnt,
            aacct: card.aacct,
            par: card.par,
            cardtype: card.cardtype,
            holdAmount: card.holdAmount,
            cashbackAmount: card.cashbackAmount,
        }
        return res;
    }

    res.error = {
        code: -269,
        message: "OTP is not correct!"
    }

    return res;
}

function cardsGet(params, req) {
    const res = {};
    const result = [];
    res.result = result;

    const {ids} = params;

    ids.filter(id => uzcardData.CARDS.filter(card => card.token === id).length > 0)
        .forEach(id => {
            const card = uzcardData.CARDS.filter(card => card.token === id)[0];
            result.push({
                id: card.token,
                username: "mockuser",
                pan: card.pan,
                status: card.status,
                phone: card.phone,
                fullName: card.fullName,
                balance: card.balance,
                sms: card.sms,
                pincnt: card.pincnt,
                aacct: card.aacct,
                par: card.par,
                cardtype: card.cardtype,
                holdAmount: card.holdAmount,
                cashbackAmount: card.cashbackAmount,
            });
        });

    return res;
}

function balanceGet(params, req) {
    const res = {};
    const result = {};
    const balanceInfo = []
    result.balanceInfo = balanceInfo;
    let totalBalance = 0;
    res.result = result;

    const {ids} = params;

    ids.filter(id => uzcardData.CARDS.filter(card => card.token === id).length > 0)
        .forEach(id => {
            const card = uzcardData.CARDS.filter(card => card.token === id)[0];
            totalBalance += card.balance || 0;
            balanceInfo.push({
                id: card.token,
                pan: card.pan,
                balance: card.balance,
            });
        });

    result.totalBalance = totalBalance;

    return res;
}

function checkPinfl(params, req) {
    const res = {};

    const {cardId, pinfl} = params.cardinfo;

    const card = uzcardData
        .CARDS
        .filter(card => card.token === cardId)[0];

    if (!card) {
        res.error = {
            "code": -200,
            "message": "Card not found!"
        }
        return res;
    }


    if (card.pinfl === pinfl) {
        res.result = {
            code: 0,
            message: "Card belong to this PINFL!"
        }
    } else {
        res.error = {
            code: -392,
            message: "Card does not belong to this PINFL!"
        }
    }

    return res;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    name: 'uzcard',

    routes(app) {
        app.post('/api/jsonrpc', (req, res) => {

            const {id, jsonrpc, method, params} = req.body;

            try {
                const mockMethod = METHODS[method];
                if (!method)
                    throw new Error('Method not found');
                const response = mockMethod(params, req);
                res.json({
                    jsonrpc, id, ...response
                });
            } catch (err) {
                res.json({
                    id,
                    error: {
                        code: -199,
                        message: err.message
                    }
                })
            }
        });
    }
};
