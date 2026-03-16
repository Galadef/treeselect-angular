import { TestBed } from '@angular/core/testing';
import { TreeselectOpsService } from './treeselect-ops.service';

describe('TreeselectOpsService', () => {
    let service: TreeselectOpsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TreeselectOpsService);
    });

    it('tracks open and close duration when panel was opened', () => {
        spyOn(performance, 'now').and.returnValues(100, 250);
        const consoleSpy = spyOn(console, 'info');

        service.trackPanelOpened('ts-1');
        service.trackPanelClosed('ts-1');

        expect(consoleSpy).toHaveBeenCalledTimes(2);
        const closePayload = consoleSpy.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(closePayload['event']).toBe('close');
        expect(closePayload['openDurationMs']).toBe(150);
    });

    it('logs close-without-open when closing unknown instance', () => {
        const consoleSpy = spyOn(console, 'info');

        service.trackPanelClosed('missing');

        const payload = consoleSpy.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(payload['event']).toBe('close-without-open');
        expect(payload['instanceId']).toBe('missing');
    });

    it('logs clear event', () => {
        const consoleSpy = spyOn(console, 'info');

        service.trackClear('ts-2');

        const payload = consoleSpy.calls.mostRecent().args[1] as Record<string, unknown>;
        expect(payload['event']).toBe('clear');
        expect(payload['component']).toBe('app-treeselect');
        expect(typeof payload['timestamp']).toBe('string');
    });

    it('does not log when logging is disabled', () => {
        const consoleSpy = spyOn(console, 'info');

        (service as unknown as { loggingEnabled: boolean }).loggingEnabled = false;
        service.trackClear('ts-3');

        expect(consoleSpy).not.toHaveBeenCalled();
    });
});
