declare namespace Editor {

    namespace Interface {
        // ---- Package ---- start
        interface PackageInfo {
            debug: boolean;
            enable: boolean;
            info: PackageJson;
            invalid: boolean;
            name: string;
            path: string;
            version: string;
        }
    
        interface PackageJson {
            name: string;
            version: string;
    
            title?: string;
            author?: string;
            debug?: boolean;
            description?: string;
            main?: string;
            editor?: string;
            panel?: any;
            contributions?: { [key: string]: any };
        }
        // ---- Package ---- end

        // ---- UI ---- start
        interface PanelInfo {
            template?: string;
            style?: string;
            listeners?: { [key: string]: Function };
            methods?: { [key: string]: Function };
            $?: { [key: string]: string };
            ready?(): void;
            update?(...args: any[]): void;
            close?(): void;
        }
        // ---- UI ---- end
    }
}
