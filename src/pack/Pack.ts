import Dependency from "../dependency/Dependency";
import Logger from "../plugin/logger/Logger";
import Plugin from "../plugin/Plugin";
import RemoteRepository from "../repository/RemoteRepository";
import RepositorySet from "../repository/RepositorySet";
import JSZip from "jszip";
import LogContainer from "../plugin/logger/LogContainer";
import BuildSystemInfo from "./BuildSystemInfo";
import Folder from "./Folder";
import FolderOrRoot from "./FolderOrRoot";
import PackFile from "./PackFile";
import PackType from "./PackType";
import DeferredLogContainer from "../plugin/logger/DeferredLogContainer";
import Model from "./model/Model";

/**
 * A resource pack.
 */
export default class Pack implements FolderOrRoot {
    name: string;
    private zip: JSZip;
    private readonly buildSystemInfo: BuildSystemInfo = { id: "loading", version: "loading" };
    private type: PackType;
    private repositorySet: RepositorySet = new RepositorySet();
    private readonly plugins: Plugin[] = [];
    private readonly dependencies: Dependency[] = [];
    private readonly logger: Logger;
    private readonly loggers: Logger[];

    // Initialization

    private constructor(name: string, zip: JSZip, type: PackType) {
        this.name = name;
        this.zip = zip;
        this.type = type;
        this.logger = new Logger(this.name);
        this.logger.logContainer = new DeferredLogContainer();
        this.loggers = [
            this.logger
        ];
        const existsInRoot = this.getFile("pack.mcmeta") != null || this.getFile("pack.rpbt.mcmeta");
        if (!existsInRoot) {
            // Check subdirectories to attempt to find a pack meta.
            let foundRoot = null;
            function checkFolder(folder: Folder) {
                if (folder.getFile("pack.mcmeta") != null || folder.getFile("pack.rpbt.mcmeta")) {
                    foundRoot = folder.getAbsolutePath();
                }
            }
            for (const file of this.getFiles()) {
                const folder = this.getFolder(file);
                if (folder != null) {
                    checkFolder(folder);
                    if (foundRoot != null) {
                        break;
                    }
                }
            }
            if (foundRoot) {
                this.zip = this.zip.folder(foundRoot)!;
                if (this.name == "") {
                    this.name = foundRoot;
                    if (this.name.endsWith("/")) this.name = this.name.substring(0, this.name.length - 1);
                    this.logger.setName(this.name);
                }
            } else {
                this.logger.warn("No pack root found for the uploaded pack");
            }
        }
    }

    /**
     * Load and initialize a pack from a zip file.
     * 
     * @param file The zip file.
     * @param type The type of the pack.
     * @returns The loaded pack.
     */
    static async loadZipFile(file: File, type: PackType): Promise<Pack> {
        const zip = await JSZip.loadAsync(file);
        return Pack.loadJSZip(file.name, zip, type);
    }

    static async loadJSZip(name: string, zip: JSZip, type: PackType): Promise<Pack> {
        const pack = new Pack(name, zip, type);
        if (type == PackType.SOURCE) {
            await pack.loadBuildSystemData();
            pack.createRepositorySet();
            pack.resolvePlugins();
            pack.resolveDependencies();
        }
        return pack;
    }

    private async loadBuildSystemData() {
        let metaFile = this.getFile("pack.mcmeta");
        if (metaFile == null) metaFile = this.getFile("pack.rpbt.mcmeta");
        if (metaFile != null) {
            let json;
            try {
                json = await metaFile.readAsJson();
            } catch (e) {
                console.error("Invalid pack mcmeta json." + e);
                return;
            }

            const data = json["resource-pack-build-tool"];
            if (typeof data == "object") {
                for (let key in data) {
                    const value = data[key];
                    switch (key) {
                        case "name":
                        case "id": {
                            this.buildSystemInfo.id = value;
                            this.name = value;
                            this.logger.setName(this.name);
                            break;
                        }
                        case "version": {
                            this.buildSystemInfo.version = value;
                            break;
                        }
                        case "custom_model_data_start": {
                            this.buildSystemInfo.custom_model_data_start = value;
                            break;
                        }
                        case "author":
                        case "authors":
                        case "website":
                        case "source":
                        case "description": {
                            // Accepted keys, but not actually used
                            break;
                        }
                        case "plugins": {
                            this.buildSystemInfo.plugins = [];
                            for (const pluginData of value) {
                                if (typeof pluginData.id == "string") {
                                    const versionType = typeof pluginData.version;
                                    if (!pluginData.id.startsWith(".") && versionType == "undefined") {
                                        this.logger.warn("Missing \"version\" property for plugin \""+ pluginData.id +"\".");
                                    } else {
                                        if (versionType != "string" && versionType != "undefined") {
                                            pluginData.version = pluginData.version + "";
                                        }
                                        this.buildSystemInfo.plugins.push(pluginData);
                                    }
                                } else {
                                    this.logger.warn("Missing \"id\" property for plugin.");
                                }
                            }
                            break;
                        }
                        case "dependencies": {
                            this.buildSystemInfo.dependencies = [];
                            for (const dependencyData of value) {
                                if (typeof dependencyData.id == "string" && typeof dependencyData.version == "string") {
                                    this.buildSystemInfo.dependencies.push(dependencyData);
                                } else {
                                    this.logger.warn("Missing \"id\" and \"version\" properties for dependency.");
                                }
                            }
                            break;
                        }
                        case "repositories": {
                            this.buildSystemInfo.repositories = [];
                            for (const repositoryData of value) {
                                if (typeof repositoryData.url == "string") {
                                    this.buildSystemInfo.repositories.push(repositoryData);
                                } else {
                                    this.logger.warn("Missing \"url\" property for repository.");
                                }
                            }
                            break;
                        }
                        default: {
                            this.logger.warn("Unknown resource-pack-build-tool property \""+ key +"\"");
                            break;
                        }
                    }
                }
            }
        }
    }

