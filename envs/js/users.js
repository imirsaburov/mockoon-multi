module.exports = {
    name: 'users',

    routes(app) {
        app.get('/profile', (req, res) => {
            res.json({
                id: 1,
                name: 'John Doe'
            });
        });

        app.post('/login', (req, res) => {
            res.json({ token: 'mock-token' });
        });
    }
};
