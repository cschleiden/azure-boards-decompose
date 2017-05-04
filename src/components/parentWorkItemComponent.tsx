import "./items.scss";

import * as React from "react";

import { IWorkItem } from "../interfaces";
import { WorkItemTypeService } from "../services/workItemTypeService";

export interface IParentWorkItemProps extends React.Props<void> {
    item: IWorkItem;
}

export class ParentWorkItemComponent extends React.Component<IParentWorkItemProps, void> {
    public render(): JSX.Element {
        let workItemType = WorkItemTypeService.getInstance().getBacklogForLevel(this.props.item.level).types[this.props.item.typeIndex]; 

        return <div className="parent-work-item work-item">
            <span className="type" style={{ borderColor: workItemType.color }}>{ workItemType.name }</span>
            <span className="title">
                 { this.props.item.title }
            </span>
        </div>;
    }
}