const express = require('express');
const fs = require('fs');
const path = require('path');
const {MockoonServer} = require('@mockoon/commons-server');
const httpProxy = require('http-proxy');

const app = express();
const proxy = httpProxy.createProxyServer({});

const DATA_DIR = '/envs';
const GATEWAY_PORT = 3000;
const BASE_MOCK_PORT = 4000;
let currentPort = BASE_MOCK_PORT;

const envs = {};

async function startAllEnvs() {
    const files = fs
        .readdirSync(DATA_DIR)
        .filter(f => f.endsWith('.json'));

    for (const file of files) {
        const fullPath = path.join(DATA_DIR, file);
        const environment = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        const name = environment.name;
        const port = currentPort++;
        environment.port = port;

        const mock = new MockoonServer(environment);

        mock.on('error', (err) => {
            console.error(`⚠️ Error in mock "${name}":`, err);
        });

        try {
            await mock.start();
            envs[name] = { port, mock, filePath: fullPath, name };
            console.log(`🟢 Started mock "${name}" on port ${port}`);
        } catch (err) {
            console.error(`❌ Failed to start mock "${name}":`, err);
        }
    }
}


app.use('/admin/list', (req, res) => {
    try {
        const data = Object.keys(envs)
            .map(name => {
                const env = envs[name];
                return {
                    name: name,
                    filePath: env.filePath,
                    port: env.port
                }
            })
        res.status(200).json(data);
    } catch (err) {
        console.error(err)
        res.status(500).json({
            error: err.message,
        });
    }
});

app.use('/:name', (req, res, next) => {
    try {
        const {name} = req.params;

        const env = envs[name];
        if (!env) {
            return res.status(404).json({error: `Mock "${name}" not found`});
        }

        // Strip /{name} from path
        req.url = req.url.replace(new RegExp(`^/${name}`), '') || '/';
        proxy.web(req, res, {
            target: `http://127.0.0.1:${env.port}`,
        });
    } catch (err) {
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
