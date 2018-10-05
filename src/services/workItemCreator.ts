///<reference types="vss-web-extension-sdk" />

import WIT_Client = require("TFS/WorkItemTracking/RestClient");
import WIT_Contracts = require("TFS/WorkItemTracking/Contracts");

import Q = require("q");

import { IResultWorkItem } from "../interfaces";

import { WorkItemTypeService } from "./workItemTypeService";

interface ISaveResult {
    tempId: number;
    id?: number;
    reason?: string;
}

export class WorkItemCreator {
    private _tempToRealParentIdMap: IDictionaryNumberTo<number>;
    private _failedWorkItems: IDictionaryNumberTo<string>;

    // In order to preserve the order of child items we'll set a stack rank matching the order in which they 
    // were created. Once a user reorders them, this will trigger resparsification. 
    private _order = 0;

    constructor(private _parentId: number, private _iterationPath: string, private _areaPath: string) {
        this._tempToRealParentIdMap = {};
        this._failedWorkItems = {};

        this._tempToRealParentIdMap[this._parentId] = this._parentId;
    }

    /** Create work items, return ids of failed operations */
    public createWorkItems(result: IResultWorkItem[]): IPromise<IDictionaryNumberTo<string>> {
        return this._createWorkItemsWorker(result.slice(0)).then(() => {
            return this._failedWorkItems;
        });
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
                    if (this._failedWorkItems[workItem.parentId]) {
                        // Parent has failed to save earlier, mark as failed and do not try again
                        this._failedWorkItems[workItem.id] = "Parent could not be saved";
                    } else if (!this._failedWorkItems[workItem.id]) {
                        // Work item still needs to be created
                        workItemsToCreate.push(workItem);
                    }
                }
            }
        }

        return Q.all(promises).then((results: ISaveResult[]) => {
            for (let result of results) {
                if (!!result.reason) {
                    // Work item failed to save
                    this._failedWorkItems[result.tempId] = result.reason || "Work item failed to save";
                } else {
                    // Work item was saved successfully
                }
            }

            // Start next batch
            return this._createWorkItemsWorker(workItemsToCreate);
        });
    }

    private _getCreateWorkItemPromise(workItem: IResultWorkItem): IPromise<ISaveResult> {
        let context = VSS.getWebContext();
        let client = WIT_Client.getClient();

        let workItemType = workItem.typeName;
        let parentId = this._tempToRealParentIdMap[workItem.parentId];

        let patchDocument: any[] = [];

        patchDocument.push(this._getAddFieldOp("System.Title", workItem.title));
        patchDocument.push(this._getAddFieldOp("System.IterationPath", this._iterationPath));
        patchDocument.push(this._getAddFieldOp("System.AreaPath", this._areaPath));
        patchDocument.push(this._getAddFieldOp(WorkItemTypeService.getInstance().getOrderFieldRefName(), (++this._order).toString(10)));
        patchDocument.push({
            "op": "add",
            "path": "/relations/-",
            "value": {
                "rel": "System.LinkTypes.Hierarchy-Reverse",
                "url": `${context.collection.uri}/_apis/wit/workItems/${parentId}`
            }
        });

        return client.createWorkItem(patchDocument, context.project.id, workItemType).then<ISaveResult>((createdWorkItem: WIT_Contracts.WorkItem) => {
            this._tempToRealParentIdMap[workItem.id] = createdWorkItem.id;

            return {
                tempId: workItem.id,
                id: createdWorkItem.id
            };
        }, (error) => {
            return {
                tempId: workItem.id,
                reason: error.message
            };
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