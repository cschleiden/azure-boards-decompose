import "./addItems.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { IWorkItem } from "../interfaces";
import { WorkItemTypeService } from "services/workItemTypeService";

export interface IParentWorkItemProps extends React.Props<void> {
    item: IWorkItem;
}

export class ParentWorkItemComponent extends React.Component<IParentWorkItemProps, void> {
    public render(): JSX.Element {
        let workItemType =WorkItemTypeService.getInstance().getTypeForLevel(this.props.item.level); 
        
        return <div className="parent-work-item work-item">
            <span className="type" style={{ borderColor: workItemType.color }}>{ workItemType.typeNames[0] }</span>
            <span className="title">
                 { this.props.item.title }
            </span>
        </div>;
    }
}