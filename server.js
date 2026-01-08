const express = require('express');
const fs = require('fs');
const path = require('path');
const {MockoonServer} = require('@mockoon/commons-server');
const httpProxy = require('http-proxy');

const app = express();
const proxy = httpProxy.createProxyServer({});

const DATA_DIR = '/envs';
const GATEWAY_PORT = 3000;

const envs = {};

// ---------- Start all environments on boot ----------
async function startAllEnvs() {
    const files = fs
        .readdirSync(DATA_DIR)
        .filter(f => f.endsWith('.json'));

    for (const file of files) {
        const name = path.basename(file, '.json');
        const fullPath = path.join(DATA_DIR, file);

        const environment = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        const port = environment.port;
        const mock = new MockoonServer(environment)
        mock.start()
        envs[name] = {port, mock};
        console.log(`🟢 Started mock "${name}" on port ${port}`);
    }
}

// ---------- Gateway routing ----------
const RESERVED_PATHS = ['health', 'metrics', 'favicon.ico'];

app.use('/:name', (req, res, next) => {
    try {
        const {name} = req.params;

        if (RESERVED_PATHS.includes(name)) {
            return next();
        }

        const env = envs[name];
        if (!env) {
            return res.status(404).json({error: `Mock "${name}" not found`});
        }

        // Strip /{name} from path
        req.url = req.url.replace(new RegExp(`^/${name}`), '') || '/';
        proxy.web(req, res, {
            target: `http://127.0.0.1:${env.port}`,
        });
    }catch (err){
        console.error(err)
        res.status(500).json({
            error: err.message,
        });
    }
});

// ---------- Start server ----------
(async () => {
    await startAllEnvs();

    app.listen(GATEWAY_PORT, () => {
        console.log(`🚪 Gateway listening on :${GATEWAY_PORT}`);
    });
})();
