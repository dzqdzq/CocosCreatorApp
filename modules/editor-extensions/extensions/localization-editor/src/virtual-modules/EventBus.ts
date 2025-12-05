import 'reflect-metadata';
import { container } from 'tsyringe';
import EventBusService from '../core/service/util/EventBusService';
import EventBusModule from './EventBusModule';

const Content: EventBusModule = {
    eventBus: container.resolve(EventBusService),
};

export = Content;
