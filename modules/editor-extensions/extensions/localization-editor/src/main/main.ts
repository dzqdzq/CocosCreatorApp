import 'reflect-metadata';
import '../core/container-registry';
import { container } from 'tsyringe';
import CacheService from '../core/service/util/CacheService';
import { ConfigDirectoryStructure, ResourceDirectoryStructure } from '../core/entity/directory-structure/directory-structure';
import MainThread from './MainThread';

const cacheService = container.resolve(CacheService);

export const methods = container.resolve(MainThread);

export const load = () => {
    // cacheService.clear();

    container.resolve(ConfigDirectoryStructure).init(Editor.Project.path);
    container.resolve(ResourceDirectoryStructure).init(Editor.Project.path);

    container.resolve(MainThread).readConfig().then();
};

export const unload = () => {
};
