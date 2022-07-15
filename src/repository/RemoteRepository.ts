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

    async getResource(id: string, version: string): Promise<ResourceJson | null> {
        try {
            const response = await fetch(this.url + id + "/" + version + "/resource.json");
            const json = await response.json() as ResourceJson;
            // Should always be true
            if (json.id == id && json.version == version) {
                return json;
            }
            return null;
        } catch {
            return null;
        }
    }

    async resolvePlugin(id: string, version: string): Promise<Plugin | null> {
        throw new Error("Method not implemented.");
    }

    async resolveDependency(id: string, version: string): Promise<Dependency | null> {
        const resource = await this.getResource(id, version);
        if (resource != null && resource.type == "dependency") {
            const file = await fetch(this.url + id + "/" + version + "/" + getShortId(id) + "-" + version + ".zip");
            const blob = await file.blob();
            const blobFile = new File([blob], id + ":" + version);
            const pack = await Pack.loadZipFile(blobFile, PackType.DEPENDENCY);
            
            return new Dependency(id, version, pack);
        }
        return null;
    }
}
// @ts-ignore
window["RemoteRepository"] = RemoteRepository;