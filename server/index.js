const http = require("http");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { URL } = require("url");

/** The port to run the server on. */
const PORT = process.env.PORT || 8080;
/** Simple mime types to send for file extentions */
const MIME_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".jpg": "image/jpeg"
};

let root;

const server = http.createServer(async function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "https://rpbt.github.io");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method == "OPTIONS") {
        res.statusCode = 200;
        res.end();
        return;
    }

    const url = new URL(req.url, "http://localhost");
    if (url.pathname == "/") url.pathname = "index.html";
    if (url.href.includes("..")) {
        res.statusCode = 400;
        res.end();
        return;
    }

    if (url.pathname.startsWith("/api/")) {
        // API

        res.setHeader("Access-Control-Allow-Origin", "*");

        let endpoint = url.pathname.substring("/api/".length);
        if (endpoint.endsWith("/")) {
            endpoint = endpoint.substring(0, endpoint.length - 1);
        }

        if (endpoint == "local-repo/save" && req.method == "POST") {
            let data = "";
            req.on("data", function(chunk) {
                data += chunk;
            })
            req.on("end", async function() {
                const json = JSON.parse(data);
                const { id, version, resourceJson, resourceFile } = json;

                const folder = path.join(getLocalRepoPath(), "dependency", id, version);
                const resourceJsonPath = path.join(folder, "resource.json");
                const resourceFilePath = path.join(folder, getShortId(id) + "-" + version + ".zip");

                await fs.promises.mkdir(folder, { recursive: true });

                await fs.promises.writeFile(resourceJsonPath, resourceJson);
                await fs.promises.writeFile(resourceFilePath, resourceFile, "base64");

                res.statusCode = 204;
                res.end();
            });
        } else if (endpoint == "local-repo/resolve/dependency") {
            const id = url.searchParams.get("id");
            const version = url.searchParams.get("version");

            const folder = path.join(getLocalRepoPath(), "dependency", id, version);
            const resourceJsonPath = path.join(folder, "resource.json");

            fs.readFile(resourceJsonPath, "utf-8", async function(err, data) {
                if (err) {
                    // Resource not found
                    res.statusCode = 204;
                    res.end();
                } else {
                    const resourceJson = JSON.parse(data);
                    if (resourceJson.id == id && resourceJson.version == version && resourceJson.type == "dependency") {
                        const resourceFilePath = path.join(folder, getShortId(id) + "-" + version + ".zip");
                        const resourceFile = await fs.promises.readFile(resourceFilePath);
    
                        res.end(resourceFile);
                    } else {
                        // Resource not found
                        res.statusCode = 204;
                        res.end();
                    }
                }
            });
        } else if (endpoint == "local-repo/resolve/plugin/resource-json") {
            const id = url.searchParams.get("id");
            const version = url.searchParams.get("version");

            const folder = path.join(getLocalRepoPath(), "plugin", id, version);
            const resourceJsonPath = path.join(folder, "resource.json");

            fs.readFile(resourceJsonPath, "utf-8", async function(err, data) {
                if (err) {
                    // Resource not found
                    res.statusCode = 204;
                    res.end();
                } else {
                    const resourceJson = JSON.parse(data);
                    if (resourceJson.id == id && resourceJson.version == version && resourceJson.type == "plugin") {
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify(resourceJson));
                    } else {
                        // Resource not found
                        res.statusCode = 204;
                        res.end();
                    }
                }
            });
        } else if (endpoint == "local-repo/resolve/plugin/zip") {
            const id = url.searchParams.get("id");
            const version = url.searchParams.get("version");

            const folder = path.join(getLocalRepoPath(), "plugin", id, version);
            const resourceJsonPath = path.join(folder, "resource.json");

            fs.readFile(resourceJsonPath, "utf-8", async function(err, data) {
                if (err) {
                    // Resource not found
                    res.statusCode = 204;
                    res.end();
                } else {
                    const resourceJson = JSON.parse(data);
                    if (resourceJson.id == id && resourceJson.version == version && resourceJson.type == "plugin") {
                        const resourceFilePath = path.join(folder, getShortId(id) + "-" + version + ".zip");
                        const resourceFile = await fs.promises.readFile(resourceFilePath);
    
                        res.end(resourceFile);
                    } else {
                        // Resource not found
                        res.statusCode = 204;
                        res.end();
                    }
                }
            });
        } else if (endpoint == "installation/list") {
            const installations = await getInstallationsFile();
            const body = Object.keys(installations.content);

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(body));
        } else if (endpoint == "installation/add" && req.method == "POST") {
            let data = "";
            req.on("data", function(chunk) {
                data += chunk;
            })
            req.on("end", async function() {
                const json = JSON.parse(data);

                const installations = await getInstallationsFile();
                installations.content[json.id] = json.path;
                await fs.promises.writeFile(installations.path, JSON.stringify(installations.content, null, 4));

                res.statusCode = 201;
                res.end();
            });
        } else if (endpoint == "installation/install-pack-to-game" && req.method == "POST") {
            const buffers = [];
            req.on("data", function(chunk) {
                buffers.push(chunk);
            })
            req.on("end", async function() {
                const data = Buffer.concat(buffers);
                const installationId = url.searchParams.get("installation");
                const fileName = url.searchParams.get("fileName");

                const installations = await getInstallationsFile();
                const installatonPath = installations.content[installationId];

                if (installatonPath) {
                    const filePath = path.join(installatonPath, "resourcepacks", fileName);
                    await fs.promises.writeFile(filePath, data);
                    res.statusCode = 204;
                    res.end();
                } else {
                    res.statusCode = 400;
                    res.end();
                }
            });
        }
        else {
            res.statusCode = 404;
            res.end();
        }
    } else {
        // Regular file
        let filePath = url.pathname.substring(1);
        if (root) {
            filePath = path.join(root, filePath);
        }
        fs.readFile(filePath, function(err, data) {
            if (err) {
                if (err.code == "ENOENT") {
                    // Not found
                    res.statusCode = 404;
                    res.end();
                } else {
                    // Internal server error
                    console.log(err);
                    res.statusCode = 500;
                    res.end();
                }
            } else {
                const extname = path.extname(filePath);
                const mimeType = MIME_TYPES[extname];
                if (mimeType) {
                    res.setHeader("Content-Type", mimeType);
                }
                res.end(data);
            }
        });
    }
});

