import WIT_Client = require("TFS/WorkItemTracking/RestClient");
import WIT_Contracts = require("TFS/WorkItemTracking/Contracts");

import Q = require("q");

interface IWorkItemType {
    typeNames: string[];
    level: number;
    color: string;
}

export class WorkItemTypeService {
    private static _instance: WorkItemTypeService;
    public static getInstance(): WorkItemTypeService {
        if (!WorkItemTypeService._instance) {
            WorkItemTypeService._instance = new WorkItemTypeService();
        }
        
        return WorkItemTypeService._instance;
    }
    
    private _workItemTypes: IWorkItemType[] = [];
    
    public init(): IPromise<void> {        
        let webContext = VSS.getWebContext();
        
        // Retrieve categories that make up the backlog levels on a hosted VSTS instance 
        return WIT_Client.getClient().getWorkItemTypeCategories(webContext.project.id).then<void>(categories => {
            let epicCategory = categories.filter(c => c.referenceName === "Microsoft.EpicCategory")[0];
            let featureCategory = categories.filter(c => c.referenceName === "Microsoft.FeatureCategory")[0];
            let requirementCategory = categories.filter(c => c.referenceName === "Microsoft.RequirementCategory")[0];
            let taskCategory = categories.filter(c => c.referenceName === "Microsoft.TaskCategory")[0];
                        
            this._workItemTypes.push({
                typeNames: epicCategory && epicCategory.workItemTypes.map(wit => wit.name) || ["Scenario"], // Workaround until process api is available 
                level: 1,
                color: "rgb(255, 123, 0)"
            });
            
            this._workItemTypes.push({
                typeNames: featureCategory.workItemTypes.map(wit => wit.name),
                level: 2,
                color: "rgb(119, 59, 147)"
            });
            
            this._workItemTypes.push({
                typeNames: requirementCategory.workItemTypes.map(wit => wit.name),
                level: 3,
                color: "rgb(0, 156, 204)"
            });
            
            this._workItemTypes.push({
                typeNames: taskCategory.workItemTypes.map(wit => wit.name),
                level: 4,
                color: "rgb(242, 203, 29)"
            });
        });
    }    

    public getMinLevel(): number {
        return this._workItemTypes.reduce((maxLevel, wit) => Math.min(wit.level, maxLevel), Number.MAX_VALUE); 
    }

    public getMaxLevel(): number {
        return this._workItemTypes.reduce((maxLevel, wit) => Math.max(wit.level, maxLevel), 0); 
    }

    public getColorForType(typeName: string) {
        for (let workItemType of this._workItemTypes) {
            for (let projectType of Object.keys(workItemType.typeNames)) {
                if (workItemType.typeNames[projectType] === typeName) {
                    return workItemType.color;
                }
            }
        }

        return null;
    }

    public getTypeForLevel(level: number): IWorkItemType {
        let matchingType = this._workItemTypes.filter(wit => wit.level === level);
        if (matchingType && matchingType.length > 0) {
            return matchingType[0];
        }
        
        return null;
    }

    public getLevelForType(typeName: string): number {
        for (let workItemType of this._workItemTypes) {
            for (let projectType of Object.keys(workItemType.typeNames)) {
                if (workItemType.typeNames[projectType] === typeName) {
                    return workItemType.level;
                }
            }
        }
    
        // Treat unknown types as types of the highest level for now. This has to change
        // once a process config REST API becomes available     
        return 1;
    }
    
    /** Returns first type name for given level */
    public getTypeNameForLevel(level: number): string {
        let matchingType = this._workItemTypes.filter(wit => wit.level === level);
        if (matchingType && matchingType.length > 0) {
            return matchingType[0].typeNames[0];
        }
        
        return null;
    }   
}