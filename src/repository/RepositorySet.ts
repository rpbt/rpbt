import { localCommunication } from "../index";
import Dependency from "../dependency/Dependency";
import Plugin from "../plugin/Plugin";
import Repository from "./Repository";

interface RepositoryInfo {
    repository: Repository;
    name?: string;
}

/**
 * A list of repositories used for resolving resources.
 */
export default class RepositorySet {
    readonly repositories: RepositoryInfo[];

    constructor() {
        this.repositories = [
            { repository: localCommunication, name: "local" }
        ];
    }

    /**
     * Add a repository to the list, optionally with a name.
     *
     * @param repository The repository to add.
     * @param name The name to assign to the repository.
     */
    addRepository(repository: Repository, name?: string) {
        this.repositories.push({
            repository,
            name
        });
    }

    /**
     * Resolve a plugin, optionally by providing the name of the repository where the
     * plugin can be found. Otherwise all repositories will be searched.
     *
     * @param id The id of the plugin.
     * @param version The version of the plugin.
     * @param repositoryName The repository to find the plugin in.
     */
    async resolvePlugin(id: string, version: string, repositoryName?: string): Promise<Plugin | null> {
        for (const repoInfo of this.repositories) {
            if (repositoryName != null && repoInfo.name != repositoryName) {
                continue;
            }
            const plugin = await repoInfo.repository.resolvePlugin(id, version);
            if (plugin != null) {
                return plugin;
            }
        }
        return null;
    }

    /**
     * Resolve a dependency, optionally by providing the name of the repository where
     * the dependency can be found. Otherwise all repositories will be searched.
     *
     * @param id The id of the dependency.
     * @param version The version of the dependency.
     * @param repositoryName The repository to find the dependency in.
     */
     async resolveDependency(id: string, version: string, repositoryName?: string): Promise<Dependency | null> {
        for (const repoInfo of this.repositories) {
            if (repositoryName != null && repoInfo.name != repositoryName) {
                continue;
            }
            const dependency = await repoInfo.repository.resolveDependency(id, version);
            if (dependency != null) {
                return dependency;
            }
        }
        return null;
    }
}