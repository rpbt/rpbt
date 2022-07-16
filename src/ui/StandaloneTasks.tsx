import React from "react";
import StandaloneTask from "../plugin/StandaloneTask";

interface StandaloneTasksProps {
    tasks: StandaloneTask[];
    onRun: (task: StandaloneTask) => void;
}

interface StandaloneTasksState {
    selected: StandaloneTask | null;
}

export default class StandaloneTasks extends React.Component<StandaloneTasksProps, StandaloneTasksState> {
    state: StandaloneTasksState = {
        selected: null
    };

    render() {
        return (
            <div>
                <label>Run standalone task</label>
                <select className="form-control" onChange={e => this.setState({ selected: this.props.tasks[parseInt(e.target.value)] })}>
                    <option value="-1">None selected</option>
                    {this.props.tasks.map((task, index) => {
                        return <option value={index} key={index}>{task.getName()}</option>
                    })}
                </select>
                {this.state.selected != null && (
                    <button className="btn btn-success" onClick={() => this.props.onRun(this.state.selected!)}>Run {this.state.selected.getName()}</button>
                )}
            </div>
        );
    }
}