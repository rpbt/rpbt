import Dependency from "../dependency/Dependency";
import Plugin from "../plugin/Plugin";

export default interface Repository {
    resolvePlugin(id: string, version: string): Promise<Plugin | null>;
    resolveDependency(id: string, version: string): Promise<Dependency | null>;
}