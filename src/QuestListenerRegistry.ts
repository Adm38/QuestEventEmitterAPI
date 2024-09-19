import { DependencyContainer, singleton } from "tsyringe";
import { IBaseQuestEventCallback } from "./IQuestEventListener";
import { ListenerType } from "./ListenerTypeEnum";
import { ILogger } from "@spt/models/spt/utils/ILogger";
import { QuestNotifierMod } from "./mod";
import { Dictionary, Lifecycle } from "tsyringe/dist/typings/types";
import { ICancelableEventArgs } from "./QuestEventArgs";

export class QuestListenerRegistry {

    private listeners: Record<string, IBaseQuestEventCallback[]> = {}; // Dictionary of event listeners

    constructor(
        private container: DependencyContainer,
        private questEventListeners: Dictionary<Array<IBaseQuestEventCallback>> = {}
    ) {
        // register QuestListenerRegistry so other classes can easily add their quest events
        container.register<QuestListenerRegistry>("QuestListenerRegistry", QuestListenerRegistry, { lifecycle: Lifecycle.Singleton })
    }

    // Register a new listener for a specific event type
    public addListener(listenerType: ListenerType, listener: IBaseQuestEventCallback): void {
        if (!this.listeners[listenerType]) {
            this.listeners[listenerType] = [];
        }
        this.listeners[listenerType].push(listener);
    }

    public removeListener(listenerType: ListenerType, listenerCallback: IBaseQuestEventCallback): void {
        // resolve any dependencies
        const logger = this.container.resolve<ILogger>("WinstonLogger");
        const questNotifierMod = this.container.resolve<QuestNotifierMod>(QuestNotifierMod.modName)

        // create a new array with all functions minus `listenerCallback`.
        const newListeners: Array<IBaseQuestEventCallback> = this.questEventListeners[listenerType].filter((listenerFunc) => {
            return !(listenerFunc === listenerCallback);
        });

        // If we are in debug mode, print the difference between current this.questEventListeners and newListeners
        if (questNotifierMod.modConfig.debug) {
            logger.debug(`Old Listener Count: ${this.questEventListeners[listenerType].length} | New Listener Count: ${newListeners.length}`);
        }
    }

    // Trigger the pre-event (can also be dynamic)
    public triggerPreEvent(listenerType: ListenerType, eventArgs: ICancelableEventArgs, ...args: any[]): void {
        const listeners = this.listeners[listenerType];
        if (listeners) {
            listeners.forEach((listener) => {
                listener.onPreEvent?.(eventArgs, ...args);  // Call pre-event listener if exists
            });
        }
    }

    // Dynamic post-event trigger based on method name and arguments
    public triggerPostEvent(listenerType: ListenerType, result: any, ...args: any[]): void {
        const listeners = this.listeners[listenerType];
        if (listeners) {
            listeners.forEach((listener) => {
                listener.onPostEvent?.(result, ...args);  // Call post-event listener if exists
            });
        }
    }
}