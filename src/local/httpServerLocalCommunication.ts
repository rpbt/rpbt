import Dependency from "../dependency/Dependency";
import Pack from "../pack/Pack";
import PackType from "../pack/PackType";
import Plugin from "../plugin/Plugin";
import LocalCommunication from "./LocalCommunication";

const apiBase = "http://localhost:8080/api/";

const httpServerLocalCommunication: LocalCommunication = {
    resolvePlugin: async function (id: string, version: string): Promise<Plugin | null> {
        const url = new URL(apiBase);
        url.pathname += "local-repo/resolve/plugin/resource-json";
        url.searchParams.set("id", id);
        url.searchParams.set("version", version);

        const request = await fetch(url.href).catch(_ => { });

        if (!request) {
            return null;
        }

        if (request.status == 200) {
            const resourceJson = await request.json();

            const url2 = new URL(apiBase);
            url2.pathname += "local-repo/resolve/plugin/zip";
            url2.searchParams.set("id", id);
            url2.searchParams.set("version", version);

            const request2 = await fetch(url2.href);
            const resourceFile = await request2.blob();

            return await Plugin.loadZipFile(resourceJson, resourceFile);
        } else if (request.status == 204) {
            // Not found in this repository
            return null;
        } else {
            console.error("Failed to resolve dependency from the local repo: " + request.statusText);
            return null;
        }
    },
    async resolveDependency(id: string, version: string): Promise<Dependency | null> {
        const url = new URL(apiBase);
        url.pathname += "local-repo/resolve/dependency";
        url.searchParams.set("id", id);
        url.searchParams.set("version", version);

        const request = await fetch(url.href).catch(_ => { });

        if (!request) {
            return null;
        }

        if (request.status == 200) {
            const blob = await request.blob();
            const blobFile = new File([blob], id + ":" + version);
            const pack = await Pack.loadZipFile(blobFile, PackType.DEPENDENCY);

            return new Dependency(id, version, pack);
        } else if (request.status == 204) {
            // Not found in this repository
            return null;
        } else {
            console.error("Failed to resolve dependency from the local repo: " + request.statusText);
            return null;
        }
    },
    async saveToLocalRepo(id: string, version: string, resourceJson: string, resourceFile: Blob) {
        const base64 = await (new Promise<string>(function (resolve, reject) {
            const reader = new FileReader();
            reader.onloadend = function () {
                const dataURL = (reader.result as string);
                resolve(dataURL.substring(dataURL.indexOf(",") + 1));
            };
            reader.onerror = reject;
            reader.readAsDataURL(resourceFile);
        }));

        const body = {
            id,
            version,
            resourceJson,
            resourceFile: base64
        };

        const url = new URL(apiBase);
        url.pathname += "local-repo/save";

        const request = await fetch(url.href, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!request.ok) {
            throw new Error("Failed to save to local repo: " + request.statusText);
        }

        console.log("Installed " + id + " version " + version + " into the local repository.");
    },
    async installPackInGame(installation: string, pack: Blob, fileName: string) {
        const url = new URL(apiBase);
        url.pathname += "installation/install-pack-to-game";
        url.searchParams.set("installation", installation);
        url.searchParams.set("fileName", fileName);

        const request = await fetch(url.href, {
            method: "POST",
            body: pack
        });

        if (!request.ok) {
            throw new Error("Failed to install pack: " + request.statusText);
        }
    },
    async getInstallations(): Promise<string[]> {
        const url = new URL(apiBase);
        url.pathname += "installation/list";

        const request = await fetch(url.href);

        if (request.ok) {
            const json = await request.json();
            return json as string[];
        } else {
            throw new Error("Failed to install pack: " + request.statusText);
        }
    },
    async addInstallation(installationId: string, path: string) {
        const url = new URL(apiBase);
        url.pathname += "installation/add";

        const body = {
            id: installationId,
            path
        };

        const request = await fetch(url.href, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!request.ok) {
            throw new Error("Failed to add installation: " + request.statusText);
        }
    }
};

export default httpServerLocalCommunication;