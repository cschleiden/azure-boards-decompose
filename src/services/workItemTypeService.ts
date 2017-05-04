///<reference types="vss-web-extension-sdk" />

import Work_Client = require("TFS/Work/RestClient");
import Work_Contracts = require("TFS/Work/Contracts");

import WorkItemTracking_Client = require("TFS/WorkItemTracking/RestClient");
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

    private _mapBacklog(backlog: Work_Contracts.BacklogLevelConfiguration): IBacklogLevel {
        return {
            types: backlog.workItemTypes.map(wit => this._mapWorkItemType(wit)),
            defaultType: this._mapWorkItemType(backlog.defaultWorkItemType),
            level: ++this._level
        };
    }

    private _mapWorkItemType(type: WorkItemTracking_Contracts.WorkItemTypeReference) {
        return {
            name: type.name
        };
    }

    public init(): IPromise<void> {
        const webContext = VSS.getWebContext();

        const client = Work_Client.getClient();
        const teamContext = {
            project: webContext.project.name,
            projectId: webContext.project.id,
            team: webContext.team.name,
            teamId: webContext.team.id
        };

        const witClient = WorkItemTracking_Client.getClient();

        return Q.all([
            client.getBacklogConfigurations(teamContext),
            client.getProcessConfiguration(webContext.project.id),
            witClient.getWorkItemTypes(webContext.project.id)
        ])
            .spread((
                backlogConfiguration: Work_Contracts.BacklogConfiguration, processConfiguration: Work_Contracts.ProcessConfiguration, workItemTypes: WorkItemTracking_Contracts.WorkItemType[]) => {
                for (let portfolioBacklog of backlogConfiguration.portfolioBacklogs) {
                    this._backlogs.push(this._mapBacklog(portfolioBacklog));
                }

                const requirementBacklog = this._mapBacklog(backlogConfiguration.requirementBacklog);
                this._backlogs.push(requirementBacklog);

                const taskBacklog = this._mapBacklog(backlogConfiguration.taskBacklog);
                this._backlogs.push(taskBacklog);

                this._orderFieldRefName = processConfiguration.typeFields["Order"].referenceName;

                // Ugly-ness ahead.. do no try this at home!
                const workItemTypeProbePromises: IPromise<void>[] = [];

                for (let backlog of this._backlogs) {
                    if (backlog.types.length > 1) {
                        for (let workItemType of backlog.types) {
                            if (workItemType.name !== backlog.defaultType.name) {
                                // Some type might be disabled, check every type that's not default
                                workItemTypeProbePromises.push(witClient.createWorkItem([{
                                    op: "add",
                                    path: "/fields/System.Title",
                                    value: ""
                                }], webContext.project.id, workItemType.name, true).then<void>(null, () => {
                                    // Creation disabled, remove from backlog
                                    backlog.types.splice(backlog.types.indexOf(workItemType), 1);
                                }));
                            }
                        }
                    }
                }

                return Q.all(workItemTypeProbePromises).then<void>(() => {
                    // Add work item type colors
                    for (let workItemType of workItemTypes) {
                        for (let backlog of this._backlogs) {
                            for (let backlogWorkItemType of backlog.types) {
                                if (backlogWorkItemType.name.toUpperCase() === workItemType.name.toUpperCase()) {
                                    backlogWorkItemType.color = `#${workItemType.color}`;
                                }
                            }
                        }
                    }
                });
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
        for (let backlog of this._backlogs) {
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

    /** Returns default type name for given level */
    public getTypeNameForLevel(level: number): string {
        let matchingBacklog = this._backlogs.filter(wit => wit.level === level);
        if (matchingBacklog && matchingBacklog.length > 0) {
            return matchingBacklog[0].defaultType.name;
        }

        return null;
    }
}