fs.readFile("index.html", function(err) {
    if (err) {
        fs.readFile("build/website-dev/index.html", function(err2, data) {
            if (!err2) {
                // There was no index.html, but there was in build/website-dev,
                // let's make that the root.
                root = "build/website-dev";
            }
        });
    }
});

server.listen(PORT, function() {
    console.log(`Server is running on: http://localhost:${PORT}`);
});

function getShortId(/** @type {string} */ id) {
    const index = id.lastIndexOf("/") + 1;
    return id.substring(index);
}

/**
 * Get the path on the system to the .rpbt folder. Will always end with a slash.
 * 
 * @returns {string} The path.
 */
function getRpbtFolder() {
    const rpbtPath = path.join(os.homedir(), ".rpbt");
    return rpbtPath;
}

/**
 * Get the path on the system to the local repository. Will always end with a
 * slash.
 * 
 * @returns {string} The path.
 */
function getLocalRepoPath() {
    return path.join(getRpbtFolder(), "repository");
}

/**
 * Get information about the installations file. Will parse the file and return
 * the json content. Will create a default file if it does not exist.
 * 
 * @returns 
 */
async function getInstallationsFile() {
    const filePath = path.join(getRpbtFolder(), "installations.json");
    
    let data;
    let json;
    try {
        data = await fs.promises.readFile(filePath, "utf-8");
    } catch(err) {
        if (err.code == "ENOENT") {
            // File didn't exist, let's create a default.

            let installationPath;
            switch (process.platform) {
                case "win32": {
                    installationPath = path.join(os.homedir(), "AppData", "Roaming", ".minecraft");
                    break;
                }
                case "darwin": {
                    installationPath = path.join(os.homedir(), "Library", "Application Support", "minecraft");
                    break;
                }
                case "linux": {
                    installationPath = path.join(os.homedir(), ".minecraft");
                    break;
                }
            }

            if (installationPath) {
                const resourcePacksPath = path.join(installationPath, "resourcepacks");
                try {
                    const stat = await fs.promises.stat(resourcePacksPath);
                    if (stat.isDirectory()) {
                        json = {
                            //   name          path
                            ".minecraft": installationPath
                        };
                        await fs.promises.mkdir(getRpbtFolder(), { recursive: true });
                        await fs.promises.writeFile(filePath, JSON.stringify(json, null, 4));
                    }
                } catch(e) {}
            }
        }
    }
    if (!json) {
        if (data) {
            json = JSON.parse(data);
        } else {
            json = {};
        }
    }

    return {
        path: filePath,
        content: json
    };
}