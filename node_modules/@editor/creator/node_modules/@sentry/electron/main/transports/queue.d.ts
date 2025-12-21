import { TransportRequest } from '@sentry/types';
interface PopResult {
    request: QueuedTransportRequest;
    pendingCount: number;
}
export interface QueuedTransportRequest extends TransportRequest {
    date?: Date;
}
/** A request queue that is persisted to disk to survive app restarts */
export declare class PersistedRequestQueue {
    private readonly _queuePath;
    private readonly _maxAgeDays;
    private readonly _maxCount;
    private readonly _queue;
    constructor(_queuePath: string, _maxAgeDays?: number, _maxCount?: number);
    /** Adds a request to the queue */
    add(request: QueuedTransportRequest): Promise<number>;
    /** Pops the oldest event from the queue */
    pop(): Promise<PopResult | undefined>;
    /** Removes the body of the request */
    private _removeBody;
}
export {};
//# sourceMappingURL=queue.d.ts.map