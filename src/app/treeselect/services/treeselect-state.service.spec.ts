import { TreeselectStateService } from './treeselect-state.service';

describe('TreeselectStateService', () => {
    let service: TreeselectStateService;

    beforeEach(() => {
        service = new TreeselectStateService();
    });

    it('opens, toggles and updates filter text', () => {
        expect(service.isOpen()).toBeFalse();

        service.open();
        expect(service.isOpen()).toBeTrue();

        service.toggle();
        expect(service.isOpen()).toBeFalse();

        service.setFilterText('docs');
        expect(service.filterText()).toBe('docs');
    });

    it('closes and resets filter by default', () => {
        service.open();
        service.setFilterText('reports');

        service.close();

        expect(service.isOpen()).toBeFalse();
        expect(service.filterText()).toBe('');
    });

    it('closes without resetting filter when resetFilter is false', () => {
        service.open();
        service.setFilterText('keep-me');

        service.close(false);

        expect(service.isOpen()).toBeFalse();
        expect(service.filterText()).toBe('keep-me');
    });
});