import { Injectable, isDevMode } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TreeselectOpsService {
    private readonly openedAtByInstance = new Map<string, number>();
    private readonly loggingEnabled = isDevMode();

    trackPanelOpened(instanceId: string): void {
        this.openedAtByInstance.set(instanceId, performance.now());
        this.logInfo('open', instanceId);
    }

    trackPanelClosed(instanceId: string): void {
        const openedAt = this.openedAtByInstance.get(instanceId);

        if (openedAt === undefined) {
            this.logInfo('close-without-open', instanceId);
            return;
        }

        const openDurationMs = Math.round(performance.now() - openedAt);
        this.openedAtByInstance.delete(instanceId);
        this.logInfo('close', instanceId, { openDurationMs });
    }

    trackClear(instanceId: string): void {
        this.logInfo('clear', instanceId);
    }

    private logInfo(event: string, instanceId: string, extra?: Record<string, number>): void {
        if (!this.loggingEnabled) {
            return;
        }

        console.info('[TreeSelectOps]', {
            event,
            component: 'app-treeselect',
            instanceId,
            timestamp: new Date().toISOString(),
            ...extra,
        });
    }
}
