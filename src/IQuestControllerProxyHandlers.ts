import { QuestController } from "@spt/controllers/QuestController";

export interface IQuestControllerProxyHandler {
    get(target: QuestController, propKey: keyof QuestController, receiver: any): any
}