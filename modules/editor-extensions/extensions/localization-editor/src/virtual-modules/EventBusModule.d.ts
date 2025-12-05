/* eslint-disable semi */
import 'EventBus';
import EventBusService from '../core/service/util/EventBusService';

export default interface IEventBusModule {
    eventBus: EventBusService
}

declare module 'EventBus' {
    export const eventBus: IEventBusModule['eventBus'];
}
