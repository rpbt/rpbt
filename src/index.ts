import httpServerLocalCommunication from "./local/httpServerLocalCommunication";
import LocalCommunication from "./local/LocalCommunication";
import * as upload from "./upload/upload";
import "./ui/index";

window.addEventListener("load", function() {
    upload.setup();
});

export const localCommunication: LocalCommunication = httpServerLocalCommunication;