    private async createRepositorySet() {
        if (this.buildSystemInfo.repositories) {
            for (const repoInfo of this.buildSystemInfo.repositories) {
                const repository = new RemoteRepository(repoInfo.url);
                this.repositorySet.addRepository(repository, repoInfo.name);
            }
        }
    }

    private async resolvePlugins() {
        if (this.buildSystemInfo.plugins) {
            for (const pluginInfo of this.buildSystemInfo.plugins) {
                let plugin: Plugin | null = null;
                if (pluginInfo.id.startsWith("./")) {
                    // A script plugin
                    if (!pluginInfo.version) {
                        pluginInfo.version = this.buildSystemInfo.version;
                    }
                    try {
                        plugin = await Plugin.loadJSZip({
                            id: pluginInfo.id,
                            version: pluginInfo.version,
                            type: "plugin",
                            build: {
                                main: pluginInfo.id.substring(2)
                            }
                        }, this.zip);
                    } catch(e) {
                        this.logger.error("Failed to load script plugin: " + e);
                        continue;
                    }
                } else {
                    // Resolve the plugin
                    if (!pluginInfo.version) {
                        this.logger.error("Non-script plugins must have a version. No version found for plugin: " + pluginInfo.id);
                        continue;
                    }
                    plugin = await this.repositorySet.resolvePlugin(pluginInfo.id, pluginInfo.version, pluginInfo.from);
                    if (plugin == null) {
                        this.logger.error("Unable to find plugin " + pluginInfo.id + " version " + pluginInfo.version + (pluginInfo.from == null ? " in any repository." : " in the \"" + pluginInfo.from + "\" repository."));
                        continue;
                    }
                }
                // Overriden order value
                if (typeof pluginInfo.orderValue == "number" && plugin.buildTask) {
                    plugin.buildTask.orderValue = pluginInfo.orderValue;
                }

                // Configuration
                plugin.config = pluginInfo;

                // Add to plugins array
                this.plugins.push(plugin);

                // Add logger to loggers array
                this.addLogger(plugin.logger);

                this.logger.info("Added plugin " + plugin.id + ":" + plugin.version);
            }
        }
    }

    private async resolveDependencies() {
        if (this.buildSystemInfo.dependencies) {
            for (const dependencyInfo of this.buildSystemInfo.dependencies) {
                if (!dependencyInfo.version) {
                    this.logger.error("No version specified for dependency: " + dependencyInfo.id);
                    continue;
                }
                const dependency = await this.repositorySet.resolveDependency(dependencyInfo.id, dependencyInfo.version, dependencyInfo.from);
                if (dependency != null) {
                    this.dependencies.push(dependency);
                    this.logger.info("Added dependency " + dependencyInfo.id + ":" + dependencyInfo.version);
                } else {
                    this.logger.error("Unable to find dependency " + dependencyInfo.id + " version " + dependencyInfo.version + (dependencyInfo.from == null ? " in any repository." : " in the \"" + dependencyInfo.from + "\" repository."));
                }
            }
        }
    }

    /**
     * Add a logger to the list of loggers relating to this pack.
     * 
     * The log output of these loggers will be displayed on the pack component.
     * 
     * @param logger The logger to add.
     */
    addLogger(logger: Logger) {
        this.loggers.push(logger);
        if (this.logger.logContainer) {
            logger.logContainer = this.logger.logContainer;
        }
    }

    /**
     * Set the log container where all loggers will show their output.
     * 
     * @param logContainer The log container.
     */
    setLogContainer(logContainer: LogContainer) {
        for (const logger of this.loggers) {
            logger.logContainer = logContainer;
        }
    }

