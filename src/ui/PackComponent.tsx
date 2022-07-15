import * as React from "react";
import Swal from "sweetalert2";
import { localCommunication } from "../index";
import BuildProcess from "../build/BuildProcess";
import Pack from "../pack/Pack";
import LogContainerComponent from "./LogContainerComponent";
import StandaloneTasks from "./StandaloneTasks";
import StandaloneTask from "../plugin/StandaloneTask";

interface PackComponentProps {
    pack: Pack;
}

interface PackComponentState {
    state: StateEnum;
    buildProgress: BuildProcess | null;
    installations: string[] | null;
}

enum StateEnum {
    ONE,
    BUILDING,
    BUILT
}

export default class PackComponent extends React.Component<PackComponentProps, PackComponentState> {
    state: PackComponentState = {
        state: StateEnum.ONE,
        buildProgress: null,
        installations: null
    };
    private inputRef: React.RefObject<HTMLSelectElement> = React.createRef();

    render() {
        return (
            <div className="pack m-2 p-2">
                <div className="pack-info">
                    <h3>{this.props.pack.name}</h3>
                </div>
                <div className="pack-actions">
                    {this.state.state == StateEnum.ONE && (
                        <button className="btn btn-success" onClick={this.build.bind(this)}>Build</button>
                    )}
                    {this.state.state == StateEnum.BUILDING && (
                        <>
                            <div className="spinner-border"></div>
                            <span>Building</span>
                        </>
                    )}
                    {this.state.state == StateEnum.BUILT && (
                        <>
                            <button className="btn btn-success m-1" onClick={this.download.bind(this)}>Download</button>
                            <button className="btn btn-success m-1" onClick={this.installToInstallation.bind(this)}>
                                <span>Install into </span>
                                {this.state.installations && (
                                    <select ref={this.inputRef} className="form-select installations-dropdown">
                                        {this.state.installations.map(installation => {
                                            return <option>{installation}</option>
                                        })}
                                    </select>
                                )}
                            </button>
                            <button className="btn btn-success m-1" onClick={this.saveToLocalRepo.bind(this)}>Save to local repo</button>
                            <br />
                            <StandaloneTasks tasks={this.state.buildProgress!.getStandaloneTasks()} onRun={this.runStandaloneTask.bind(this)} />
                        </>
                    )}
                    <h5>Log</h5>
                    <LogContainerComponent loggers={this.props.pack.getLoggers()}/>
                </div>
            </div>
        );
    }

    async build() {
        this.setState({
            ...this.state,
            state: StateEnum.BUILDING
        });

        const process = await BuildProcess.create(this.props.pack);
        await process.run();

        this.setState({
            ...this.state,
            state: StateEnum.BUILT,
            buildProgress: process
        });

        const installations = await localCommunication.getInstallations();
        this.setState({
            ...this.state,
            installations: installations
        });
    }

    async download() {
        this.state.buildProgress!.downloadOutputPack();
    }

    async installToInstallation(e: React.MouseEvent) {
        const tagName = (e.target as HTMLElement).tagName;
        if (tagName == "BUTTON" || tagName == "SPAN") {
            const installation = this.inputRef.current!.value;
            await this.state.buildProgress!.installPackInGame(installation);
            Swal.fire(
                "Installed",
                "You can now use it in game from the resource packs menu.",
                "success"
            );
        }
    }

    async saveToLocalRepo() {
        await this.state.buildProgress!.saveToLocalRepo();
        Swal.fire(
            "Saved",
            "Saved as a dependency in the local repository.",
            "success"
        );
    }

    async runStandaloneTask(task: StandaloneTask) {
        await task.run(this.state.buildProgress!.sourcePack, this.state.buildProgress!.targetPack);
    }
}