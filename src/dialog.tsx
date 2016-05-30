import * as React from "react";
import * as ReactDOM from "react-dom";

import "dialog.scss";
import Spinner = require("react-spinkit");

import WIT_Client = require("TFS/WorkItemTracking/RestClient");
import WIT_Contracts = require("TFS/WorkItemTracking/Contracts");

import Q = require("q");

import { IWorkItem, IDialogInputData, IResultWorkItem } from "interfaces";
import { WorkItemTypeService } from "services/workItemTypeService";

import { MainComponent } from "components/mainComponent";

import { Store } from "store";
import { ActionsCreator } from "actionsCreator";

let inputData: IDialogInputData = VSS.getConfiguration();

let typeServiceInitPromise = WorkItemTypeService.getInstance().init();
let parentWorkItemPromise = WIT_Client.getClient().getWorkItem(inputData.workItemId, ["System.Id", "System.WorkItemType", "System.Title"]);

Q.all<any>([typeServiceInitPromise, parentWorkItemPromise]).then<void>(values => {
    let workItem: WIT_Contracts.WorkItem = values[1];

    let parentWorkItem: IWorkItem = {
        id: workItem.fields["System.Id"],
        title: workItem.fields["System.Title"],
        level: WorkItemTypeService.getInstance().getLevelForType(workItem.fields["System.WorkItemType"]),
        relativeLevel: 0
    };

    let store = new Store(parentWorkItem);
    let actionsCreator = new ActionsCreator(store);

    ReactDOM.render(<MainComponent
        store={ store }
        actionsCreator={ actionsCreator } />, document.getElementById("content"));

    store.addListener(() => {
        let isValid = store.getIsValid();
        inputData.onUpdate(isValid);
    });

    inputData.setSaveHandler(() => {
        let spinner = React.createElement(Spinner as any, { spinnerName: "rotating-plane", noFadeIn: true });

        ReactDOM.render(<div className="saving-indicator">
            { spinner }
            <div>Saving</div>
        </div>, document.getElementById("content"));

        let resultTree = store.getResult();
        let creator = new WorkItemCreator();
        return creator.createWorkItems(store.getParentItem().id, resultTree);
    });
});

class WorkItemCreator {
    private _parentId: number;
    private _tempToRealParentIdMap: IDictionaryNumberTo<number> = {};

    public createWorkItems(parentId: number, result: IResultWorkItem[]): IPromise<void> {
        this._parentId = parentId;
        this._tempToRealParentIdMap[parentId] = parentId;

        return this._createWorkItemsWorker(result.slice(0));
    }

    private _createWorkItemsWorker(workItems: IResultWorkItem[]): IPromise<void> {
        if (!workItems || !workItems.length) {
            return Q<void>(null);
        }

        let workItemsToCreate: IResultWorkItem[] = [];
        let promises = [];

        for (let workItem of workItems) {
            if (workItem.id !== this._parentId) {
                if (workItem.parentId === this._parentId || this._tempToRealParentIdMap[workItem.parentId]) {
                    promises.push(this._getCreateWorkItemPromise(workItem));
                } else {
                    workItemsToCreate.push(workItem);
                }
            }
        }

        return Q.all(promises).then(() => {
            return this._createWorkItemsWorker(workItemsToCreate);
        });
    }

    private _getCreateWorkItemPromise(workItem: IResultWorkItem): IPromise<number> {
        let context = VSS.getWebContext();
        let client = WIT_Client.getClient();

        let workItemType = WorkItemTypeService.getInstance().getTypeForLevel(workItem.level).typeNames[0];
        let parentId = this._tempToRealParentIdMap[workItem.parentId];

        let patchDocument: any[] = [];

        patchDocument.push(this._getAddFieldOp("System.Title", workItem.title));
        patchDocument.push(this._getAddFieldOp("System.History", "Created using QuickCreate"));
        patchDocument.push({
            "op": "add",
            "path": "/relations/-",
            "value": {
                "rel": "System.LinkTypes.Hierarchy-Reverse",
                "url": `${context.collection.uri}/_apis/wit/workItems/${parentId}`
            }
        });

        return client.createWorkItem(patchDocument, context.project.id, workItemType).then((createdWorkItem: WIT_Contracts.WorkItem) => {
            this._tempToRealParentIdMap[workItem.id] = createdWorkItem.id;
        });
    }

    private _getAddFieldOp(fieldName: string, value: string): any {
        return {
            "op": "add",
            "path": `/fields/${fieldName}`,
            "value": value
        };
    }
}