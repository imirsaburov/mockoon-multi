const uzcardData = require('./data/uzcard-data');
const TEMP_OTP = {};

const METHODS = {
    "cards.new.otp": cardsNewOtp
}

module.exports = {
    name: 'uzcardv2',

    routes(app) {
        app.post('/api/jsonrpc', (req, res) => {

            const {id, method, params} = req.body;

            try {
                const response = METHODS[method](params, req);
                response.id = id;
                res.json(response);
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


function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

