import "./addItems.scss";

import * as React from "react";
import * as ReactDOM from "react-dom";

import { IWorkItem } from "../interfaces";
import { WorkItemTypeService } from "services/workItemTypeService";

import * as Actions from "../actions";

export interface IAddItemsProps extends React.Props<void> {
    item: IWorkItem;
    //isFocused: boolean;
}

const INDENT_WIDTH = 16;

export class AddItemsComponent extends React.Component<IAddItemsProps, void> {
    private _inputElement: HTMLInputElement;
    
    public componentDidUpdate() {
        this._checkFocus();
    }
    
    public componentDidMount() {
        this._checkFocus();
    }
    
    public focus() {
        this._inputElement.focus();
    }
    
    public hasFocus(): boolean {
        return this._inputElement === document.activeElement;
    }
    
    public render(): JSX.Element {
        let workItemType =WorkItemTypeService.getInstance().getTypeForLevel(this.props.item.level);
        
        let inputClasses = "work-item-edit";
        if (this.props.item.title.trim() === "") {
            inputClasses += " invalid";
        }
        
        return <div className="work-item" style={{ paddingLeft: this.props.item.relativeLevel * INDENT_WIDTH }}>
            <span className="type" style={{ borderColor: workItemType.color }}>{ workItemType.typeNames[0] }</span>
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
         
         Actions.changeTitle.invoke({ 
             id: this.props.item.id,
             title: newTitle
         });
    }
    
    private _checkFocus() {
        //if (this.props.isFocused) {
        //    this._inputElement.focus();
        //}
    }
}