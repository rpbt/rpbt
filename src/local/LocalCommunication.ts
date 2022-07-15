import Repository from "../repository/Repository";

/**
 * For accessing files and folders on the local machine trough the website.
 */
export default interface LocalCommunication extends Repository {
    /**
     * Save a pack as a dependency in the local repository.
     *
     * @param id The id of the pack.
     * @param version The version of the pack.
     * @param resourceJson The resource.json file of the resource.
     * @param resourceFile The pack as a zip file.
     */
    saveToLocalRepo(id: string, version: string, resourceJson: string, resourceFile: Blob): Promise<void>;
    /**
     * Install a pack into the game in a specified installation.
     * 
     * @param pack The pack to install.
     * @param installation The id/name of the installation to install to.
     */
    installPackInGame(installation: string, pack: Blob, fileName: string): Promise<void>;
    /**
     * Get a list of installations where a pack can be installed to.
     * 
     * @returns A list of installation ids/names.
     */
    getInstallations(): Promise<string[]>;
    /**
     * Add an installation.
     * 
     * @param installationId The id/name of the installation.
     * @param path The path on the local system where the installation is.
     */
    addInstallation(installationId: string, path: string): Promise<void>;
}