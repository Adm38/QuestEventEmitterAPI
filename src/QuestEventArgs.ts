// Export interfaces to provide event listeners with an explicit args format

import { IPmcData } from "@spt/models/eft/common/IPmcData";
import { Item } from "@spt/models/eft/common/tables/IItem";
import { IAcceptQuestRequestData } from "@spt/models/eft/quests/IAcceptQuestRequestData";


export interface ICancelableEventArgs {
    cancel: boolean;
}

export interface IQuestCompleteEventArgs extends ICancelableEventArgs {
    pmcData: IPmcData;
    sessionID: string;
    completedQuestId: string;
    questRewards: Item[];
}

export interface IQuestAcceptEventArgs extends ICancelableEventArgs {
    pmcData: IPmcData;
    acceptedQuest: IAcceptQuestRequestData;
    sessionID: string;
}
