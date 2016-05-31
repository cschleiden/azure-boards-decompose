import "./addItems.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { IWorkItem } from "../interfaces";
import { WorkItemTypeService } from "services/workItemTypeService";
import { ActionsCreator } from "../actionsCreator";

export interface IAddItemsProps extends React.Props<void> {
    actionsCreator: ActionsCreator;
    
    item: IWorkItem;
}

const INDENT_WIDTH = 16;

export class AddItemsComponent extends React.Component<IAddItemsProps, void> {
    private _inputElement: HTMLInputElement;    
    
    public focus() {
        this._inputElement.focus();
    }
    
    public hasFocus(): boolean {
        return this._inputElement === document.activeElement;
    }
    
    public render(): JSX.Element {
        let workItemType = WorkItemTypeService.getInstance().getTypeForLevel(this.props.item.level);
        
        let inputClasses = "work-item-edit";
        if (this.props.item.title.trim() === "") {
            inputClasses += " invalid";
        }
        
        return <div className="work-item" style={{ paddingLeft: this.props.item.relativeLevel * INDENT_WIDTH }}>
            <span className="type" style={{ borderColor: workItemType.color }}>{ workItemType.typeNames[0] }</span>
            <span className="edit">
                <i className="icon bowtie-icon bowtie-chevron-left" title="Demote [Shift+Tab]" onClick={ this._outdent.bind(this) }></i>
                <i className="icon bowtie-icon bowtie-chevron-right" title="Promote [Tab]" onClick={ this._indent.bind(this) }></i>
                <i className="icon bowtie-icon bowtie-edit-delete" title="Delete [Shift+Delete]" onClick={ this._delete.bind(this) }></i>
            </span>
            <span className="title">
                <input 
                    type="text" 
                    onKeyDown={ this._onKeyDown.bind(this) }
                    onChange={ this._onChange.bind(this) } 
                    className={ inputClasses } 
                    value={ this.props.item.title } 
                    ref={(e) => this._inputElement = e} />
            </span>
        </div>;
    }
    
    private _onKeyDown(evt: KeyboardEvent) {
        if (evt.key === "Tab"
            || evt.key === "ArrowUp"
            || evt.key === "ArrowDown") {
            evt.preventDefault();
        }
    }
    
    private _onChange(event: React.FormEvent) {
         let newTitle = (event.target as any).value;
         
         this.props.actionsCreator.changeTitle(this.props.item.id, newTitle);
    }
    
    private _outdent() {
        this.props.actionsCreator.changeItemIndentLevel(this.props.item.id, -1);
    }
    
    private _indent() {        
        this.props.actionsCreator.changeItemIndentLevel(this.props.item.id, 1);
    }
        
    private _delete() {
        this.props.actionsCreator.deleteItem(this.props.item.id);
    }
}