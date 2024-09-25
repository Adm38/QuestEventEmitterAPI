import { DependencyContainer, singleton } from "tsyringe";
import { IPreQuestEventListener, IPostQuestEventListener } from "./IQuestEventListener";
import { ListenerType } from "./ListenerTypeEnum";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { QuestNotifierMod } from "./mod";
import { Dictionary, Lifecycle } from "tsyringe/dist/typings/types";
import { ICancelableEventArgs } from "./ICancelableEventArgs";
import { QuestController } from "@spt/controllers/QuestController";
import { IPostQuestListenerBinding, IPreQuestListenerBinding } from "./IQuestListenerBinding";
import { IPostSptLoadMod } from "@spt/models/external/IPostSptLoadMod";
import { QuestEventEmitter } from "./QuestEventEmitter";

export interface IOnEmitterPreMethodCallback {
    triggerPreEvent(questMethod: keyof QuestController, eventArgs: ICancelableEventArgs, ...args: any[]): ICancelableEventArgs
}

@singleton()
export class QuestListenerRegistry implements IOnEmitterPreMethodCallback, IPostSptLoadMod {

    static container: DependencyContainer;

    private preQuestEventListeners: IPreQuestListenerBinding[] = []
    private postQuestEventListeners: IPostQuestListenerBinding[] = []

    static setContainer(container: DependencyContainer): void {
        QuestListenerRegistry.container = container
    }

    constructor(
    ) { }


    public postSptLoad(container: DependencyContainer): void {
        const questEmitter = container.resolve<QuestEventEmitter>("QuestEventEmitter")

        //TODO: I don't know how I feel about this implementation.
        questEmitter.registerPreEmitListener(this)
    }


    public registerPreListener(questListenerBind: IPreQuestListenerBinding): void {
        this.preQuestEventListeners.push(questListenerBind);
    }

    public registerPostListener(questListenerBind: IPostQuestListenerBinding): void {
        this.postQuestEventListeners.push(questListenerBind);

    }

    public removePreListener(questListenerBind: IPreQuestListenerBinding): void {
        // remove the provided questListenerBind
        this.preQuestEventListeners = this.preQuestEventListeners.filter((preListener: IPreQuestListenerBinding) => {
            // return true if this element is not the element we want to remove
            return preListener != questListenerBind
        })
    }

    public removePostListener(questListenerBind: IPostQuestListenerBinding): void {
        // remove the provided questListenerBind 
        this.postQuestEventListeners = this.postQuestEventListeners.filter((postListener: IPostQuestListenerBinding) => {
            // return true if this element is not the element we want to remove
            return postListener != questListenerBind
        })
    }

    // Trigger the pre-event (can also be dynamic)
    public triggerPreEvent(questMethod: keyof QuestController, _eventArgs: ICancelableEventArgs, ...args: any[]): ICancelableEventArgs {


        // get listeners that have matching questMethod
        const listeners = this.preQuestEventListeners.filter((el: IPreQuestListenerBinding) => {
            return el.questMethod === questMethod
        })

        // initialize at this scope to ensure if one event wants to cancel, another one behind it doesn't wipe that out.
        let shouldCancel = _eventArgs.cancel
        const myEventArgs: ICancelableEventArgs = {
            cancel: shouldCancel
        }

        // if we have eventListeners to notify, iterate through and pass along the arguments provided
        if (listeners) {
            listeners.forEach((listener: IPreQuestListenerBinding) => {
                const postListenerCallEventArgs = listener.eventListenerCallback.on(myEventArgs, ...args);

                // if listener function returned should_cancel = true or it was 
                // already set to true by a previous function, ensure that 
                // value persists
                shouldCancel = shouldCancel || postListenerCallEventArgs.cancel
            });
        }

        return {
            cancel: shouldCancel
        }
    }

    // Dynamic post-event trigger based on method name and arguments
    public triggerPostEvent(questMethod: keyof QuestController, result: any, ...args: any[]): void {
        // get listeners that have matching questMethod
        const listeners = this.postQuestEventListeners.filter((el: IPostQuestListenerBinding) => {
            return el.questMethod === questMethod
        })

        // if we have eventListeners to notify, iterate through and pass along the arguments provided
        if (listeners) {
            listeners.forEach((listener: IPostQuestListenerBinding) => {
                listener.eventListenerCallback.on(result);
            });
        }
    }
}