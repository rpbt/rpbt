import Dependency from "../dependency/Dependency";
import Pack from "../pack/Pack";
import PackType from "../pack/PackType";
import Plugin from "../plugin/Plugin";
import { getShortId } from "../util/utils";
import Repository from "./Repository";

export type ResourceType = "plugin" | "dependency";

export interface ResourceJson {
    id: string;
    version: string;
    type: ResourceType;
}

export interface DependencyResourceJson extends ResourceJson {
    "included-dependencies"?: IncludedDependency[]
}

export interface IncludedDependency {
    id: string;
    version: string;
}

export interface PluginResourceJson extends ResourceJson {
    /**
     * The data for when the pack is being built.
     */
    build?: BuildTaskJson;
    /**
     * The path to a file that exports functions, constants, etc. that other plugin
     * can use.
     */
    exports?: string;
    /**
     * The standalone tasks this plugin creates.
     */
    standalone_tasks?: StandaloneTaskJson[];
}

export interface BuildTaskJson {
    /**
     * The path to a file that should be executed when a pack is being built.
     */
    main: string;
    /**
     * The default order value to run this plugin at.
     */
    order_value?: number;
}

export interface StandaloneTaskJson {
    /**
     * The name of the standalone task that is displayed to the user.
     */
    name: string;
    /**
     * The path to the file to the file that should be executed when the task is ran.
     */
    main: string;
}

/**
 * A repository that fetches resources from a URL.
 */
export default class RemoteRepository implements Repository {
    private readonly url: string;

    constructor(url: string) {
        this.url = url + (url.endsWith("/") ? "" : "/");
    }

    private async getFiles(type: ResourceType, id: string, version: string): Promise<[ResourceJson, Blob] | null> {
        try {
            // Fetch the resource.json
            const resourceResponse = await fetch(`${this.url}${type}/${id}/${version}/resource.json`);
            const json = await resourceResponse.json() as ResourceJson;
            // Should always be true
            if (json.id == id && json.version == version && json.type == type) {
                // Fetch the zip
                const zipResponse = await fetch(`${this.url}${type}/${id}/${version}/${getShortId(id)}-${version}.zip`);
                const zip = await zipResponse.blob();
                return [json, zip];
            }
            return null;
        } catch {
            return null;
        }
    }

    async resolvePlugin(id: string, version: string): Promise<Plugin | null> {
        const res = await this.getFiles("plugin", id, version);
        if (res) {
            const [json, zip] = res;
            return Plugin.loadZipFile(json, zip);
        }
        return null;
    }

    async resolveDependency(id: string, version: string): Promise<Dependency | null> {
        const res = await this.getFiles("dependency", id, version);
        if (res) {
            const [_json, blob] = res;
            const file = new File([blob], id + ":" + version);
            const pack = await Pack.loadZipFile(file, PackType.DEPENDENCY);

            return new Dependency(id, version, pack);
        }
        return null;
    }
}