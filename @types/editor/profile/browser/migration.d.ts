export declare function _registerMigration(pkgName: string, migrations: any[]): void;
export declare function _unregisterMigration(pkgName: string): void;
export declare function migrateGlobal(pkgName: string, profileVersion: string, profileData: any): Promise<any>;
export declare function migrateLocal(pkgName: string, profileVersion: string, profileData: any): Promise<any>;
export declare function migrateProject(pkgName: string, profileVersion: string, profileData: any): Promise<any>;
