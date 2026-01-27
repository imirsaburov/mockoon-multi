const express = require('express');
const fs = require('fs');
const path = require('path');
const {MockoonServer} = require('@mockoon/commons-server');
const httpProxy = require('http-proxy');
const crypto = require('crypto');


const app = express();
const proxy = httpProxy.createProxyServer({});

const DATA_DIR = '/envs/mockoon';
const JS_DIR = '/envs/js';
const GATEWAY_PORT = 3000;
const BASE_MOCK_PORT = 4000;
let currentPort = BASE_MOCK_PORT;

const envs = {};

async function startAllEnvs() {
    const mocksDir = path.join(__dirname, DATA_DIR);
    const files = fs
        .readdirSync(mocksDir)
        .filter(f => f.endsWith('.json'));

    for (const file of files) {
        const fullPath = path.join(mocksDir, file);
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
            envs[name] = {
                port,
                mock,
                filePath: fullPath,
                name,
                type: 'mockoon'
            };
            console.log(`🟢 Started mock "${name}" on port ${port}`);
        } catch (err) {
            console.error(`❌ Failed to start mock "${name}":`, err);
        }
    }
}

function loadJsMocks(app) {
    const mocksDir = path.join(__dirname, JS_DIR);
    console.log('Loading JS mocks from', mocksDir);
    if (!fs.existsSync(mocksDir)) return;

    const files = fs.readdirSync(mocksDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
        const mock = require(path.join(mocksDir, file));

        if (!mock.name || typeof mock.routes !== 'function') {
            console.warn(`⚠️ Invalid JS mock: ${file}`);
            continue;
        }

        const router = express.Router();
        mock.routes(router);

        app.use(`/${mock.name}`, router);

        envs[mock.name] = {
            name: mock.name,
            type: 'js'
        };

        console.log(`🧩 JS mock "${mock.name}" mounted on /${mock.name}`);
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

        switch (env.type) {
            case 'mockoon':
                req.url = req.url.replace(new RegExp(`^/${name}`), '') || '/';
                proxy.web(req, res, {
                    target: `http://127.0.0.1:${env.port}`,
                });
                break;
            case 'js':
                return next();
            default:
                res.status(500).json({error: `Unknown mock type for "${name}"`});
        }

    } catch (err) {
        console.error(err)
        res.status(500).json({
            error: err.message,
        });
    }
});

app.use((req, res, next) => {
    log(req, res);
    next();
});

proxy.on('proxyRes', (proxyRes, req, res) => {
    log(req, res);
})

function log(req, res) {
    const startTime = process.hrtime.bigint();

    // ---- Trace ID ----
    const traceId =
        req.headers['x-trace-id'] ||
        crypto.randomUUID();

    req.traceId = traceId;
    res.setHeader('x-trace-id', traceId);

    // ---- Capture request ----
    const requestLog = {
        traceId,
        method: req.method,
        originalUrl: req.originalUrl,
        path: req.path,
        query: req.query,
        params: req.params,
        headers: req.headers,
        body: req.body,
        files: req.files
            ? req.files.map(f => ({
                fieldname: f.fieldname,
                originalname: f.originalname,
                mimetype: f.mimetype,
                size: f.size
            }))
            : undefined
    };

    // ---- Capture response ----
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    let responseBody;

    res.send = (body) => {
        responseBody = body;
        return originalSend(body);
    };

    res.json = (body) => {
        responseBody = body;
        return originalJson(body);
    };

    res.on('finish', () => {
        const durationMs =
            Number(process.hrtime.bigint() - startTime) / 1e6;

        const responseLog = {
            statusCode: res.statusCode,
            headers: res.getHeaders(),
            body: responseBody,
            durationMs: durationMs.toFixed(2)
        };

        console.log('══════════════════════════════════════');
        console.log('📌 TRACE ID:', traceId);
        console.log('➡️ REQUEST');
        console.log(JSON.stringify(requestLog, null, 2));
        console.log('⬅️ RESPONSE');
        console.log(JSON.stringify(responseLog, null, 2));
        console.log('══════════════════════════════════════');
    });
}

// ---------- Start server ----------
(async () => {
    await startAllEnvs();
    loadJsMocks(app)

    app.listen(GATEWAY_PORT, () => {
        console.log(`🚪 Gateway listening on :${GATEWAY_PORT}`);
    });
})();