    // Getters

    private ensureSourceType(errorMsg: string) {
        if (this.type != PackType.SOURCE) {
            if (this.type == PackType.TARGET) {
                throw new Error("Can not get the "+ errorMsg +" of the target pack, please use the source pack instead.");
            } else if (this.type == PackType.DEPENDENCY) {
                throw new Error("Can not get the "+ errorMsg +" on a dependency pack.");
            } else {
                throw new Error("Can only get the "+ errorMsg +" on a pack with pack type SOURCE.");
            }
        }
    }

    getZip(): JSZip {
        return this.zip;
    }

    getBuildSystemInfo(): BuildSystemInfo {
        this.ensureSourceType("build system info");
        return this.buildSystemInfo;
    }

    getRepositorySet(): RepositorySet {
        this.ensureSourceType("repository set");
        return this.repositorySet;
    }

    getPlugins(): Plugin[] {
        this.ensureSourceType("plugins");
        return this.plugins;
    }

    getDependencies(): Dependency[] {
        this.ensureSourceType("dependencies");
        return this.dependencies;
    }

    getLoggers(): Logger[] {
        console.log("getLoggers");
        this.ensureSourceType("loggers");
        return this.loggers;
    }

    // FileSystem operations

    /**
     * @override
     * @inheritdoc
     * @param path The path of the file to get relative to this pack.
     */
    getFile(path: string): PackFile | null {
        // Try get the file with jszip, if it doesn't exist return null
        const file = this.zip.file(path);
        if (file == null) return null;

        return new PackFile(this, path);
    }

    /**
     * @override
     * @inheritdoc
     */
    writeFile(path: string, content: any) {
        if (content instanceof PackFile) throw new Error("Can not write a PackFile, please call please call `await file.readAsBlob()` and use that as the content");
        this.zip.file(path, content);
    }

    /**
     * @override
     * @inheritdoc
     */
    remove(path: string) {
        this.zip.remove(path);
    }
    // Aliases
    /**
     * @override
     * @inheritdoc
     */
    delete(path: string) {
        this.remove(path);
    }
    /**
     * @override
     * @inheritdoc
     */
    deleteFile(path: string) {
        this.remove(path);
    }
    /**
     * @override
     * @inheritdoc
     */
    removeFile(path: string) {
        this.remove(path);
    }

    /**
     * Get all files and folders in this pack. If the deep option is set to true all
     * files and folders will be returned, even in subdirectories. If deep is set to false
     * (which is the default), only the files and folders in the root folder will be returned.
     * 
     * @override
     * @param deep Whether to get all files or folder recursively.
     * @returns A list of paths to the files and folders matched.
     */
    getFiles(deep = false): string[] {
        const allFiles: string[] = [];
        this.zip.forEach((path, file) => allFiles.push(path));
        if (deep) return allFiles;

        const files = [];
        for (const path of allFiles) {
            // If the path has a slash (and that slash isn't to indicate
            // that it is a directory) then we know it's not in the root
            // folder and therefore push it to the list.
            if (!path.slice(0, -1).includes("/")) {
                files.push(path);
            }
        }
        return files;
    }

    /**
     * Get a folder inside this pack.
     * 
     * @override
     * @param path The path of the folder to get.
     */
    getFolder(path: string): Folder | null {
        if (!path.endsWith("/")) path += "/";

        if (this.getFiles(true).includes(path)) {
            return new Folder(this, path);
        }
        return null;
    }

    // Other methods

    /**
     * Get a {@link Model} instance from a file. A Model is a wrapper around the json
     * model that contains useful methods for transforming the model.
     * 
     * @param path The path to a file containg a model.
     * @returns The model instance.
     */
    async getModel(path: string): Promise<Model> {
        const file = this.getFile(path);
        if (file == null) {
            throw new Error("Unable to get model because the file \""+ path +"\" does not exist.");
        }

        const json = await file.readAsJson();
        return new Model(file, json);
    }

    /**
     * Copy the files of this pack to a new instance. The copy will be marked as a
     * target pack type.
     */
    async createTargetCopy(): Promise<Pack> {
        const zip = new JSZip();
        for (const filePath of this.getFiles(true)) {
            const file = this.getFile(filePath);
            if (file != null) {
                const data = await file.readAsBlob();
                zip.file(filePath, data);
            }
        }
        const pack: Pack = new Pack(this.name, zip, PackType.TARGET);
        // As the produced pack is a target pack most stuff don't need to be copied over.
        // But we copy the custom_model_data_start so that methods can use it's value even
        // in the target pack.
        pack.buildSystemInfo.custom_model_data_start = this.buildSystemInfo.custom_model_data_start;
        return pack;
    }

