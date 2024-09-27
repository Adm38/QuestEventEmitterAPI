import { QuestController } from "@spt/controllers/QuestController";

export interface depr_IQuestControllerProxyHandler {
    get(target: QuestController, propKey: keyof QuestController, receiver: any): any
}

export interface IQuestControllerProxyHandler {
    apply(target: any, thisArg: any, argumentsList: any[]): any
}