import { ResourceJson } from "../repository/RemoteRepository";

export default interface OutputInfo {
    /** The name of the file the user downloads. */
    fileName: string;
    /** The resource.json placed on a repository. */
    resourceJson: ResourceJson;
}