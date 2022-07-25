
export type ResourceType = "plugin" | "dependency";

export interface ResourceJson {
    id: string;
    version: string;
    type: ResourceType;
    hash?: {
        sha1: string;
    }
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
