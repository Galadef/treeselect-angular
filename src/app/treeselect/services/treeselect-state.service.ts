import { Injectable, signal } from '@angular/core';

@Injectable()
export class TreeselectStateService {
    readonly isOpen = signal(false);
    readonly filterText = signal('');

    open(): void {
        this.isOpen.set(true);
    }

    close(resetFilter = true): void {
        this.isOpen.set(false);

        if (resetFilter) {
            this.filterText.set('');
        }
    }

    toggle(): void {
        this.isOpen.update((open) => !open);
    }

    setFilterText(value: string): void {
        this.filterText.set(value);
    }
}
