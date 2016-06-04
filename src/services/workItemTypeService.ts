import Work_Client = require("TFS/Work/RestClient");
import Work_Contracts = require("TFS/Work/Contracts");

import WorkItemTracking_Contracts = require("TFS/WorkItemTracking/Contracts");

import Q = require("q");

import { IBacklogLevel, IWorkItemType } from "../interfaces";
import { IWorkItemTypeAdapter } from "../model/workItemTree";

export class WorkItemTypeService implements IWorkItemTypeAdapter {
    private static _instance: WorkItemTypeService;
    public static getInstance(): WorkItemTypeService {
        if (!WorkItemTypeService._instance) {
            WorkItemTypeService._instance = new WorkItemTypeService();
        }

        return WorkItemTypeService._instance;
    }

    private _backlogs: IBacklogLevel[] = [];
    private _level = 0;
    private _orderFieldRefName: string;
    
    private _getWorkItemTypeColor(name: string) {
        name = name.toLowerCase().trim();

        // There is no API to get work item colors yet, these are some OOB defaults
        const lookup = {
            "rgb(255, 123, 0)": ["scenario", "epic"],
            "rgb(119, 59, 147)": ["feature"],
            "rgb(0, 156, 204)": ["product backlog item", "requirement", "user story"],
            "rgb(242, 203, 29)": ["task"],
            "rgb(255, 0, 0)": ["bug"]
        };

        for (let l in lookup) {
            if (lookup.hasOwnProperty(l)) {
                for (let typeName of lookup[l]) {
                    if (name === typeName) {
                        return l;
                    }
                }
            }
        }

        // Default
        return "rgb(0, 156, 204)";
    }

    private _mapBacklog(backlog: Work_Contracts.CategoryConfiguration): IBacklogLevel {
        return {
            types: backlog.workItemTypes.map(wit => this._mapWorkItemType(wit)),
            level: ++this._level
        };
    }
    
    private _mapWorkItemType(type: WorkItemTracking_Contracts.WorkItemTypeReference) {
        return {
            name: type.name,
            color: this._getWorkItemTypeColor(type.name)
        };
    }

    public init(): IPromise<void> {
        let webContext = VSS.getWebContext();

        let client = Work_Client.getClient()
        let teamSettingsPromise = client.getTeamSettings({
            project: webContext.project.name,
            projectId: webContext.project.id,
            team: webContext.team.name,
            teamId: webContext.team.id            
        });
        
        let processConfigurationPromise = client.getProcessConfiguration(webContext.project.id);
        
        return Q.spread<any, void>([teamSettingsPromise, processConfigurationPromise], (teamSettings: Work_Contracts.TeamSetting, processConfiguration: Work_Contracts.ProcessConfiguration) => {
            for (let portfolioBacklog of processConfiguration.portfolioBacklogs) {
                this._backlogs.push(this._mapBacklog(portfolioBacklog));
            }

            let requirementBacklog = this._mapBacklog(processConfiguration.requirementBacklog);
            if (teamSettings.bugsBehavior === Work_Contracts.BugsBehavior.AsRequirements) {
                requirementBacklog.types.push(...processConfiguration.bugWorkItems.workItemTypes.map(wit => this._mapWorkItemType(wit)));
            }
            this._backlogs.push(requirementBacklog);
            
            let taskBacklog = this._mapBacklog(processConfiguration.taskBacklog);
            if (teamSettings.bugsBehavior === Work_Contracts.BugsBehavior.AsTasks) {
                requirementBacklog.types.push(...processConfiguration.bugWorkItems.workItemTypes.map(wit => this._mapWorkItemType(wit)));
            }
            this._backlogs.push(taskBacklog);
            
            this._orderFieldRefName = processConfiguration.typeFields["Order"].referenceName;
        });
    }

    public getOrderFieldRefName(): string {
        return this._orderFieldRefName;
    }

    public getMinLevel(): number {
        return this._backlogs.reduce((maxLevel, wit) => Math.min(wit.level, maxLevel), Number.MAX_VALUE);
    }

    public getMaxLevel(): number {
        return this._backlogs.reduce((maxLevel, wit) => Math.max(wit.level, maxLevel), 0);
    }

    public getType(typeName: string): IWorkItemType {
        for(let backlog of this._backlogs) {
            for (let type of backlog.types) {
                if (type.name.toLocaleLowerCase() === typeName.toLocaleLowerCase()) {
                    return type;
                }
            }
        }
        
        throw new Error("Unknown type");
    }

    public getBacklogForLevel(level: number): IBacklogLevel {
        let matchingType = this._backlogs.filter(wit => wit.level === level);
        if (matchingType && matchingType.length > 0) {
            return matchingType[0];
        }

        return null;
    }

    public getLevelForTypeName(typeName: string): number {
        for (let backlog of this._backlogs) {
            for (let type of backlog.types) {
                if (type.name.toLocaleLowerCase() === typeName.toLocaleLowerCase()) {
                    return backlog.level;
                }
            }
        }
     
        return null;
    }

    /** Returns first type name for given level */
    public getTypeNameForLevel(level: number): string {
        let matchingBacklog = this._backlogs.filter(wit => wit.level === level);
        if (matchingBacklog && matchingBacklog.length > 0) {
            return matchingBacklog[0].types[0].name;
        }

        return null;
    }
}