    private getResourcePath(resourceLocation: string, folder: string, extension: string): string {
        const parts = resourceLocation.split(":");
        let namespace;
        let path;
        if (parts.length == 1) {
            namespace = "minecraft";
            path = parts[0];
        } else if (parts.length == 2) {
            namespace = parts[0];
            path = parts[1];
        } else {
            throw new Error("Invalid resource location \""+ resourceLocation +"\"");
        }
        return "assets/" + namespace + "/" + folder + "/" + path + "." + extension;
    }

    /**
     * Get the path to a model resource in this resource pack.
     * <p>
     * Note that this does not include "item" or "block" folders, that must be present
     * in the resource location.
     *
     * @param resourceLocation The resource location for the model to get the path of.
     * @returns The path of the model.
     */
    getModelPath(resourceLocation: string): string {
        return this.getResourcePath(resourceLocation, "models", "json");
    }

    /**
     * Get the path to a texture resource in this resource pack.
     * <p>
     * Note that this does not include "item" or "block" folders, that must be present
     * in the resource location.
     *
     * @param resourceLocation The resource location for the texture to get the path of.
     * @returns The path of the texture.
     */
    getTexturePath(resourceLocation: string): string {
        return this.getResourcePath(resourceLocation, "textures", "png");
    }


    /**
     * Add a custom model data entry to the vanilla model, redirecting the model
     * to {@code model}.
     * <p>
     * The vanilla model should exist in this resource pack or this method will throw
     * an error.
     * <p>
     * See {@link #getModelPath}, "item", "block", etc folders must
     * be included in the model resource locators' path.
     *
     * @param vanillaModel The model to add custom model data to.
     * @param model The model to redirect to.
     * @param extraPredicates Extra item predicates to add to the override.
     * @returns The custom model data value that needs to be set on the item to redirect the model.
     * @throws {Error} If the {@code vanillaModel} doesn't exist in this pack.
     * @see #getModelPath
     */
    async addCustomModelData(vanillaModel: string, model: string, extraPredicates?: object): Promise<number> {
        const vanillaModelPath = this.getModelPath(vanillaModel);
        const vanillaModelFile = this.getFile(vanillaModelPath);
        if (vanillaModelFile == null) {
            throw new Error("The model " + vanillaModel + " was not found in the pack. The vanilla model must exist in the pack! (Expected it to be at \""+ vanillaModelPath +"\")");
        }
        const json = await vanillaModelFile.readAsJson() as any;
        if (!json.overrides) json.overrides = [];

        // Look for an existing custom model data for this model
        for (const existingOverride of json.overrides) {
            const predicate = existingOverride.predicate;
            if (!predicate.custom_model_data) continue;

            if (Object.keys(predicate).length == 1 && model == existingOverride.model) {
                // Cool, the model we were trying to add already existed and has no other predicates.
                return predicate.custom_model_data;
            }
        }

        let value: number = typeof this.buildSystemInfo.custom_model_data_start == "number" ? this.buildSystemInfo.custom_model_data_start : 1;

        findFreeValue:
        while (true) {
            for (const existingOverride of json.overrides) {
                const predicate = existingOverride.predicate;
                if (!predicate.custom_model_data) continue;
                const existingValue = predicate.custom_model_data;
                if (existingValue == value) {
                    // This custom model data value is occupied, increment it and look again
                    value++;
                    continue findFreeValue;
                }
            }
            // We finished the loop without hitting the continue statement, we have found
            // a custom model data value that isn't used.
            break;
        }

        let predicate = {
            custom_model_data: value
        };

        if (extraPredicates) {
            predicate = Object.assign(predicate, extraPredicates);
        }

        json.overrides.push({
            predicate,
            model
        });

        this.writeFile(vanillaModelPath, JSON.stringify(json));

        return value;
    }

    /**
     * Add an override to the vanilla model, redirecting the model to {@code model}
     * when the predicate is met.
     * 
     * @param vanillaModel The model to add the override to.
     * @param model The model to redirect to when the predicate is met.
     * @param predicate The predicate to add with the override.
     */
    async addOverride(vanillaModel: string, model: string, predicate: object) {
        const vanillaModelPath = this.getModelPath(vanillaModel);
        const vanillaModelFile = this.getFile(vanillaModelPath);
        if (vanillaModelFile == null) {
            throw new Error("The model " + vanillaModel + " was not found in the pack. The vanilla model must exist in the pack! (Expected it to be at \""+ vanillaModelPath +"\")");
        }
        const json = await vanillaModelFile.readAsJson() as any;
        if (!json.overrides) json.overrides = [];

        json.overrides.push({
            predicate,
            model
        });

        this.writeFile(vanillaModelPath, JSON.stringify(json));
    }
}
