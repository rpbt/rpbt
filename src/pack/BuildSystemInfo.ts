export default interface BuildSystemInfo {
    /**
     * The id of the pack.
     */
    id: string;
    /**
     * The version of the pack.
     */
    version: string;
    /**
     * Plugins this pack should use to transform the contents and produce a target pack.
     */
    plugins?: PluginInfo[];
    /**
     * Dependency packs to this pack. Is best used conjunction with the include plugin.
     * */
    dependencies?: ResourceInfo[];
    /**
     * Repositories this pack needs to resolve plugins and dependencies.
     * */
    repositories?: RepositoryInfo[];
    /**
     * The first number to use as the custom_model_data value. The following values
     * will increment from this value.
     */
    custom_model_data_start?: number;
}

/**
 * Information about a resource that can be resolved from a repository set.
 */
export interface ResourceInfo {
    id: string;
    version?: string;
    from?: string;
}

export interface PluginInfo extends ResourceInfo {
    orderValue?: number;
}

export interface RepositoryInfo {
    url: string;
    name?: string;
}