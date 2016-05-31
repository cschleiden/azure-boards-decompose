import WIT_Client = require("TFS/WorkItemTracking/RestClient");
import WIT_Contracts = require("TFS/WorkItemTracking/Contracts");

import Q = require("q");

import { IWorkItem, IDialogInputData, IResultWorkItem } from "interfaces";

import { WorkItemTypeService } from "services/workItemTypeService";

export class WorkItemCreator {
    private _tempToRealParentIdMap: IDictionaryNumberTo<number> = {};

    constructor(private _parentId: number, private _iterationPath: string, private _areaPath: string) {        
        this._tempToRealParentIdMap[this._parentId] = this._parentId;
    }

    public createWorkItems(result: IResultWorkItem[]): IPromise<void> {

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
        patchDocument.push(this._getAddFieldOp("System.IterationPath", this._iterationPath));
        patchDocument.push(this._getAddFieldOp("System.AreaPath", this._areaPath));
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