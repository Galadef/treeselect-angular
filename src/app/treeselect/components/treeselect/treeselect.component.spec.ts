import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TreeselectComponent } from './treeselect.component';
import { TreeNode } from '../../models/tree-node.model';
import { TreeselectCheckboxSelection } from '../../models/treeselect-selection.model';
import { collectDescendantKeys, TreeNodeIndex } from '../../utils/tree-node.utils';

@Component({
    standalone: true,
    imports: [ReactiveFormsModule, TreeselectComponent],
    template: `
    <form [formGroup]="form">
      <app-treeselect [options]="options" formControlName="tree" />
    </form>
  `,
})
class ReactiveHostComponent {
    options: TreeNode[] = [
        {
            key: 'docs',
            label: 'Documentos',
            children: [{ key: 'docs:reports', label: 'Reportes', leaf: true }],
        },
    ];

    readonly form = new FormGroup({
        tree: new FormControl<string | null>(null),
    });
}

@Component({
    standalone: true,
    imports: [FormsModule, TreeselectComponent],
    template: `<app-treeselect [options]="options" [(ngModel)]="value" name="treeModel" />`,
})
class NgModelHostComponent {
    readonly options: TreeNode[] = [
        {
            key: 'docs',
            label: 'Documentos',
            children: [{ key: 'docs:reports', label: 'Reportes', leaf: true }],
        },
    ];

    value: string | null = null;
}

@Component({
    standalone: true,
    imports: [TreeselectComponent],
    template: `
    <app-treeselect
      [options]="options"
      selectionMode="single"
      [value]="value"
      (valueChange)="onValueChange($event)"
    />
  `,
})
class SingleInputHostComponent {
    readonly options: TreeNode[] = [
        {
            key: 'docs',
            label: 'Documentos',
            children: [{ key: 'docs:reports', label: 'Reportes', leaf: true }],
        },
    ];

    value: string | null = 'key-no-existe';

    onValueChange(nextValue: unknown): void {
        this.value = typeof nextValue === 'string' ? nextValue : null;
    }
}

@Component({
    standalone: true,
    imports: [TreeselectComponent],
    template: `
    <app-treeselect
      [options]="options"
      selectionMode="multiple"
      [value]="value"
      (valueChange)="onValueChange($event)"
    />
  `,
})
class MultipleInputHostComponent {
    readonly options: TreeNode[] = [
        {
            key: 'docs',
            label: 'Documentos',
            children: [
                { key: 'docs:reports', label: 'Reportes', leaf: true },
                { key: 'docs:contracts', label: 'Contratos', leaf: true },
            ],
        },
    ];

    value: string[] = ['docs:reports', 'key-no-existe'];

    onValueChange(nextValue: unknown): void {
        this.value = Array.isArray(nextValue)
            ? nextValue.filter((value): value is string => typeof value === 'string')
            : [];
    }
}

describe('TreeselectComponent forms integration', () => {
    it('integrates with Reactive Forms', async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveHostComponent],
        }).compileComponents();

        const fixture: ComponentFixture<ReactiveHostComponent> = TestBed.createComponent(ReactiveHostComponent);
        fixture.detectChanges();

        const host = fixture.componentInstance;
        host.form.controls.tree.setValue('docs:reports');
        fixture.detectChanges();

        expect(host.form.controls.tree.value).toBe('docs:reports');
    });

    it('integrates with ngModel', async () => {
        await TestBed.configureTestingModule({
            imports: [NgModelHostComponent],
        }).compileComponents();

        const fixture: ComponentFixture<NgModelHostComponent> = TestBed.createComponent(NgModelHostComponent);
        fixture.detectChanges();

        const host = fixture.componentInstance;
        host.value = 'docs:reports';
        fixture.detectChanges();

        expect(host.value).toBe('docs:reports');
    });

    it('reconciles selected value when options change dynamically', async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveHostComponent],
        }).compileComponents();

        const fixture: ComponentFixture<ReactiveHostComponent> = TestBed.createComponent(ReactiveHostComponent);
        fixture.detectChanges();

        const host = fixture.componentInstance;
        host.form.controls.tree.setValue('docs:reports');
        fixture.detectChanges();

        host.options = [
            {
                key: 'media',
                label: 'Media',
                children: [{ key: 'media:videos', label: 'Videos', leaf: true }],
            },
        ];
        fixture.detectChanges();

        expect(host.form.controls.tree.value).toBeNull();
    });

    it('cleans invalid initial value not present in options (single)', async () => {
        await TestBed.configureTestingModule({
            imports: [SingleInputHostComponent],
        }).compileComponents();

        const fixture: ComponentFixture<SingleInputHostComponent> = TestBed.createComponent(SingleInputHostComponent);
        fixture.detectChanges();

        expect(fixture.componentInstance.value).toBeNull();
    });

    it('reconciles multiple initial value keeping only existing keys', async () => {
        await TestBed.configureTestingModule({
            imports: [MultipleInputHostComponent],
        }).compileComponents();

        const fixture: ComponentFixture<MultipleInputHostComponent> = TestBed.createComponent(MultipleInputHostComponent);
        fixture.detectChanges();

        expect(fixture.componentInstance.value).toEqual(['docs:reports']);
    });
});

describe('TreeselectComponent behavior', () => {
    const options: TreeNode[] = [
        {
            key: 'docs',
            label: 'Documentos',
            children: [
                { key: 'docs:contracts', label: 'Contratos', leaf: true },
                { key: 'docs:reports', label: 'Reportes', leaf: true },
            ],
        },
        {
            key: 'media',
            label: 'Media',
            children: [{ key: 'media:videos', label: 'Videos', leaf: true }],
        },
    ];

    async function createComponent(): Promise<ComponentFixture<TreeselectComponent>> {
        await TestBed.configureTestingModule({
            imports: [TreeselectComponent],
        }).compileComponents();

        const fixture = TestBed.createComponent(TreeselectComponent);
        fixture.componentRef.setInput('options', options);
        fixture.detectChanges();

        return fixture;
    }

    it('opens and closes panel', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;

        expect(component.state.isOpen()).toBeFalse();

        component.togglePanel();
        expect(component.state.isOpen()).toBeTrue();

        component.closePanel();
        expect(component.state.isOpen()).toBeFalse();
    });

    it('selects and unselects in single mode', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;
        const node = options[0].children?.[0] as TreeNode;

        component.selectNode(new MouseEvent('click'), node);
        expect(component.isSelected(node)).toBeTrue();

        component.selectNode(new MouseEvent('click'), node);
        expect(component.isSelected(node)).toBeFalse();
    });

    it('handles multiple selection with and without meta key', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;
        const firstNode = options[0].children?.[0] as TreeNode;
        const secondNode = options[0].children?.[1] as TreeNode;

        fixture.componentRef.setInput('selectionMode', 'multiple');
        fixture.detectChanges();

        const firstKey = firstNode.key as string;
        const secondKey = secondNode.key as string;

        component.selectNode(new MouseEvent('click'), firstNode);
        expect(component.selectedKeys()).toEqual([firstKey]);

        component.selectNode(new MouseEvent('click', { ctrlKey: true }), secondNode);
        expect(component.selectedKeys().sort()).toEqual([firstKey, secondKey].sort());
    });

    it('handles checkbox selection and partial states', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;
        const rootNode = options[0];

        fixture.componentRef.setInput('selectionMode', 'checkbox');
        fixture.detectChanges();

        component.selectNode(new MouseEvent('click'), rootNode);

        expect(component.isSelected(rootNode)).toBeTrue();
        expect(component.isSelected(options[0].children?.[0] as TreeNode)).toBeTrue();

        component.selectNode(new MouseEvent('click'), options[0].children?.[0] as TreeNode);
        expect(component.isPartiallySelected(rootNode)).toBeTrue();
    });

    it('applies checkbox selection from configured level', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;
        const rootNode = options[0] as TreeNode;
        const childNode = options[0].children?.[0] as TreeNode;

        fixture.componentRef.setInput('selectionMode', 'checkbox');
        fixture.componentRef.setInput('checkboxSelectionStartLevel', 2);
        fixture.detectChanges();

        component.selectNode(new MouseEvent('click'), rootNode);
        expect(component.isSelected(rootNode)).toBeFalse();

        component.selectNode(new MouseEvent('click'), childNode);
        expect(component.isSelected(childNode)).toBeTrue();
        expect(component.isPartiallySelected(rootNode)).toBeTrue();
    });

    it('renders checkbox only from configured level', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;

        fixture.componentRef.setInput('selectionMode', 'checkbox');
        fixture.componentRef.setInput('checkboxSelectionStartLevel', 2);
        fixture.detectChanges();

        expect(component.shouldRenderCheckbox(1)).toBeFalse();
        expect(component.shouldRenderCheckbox(2)).toBeTrue();
        expect(component.shouldRenderCheckbox(3)).toBeTrue();
    });

    it('allows selecting by clicking the checkbox control itself', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;

        fixture.componentRef.setInput('selectionMode', 'checkbox');
        fixture.detectChanges();

        component.togglePanel();
        fixture.detectChanges();

        const checkboxButton = fixture.nativeElement
            .querySelector('.p-treeselect-panel .p-checkbox-box') as HTMLButtonElement;

        expect(checkboxButton).toBeTruthy();
        checkboxButton.click();
        fixture.detectChanges();

        expect(component.hasValue()).toBeTrue();
    });

    it('marks parent partial when some children are selected and checked when all are selected', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;
        const rootNode = options[0] as TreeNode;
        const firstChild = options[0].children?.[0] as TreeNode;
        const secondChild = options[0].children?.[1] as TreeNode;

        fixture.componentRef.setInput('selectionMode', 'checkbox');
        fixture.componentRef.setInput('checkboxSelectionStartLevel', 1);
        fixture.detectChanges();

        component.selectNode(new MouseEvent('click'), firstChild);
        expect(component.isSelected(rootNode)).toBeFalse();
        expect(component.isPartiallySelected(rootNode)).toBeTrue();

        component.selectNode(new MouseEvent('click'), secondChild);
        expect(component.isPartiallySelected(rootNode)).toBeFalse();
        expect(component.isSelected(rootNode)).toBeTrue();

        component.selectNode(new MouseEvent('click'), firstChild);
        expect(component.isPartiallySelected(rootNode)).toBeTrue();
        expect(component.isSelected(rootNode)).toBeFalse();
    });

    it('does not recalculate parent state when propagateSelectionUp is disabled', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;
        const rootNode = options[0] as TreeNode;
        const childNode = options[0].children?.[0] as TreeNode;

        fixture.componentRef.setInput('selectionMode', 'checkbox');
        fixture.componentRef.setInput('propagateSelectionUp', false);
        fixture.detectChanges();

        component.selectNode(new MouseEvent('click'), childNode);

        expect(component.isSelected(childNode)).toBeTrue();
        expect(component.isSelected(rootNode)).toBeFalse();
        expect(component.isPartiallySelected(rootNode)).toBeFalse();
    });

    it('does not propagate selection to descendants when propagateSelectionDown is disabled', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;
        const rootNode = options[0] as TreeNode;
        const childNode = options[0].children?.[0] as TreeNode;

        fixture.componentRef.setInput('selectionMode', 'checkbox');
        fixture.componentRef.setInput('propagateSelectionDown', false);
        fixture.detectChanges();

        component.selectNode(new MouseEvent('click'), rootNode);

        expect(component.isSelected(rootNode)).toBeTrue();
        expect(component.isSelected(childNode)).toBeFalse();
    });

    it('normalizes checkboxSelectionStartLevel values', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;

        fixture.componentRef.setInput('selectionMode', 'checkbox');
        fixture.componentRef.setInput('checkboxSelectionStartLevel', 0);
        fixture.detectChanges();
        expect(component.shouldRenderCheckbox(1)).toBeTrue();

        fixture.componentRef.setInput('checkboxSelectionStartLevel', 2.9);
        fixture.detectChanges();
        expect(component.shouldRenderCheckbox(2)).toBeTrue();
        expect(component.shouldRenderCheckbox(1)).toBeFalse();

        fixture.componentRef.setInput('checkboxSelectionStartLevel', Number.NaN);
        fixture.detectChanges();
        expect(component.shouldRenderCheckbox(1)).toBeTrue();

        fixture.componentRef.setInput('selectionMode', 'single');
        fixture.detectChanges();
        expect(component.shouldRenderCheckbox(99)).toBeFalse();
    });

    it('applies and exposes configurable input options', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;

        fixture.componentRef.setInput('selectionMode', 'multiple');
        fixture.componentRef.setInput('display', 'chip');
        fixture.componentRef.setInput('placeholder', 'Mi placeholder');
        fixture.componentRef.setInput('showClear', true);
        fixture.componentRef.setInput('filter', true);
        fixture.componentRef.setInput('filterBy', 'label');
        fixture.componentRef.setInput('filterMode', 'strict');
        fixture.componentRef.setInput('filterPlaceholder', 'Busca aquí');
        fixture.componentRef.setInput('filterInputAutoFocus', true);
        fixture.componentRef.setInput('resetFilterOnHide', true);
        fixture.componentRef.setInput('virtualScroll', true);
        fixture.componentRef.setInput('virtualScrollItemSize', 44);
        fixture.componentRef.setInput('loading', true);
        fixture.componentRef.setInput('loadingMode', 'mask');
        fixture.componentRef.setInput('metaKeySelection', false);
        fixture.componentRef.setInput('propagateSelectionDown', false);
        fixture.componentRef.setInput('propagateSelectionUp', false);
        fixture.componentRef.setInput('checkboxSelectionStartLevel', 3);
        fixture.componentRef.setInput('disabled', true);
        fixture.componentRef.setInput('tabindex', 7);
        fixture.componentRef.setInput('inputId', 'tree-id');
        fixture.componentRef.setInput('ariaLabel', 'Tree select aria');
        fixture.componentRef.setInput('ariaLabelledBy', 'tree-label');
        fixture.componentRef.setInput('rootClass', 'root-custom');
        fixture.componentRef.setInput('panelClass', 'panel-custom');
        fixture.componentRef.setInput('labelClass', 'label-custom');
        fixture.componentRef.setInput('rootStyle', { width: '420px' });
        fixture.componentRef.setInput('panelStyle', { maxHeight: '280px' });
        fixture.componentRef.setInput('labelStyle', { color: 'rgb(0,0,0)' });
        fixture.detectChanges();

        expect(component.selectionMode()).toBe('multiple');
        expect(component.display()).toBe('chip');
        expect(component.placeholder()).toBe('Mi placeholder');
        expect(component.showClear()).toBeTrue();
        expect(component.filter()).toBeTrue();
        expect(component.filterMode()).toBe('strict');
        expect(component.filterPlaceholder()).toBe('Busca aquí');
        expect(component.virtualScroll()).toBeTrue();
        expect(component.virtualScrollItemSize()).toBe(44);
        expect(component.loading()).toBeTrue();
        expect(component.loadingMode()).toBe('mask');
        expect(component.metaKeySelection()).toBeFalse();
        expect(component.propagateSelectionDown()).toBeFalse();
        expect(component.propagateSelectionUp()).toBeFalse();
        expect(component.checkboxSelectionStartLevel()).toBe(3);
        expect(component.isDisabled()).toBeTrue();
        expect(component.tabindex()).toBe(7);
        expect(component.inputId()).toBe('tree-id');
        expect(component.ariaLabel()).toBe('Tree select aria');
        expect(component.ariaLabelledBy()).toBe('tree-label');
        expect(component.rootClass()).toBe('root-custom');
        expect(component.panelClass()).toBe('panel-custom');
        expect(component.labelClass()).toBe('label-custom');
        expect(component.rootStyle()).toEqual({ width: '420px' });
        expect(component.panelStyle()).toEqual({ maxHeight: '280px' });
        expect(component.labelStyle()).toEqual({ color: 'rgb(0,0,0)' });
    });

    it('clears value and expanded keys', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;
        const node = options[0];

        component.toggleNodeExpansion(new MouseEvent('click'), node);
        component.selectNode(new MouseEvent('click'), options[0].children?.[0] as TreeNode);

        expect(component.hasValue()).toBeTrue();
        expect(component.isNodeExpanded(node)).toBeTrue();

        component.clear(new MouseEvent('click'));

        expect(component.hasValue()).toBeFalse();
        expect(component.isNodeExpanded(node)).toBeFalse();
    });

    it('filters nodes and emits filtered state', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;
        let emittedQuery = '';

        fixture.componentRef.setInput('filter', true);
        fixture.detectChanges();

        component.filterApplied.subscribe((event) => {
            emittedQuery = event.query;
        });

        const inputEvent = {
            target: { value: 'repo' },
        } as unknown as Event;

        component.onFilterInput(inputEvent);

        expect(emittedQuery).toBe('repo');
        expect(component.filteredNodes().length).toBeGreaterThan(0);
    });

    it('supports trigger keydown interactions', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;

        component.onTriggerKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(component.state.isOpen()).toBeTrue();

        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(component.state.isOpen()).toBeFalse();
    });

    it('renders valid trigger semantics and tree ARIA attributes', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;

        component.togglePanel();
        fixture.detectChanges();

        const trigger = fixture.nativeElement.querySelector('.p-treeselect-trigger-button') as HTMLButtonElement;
        const nestedButtons = trigger.querySelectorAll('button');
        const tree = fixture.nativeElement.querySelector('.p-tree') as HTMLElement;

        expect(nestedButtons.length).toBe(0);
        expect(trigger.getAttribute('aria-controls')).toBe(component.treeId);
        expect(tree.getAttribute('role')).toBe('tree');
    });

    it('tracks virtual scroll values', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;

        fixture.componentRef.setInput('virtualScroll', true);
        fixture.detectChanges();

        component.onVirtualScroll({ target: { scrollTop: 120 } } as unknown as Event);

        expect(component.virtualStartIndex()).toBeGreaterThanOrEqual(0);
        expect(component.virtualOffset()).toBeGreaterThanOrEqual(0);
    });

    it('loads children lazily on expansion', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;
        const lazyNode: TreeNode = { key: 'lazy:root', label: 'Lazy Root' };

        fixture.componentRef.setInput('options', [lazyNode]);
        fixture.componentRef.setInput('lazy', true);
        fixture.componentRef.setInput('loadChildren', async () => [
            { key: 'lazy:root:a', label: 'A', leaf: true },
        ]);
        fixture.detectChanges();

        await component.toggleNodeExpansion(new MouseEvent('click'), lazyNode);

        expect(component.loadingKeys().size).toBe(0);
        expect(component.normalizedOptions()[0].children?.length).toBe(1);
    });

    it('reconciles checkbox selection with valid keys only', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            reconcileValueWithCurrentOptions: (value: unknown) => unknown;
            validNodeKeys: () => Set<string>;
        };

        const currentValue: TreeselectCheckboxSelection = {
            'docs:reports': { checked: true, partialChecked: false },
            invalid: { checked: true, partialChecked: false },
        };

        fixture.componentRef.setInput('selectionMode', 'checkbox');
        fixture.detectChanges();

        const reconciled = component.reconcileValueWithCurrentOptions(currentValue) as TreeselectCheckboxSelection;

        expect(reconciled['docs:reports']?.checked).toBeTrue();
        expect(reconciled['invalid']).toBeUndefined();
        expect(component.validNodeKeys().has('docs:reports')).toBeTrue();
    });

    it('handles trigger keydown ArrowDown paths', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            state: { isOpen: () => boolean };
            onTriggerKeydown: (event: KeyboardEvent) => void;
            togglePanel: () => void;
            focusFirstNodeButton: () => void;
        };

        const toggleSpy = spyOn(component, 'togglePanel').and.callThrough();
        const focusSpy = spyOn(component, 'focusFirstNodeButton');

        component.onTriggerKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
        expect(toggleSpy).toHaveBeenCalled();
        expect(component.state.isOpen()).toBeTrue();

        component.onTriggerKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
        expect(focusSpy).toHaveBeenCalled();
    });

    it('handles panel keyboard navigation branches', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            onPanelKeydown: (event: KeyboardEvent) => void;
            togglePanel: () => void;
            closePanel: () => void;
            focusNodeButtonByOffset: (offset: number) => void;
        };

        component.togglePanel();

        const closeSpy = spyOn(component, 'closePanel').and.callThrough();
        const focusSpy = spyOn(component, 'focusNodeButtonByOffset');

        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'Tab' }));

        expect(focusSpy).toHaveBeenCalledWith(1);
        expect(focusSpy).toHaveBeenCalledWith(-1);
        expect(closeSpy).toHaveBeenCalled();
    });

    it('handles ArrowRight, ArrowLeft and Enter panel actions', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            expandedKeys: { set: (next: Set<string>) => void };
            normalizedOptions: () => TreeNode[];
            onPanelKeydown: (event: KeyboardEvent) => void;
            togglePanel: () => void;
            getFocusedNodeKey: () => string | null;
            toggleNodeExpansion: (event: Event, node: TreeNode) => void;
            focusNodeButtonByKey: (key: string) => void;
            selectNode: (event: Event, node: TreeNode) => void;
            nodeIndex: () => { parentByKey: Map<string, string> };
            isNodeExpanded: (node: TreeNode) => boolean;
        };

        component.togglePanel();

        component.expandedKeys.set(new Set());

        const focusedKeySpy = spyOn(component, 'getFocusedNodeKey').and.returnValue('docs');
        const toggleExpansionSpy = spyOn(component, 'toggleNodeExpansion');
        const focusByKeySpy = spyOn(component, 'focusNodeButtonByKey');
        const selectSpy = spyOn(component, 'selectNode');

        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        expect(toggleExpansionSpy).toHaveBeenCalled();

        component.expandedKeys.set(new Set(['docs']));
        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        expect(toggleExpansionSpy).toHaveBeenCalledTimes(2);

        focusedKeySpy.and.returnValue('docs:reports');
        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        expect(focusByKeySpy).toHaveBeenCalledWith(component.nodeIndex().parentByKey.get('docs:reports') as string);

        focusedKeySpy.and.returnValue('docs');
        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(selectSpy).toHaveBeenCalled();
    });

    it('reconciles values for single/multiple/checkbox modes', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            reconcileValueWithCurrentOptions: (value: unknown) => unknown;
        };

        fixture.componentRef.setInput('selectionMode', 'single');
        fixture.detectChanges();
        expect(component.reconcileValueWithCurrentOptions('docs:reports')).toBe('docs:reports');
        expect(component.reconcileValueWithCurrentOptions('missing')).toBeNull();
        expect(component.reconcileValueWithCurrentOptions(['docs:reports'])).toBeNull();

        fixture.componentRef.setInput('selectionMode', 'multiple');
        fixture.detectChanges();
        expect(component.reconcileValueWithCurrentOptions(['docs:reports', 'docs:reports', 'missing']))
            .toEqual(['docs:reports']);
        expect(component.reconcileValueWithCurrentOptions('invalid')).toBeNull();

        fixture.componentRef.setInput('selectionMode', 'checkbox');
        fixture.detectChanges();
        expect(component.reconcileValueWithCurrentOptions('invalid')).toEqual({});
    });

    it('compares values with isSameValue across data types', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            isSameValue: (left: unknown, right: unknown) => boolean;
        };

        expect(component.isSameValue('a', 'a')).toBeTrue();
        expect(component.isSameValue('a', 'b')).toBeFalse();
        expect(component.isSameValue(null, null)).toBeTrue();
        expect(component.isSameValue(['a'], ['a'])).toBeTrue();
        expect(component.isSameValue(['a'], ['b'])).toBeFalse();
        expect(component.isSameValue({ a: { checked: true, partialChecked: false } }, { a: { checked: true, partialChecked: false } }))
            .toBeTrue();
        expect(component.isSameValue({ a: { checked: true, partialChecked: false } }, { a: { checked: false, partialChecked: true } }))
            .toBeFalse();
    });

    it('evaluates lazy-loading guards and error handling', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            shouldLazyLoad: (node: TreeNode) => boolean;
            loadNodeChildren: (node: TreeNode) => Promise<void>;
            lazyChildrenByKey: () => Record<string, TreeNode[]>;
            lazyLoadError: { subscribe: (callback: (event: unknown) => void) => void };
            lazyLoadErrorMessage: (node: TreeNode) => string | null;
        };

        fixture.componentRef.setInput('lazy', true);
        fixture.componentRef.setInput('loadChildren', async () => {
            throw new Error('boom');
        });
        fixture.detectChanges();

        const leafNode: TreeNode = { key: 'leaf', label: 'Leaf', leaf: true };
        const plainNode: TreeNode = { key: 'plain', label: 'Plain' };
        const emittedErrors: unknown[] = [];

        component.lazyLoadError.subscribe((event) => {
            emittedErrors.push(event);
        });

        expect(component.shouldLazyLoad({ label: 'No key' })).toBeFalse();
        expect(component.shouldLazyLoad(leafNode)).toBeFalse();
        expect(component.shouldLazyLoad(plainNode)).toBeTrue();

        const errorSpy = spyOn(console, 'error');
        await component.loadNodeChildren(plainNode);
        expect(errorSpy).toHaveBeenCalled();
        expect(component.lazyChildrenByKey()['plain']).toBeUndefined();
        expect(component.lazyLoadErrorMessage(plainNode)).toContain('No se pudieron cargar los hijos');
        expect(emittedErrors.length).toBe(1);
    });

    it('covers filter modes and custom filter fields', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            filterTree: (nodes: TreeNode[], query: string) => TreeNode[];
            getNodeFilterValue: (node: TreeNode) => string;
        };

        fixture.componentRef.setInput('filterBy', 'meta');
        fixture.detectChanges();

        const customNode = { key: 'n1', label: 'Node', meta: 'Especial' } as unknown as TreeNode;
        expect(component.getNodeFilterValue(customNode)).toBe('especial');

        fixture.componentRef.setInput('filterBy', 'label');
        fixture.detectChanges();

        fixture.componentRef.setInput('filterMode', 'strict');
        fixture.detectChanges();
        const strictResult = component.filterTree(options, 'documentos');
        expect(strictResult.length).toBe(1);

        fixture.componentRef.setInput('filterMode', 'lenient');
        fixture.detectChanges();
        const lenientResult = component.filterTree(options, 'videos');
        expect(lenientResult.length).toBe(1);
        expect(lenientResult[0]?.key).toBe('media');
    });

    it('covers additional panel keydown early-return branches', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            onPanelKeydown: (event: KeyboardEvent) => void;
            togglePanel: () => void;
            getFocusedNodeKey: () => string | null;
            focusNodeButtonByKey: (key: string) => void;
        };

        component.togglePanel();

        const focusSpy = spyOn(component, 'focusNodeButtonByKey');
        const focusedSpy = spyOn(component, 'getFocusedNodeKey').and.returnValue(null);

        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(focusSpy).not.toHaveBeenCalled();

        focusedSpy.and.returnValue('missing');
        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    it('covers toggleNodeExpansion guard and collapse branches', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            toggleNodeExpansion: (event: Event, node: TreeNode) => Promise<void>;
            isNodeExpanded: (node: TreeNode) => boolean;
            nodeCollapse: { subscribe: (cb: () => void) => void };
        };

        const collapseSpy = jasmine.createSpy();
        component.nodeCollapse.subscribe(collapseSpy);

        await component.toggleNodeExpansion(new MouseEvent('click'), { label: 'No key' });

        const docsNode = options[0] as TreeNode;
        await component.toggleNodeExpansion(new MouseEvent('click'), docsNode);
        expect(component.isNodeExpanded(docsNode)).toBeTrue();

        await component.toggleNodeExpansion(new MouseEvent('click'), docsNode);
        expect(component.isNodeExpanded(docsNode)).toBeFalse();
        expect(collapseSpy).toHaveBeenCalled();
    });

    it('covers closePanel no-op and resetFilterOnHide branch', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            closePanel: () => void;
            togglePanel: () => void;
            onFilterInput: (event: Event) => void;
            state: { filterText: () => string; isOpen: () => boolean };
        };

        component.closePanel();
        expect(component.state.isOpen()).toBeFalse();

        fixture.componentRef.setInput('filter', true);
        fixture.componentRef.setInput('resetFilterOnHide', true);
        fixture.detectChanges();

        component.togglePanel();
        component.onFilterInput({ target: { value: 'abc' } } as unknown as Event);
        expect(component.state.filterText()).toBe('abc');

        component.closePanel();
        expect(component.state.isOpen()).toBeFalse();
        expect(component.state.filterText()).toBe('');
    });

    it('covers disabled trigger and selectNode guards', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            onTriggerKeydown: (event: KeyboardEvent) => void;
            state: { isOpen: () => boolean };
            selectNode: (event: Event, node: TreeNode) => void;
            selectedKeys: () => string[];
        };

        fixture.componentRef.setInput('disabled', true);
        fixture.detectChanges();
        component.onTriggerKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(component.state.isOpen()).toBeFalse();

        component.selectNode(new MouseEvent('click'), { key: 'x', label: 'x', disabled: true });
        component.selectNode(new MouseEvent('click'), { key: 'y', label: 'y', selectable: false });
        component.selectNode(new MouseEvent('click'), { label: 'z' });
        expect(component.selectedKeys()).toEqual([]);
    });

    it('covers closed panel keydown and trigger space key', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            onPanelKeydown: (event: KeyboardEvent) => void;
            onTriggerKeydown: (event: KeyboardEvent) => void;
            togglePanel: () => void;
            state: { isOpen: () => boolean };
        };

        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(component.state.isOpen()).toBeFalse();

        const toggleSpy = spyOn(component, 'togglePanel').and.callThrough();
        component.onTriggerKeydown(new KeyboardEvent('keydown', { key: ' ' }));
        expect(toggleSpy).toHaveBeenCalled();
        expect(component.state.isOpen()).toBeTrue();
    });

    it('covers document click inside host and window alignment hooks', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            togglePanel: () => void;
            closePanel: () => void;
            onDocumentClick: (event: Event) => void;
            onWindowResize: () => void;
            onWindowScroll: () => void;
            scheduleAlignPanelPosition: () => void;
        };

        component.togglePanel();
        const closeSpy = spyOn(component, 'closePanel').and.callThrough();

        const triggerButton = fixture.nativeElement.querySelector('.p-treeselect-trigger-button') as HTMLButtonElement;
        component.onDocumentClick({ target: triggerButton } as unknown as Event);
        expect(closeSpy).not.toHaveBeenCalled();

        const alignSpy = spyOn(component, 'scheduleAlignPanelPosition');
        component.onWindowResize();
        component.onWindowScroll();
        expect(alignSpy).toHaveBeenCalledTimes(2);
    });

    it('covers multiple mode single-item clear branch', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;
        const leafNode = options[0].children?.[0] as TreeNode;

        fixture.componentRef.setInput('selectionMode', 'multiple');
        fixture.componentRef.setInput('metaKeySelection', false);
        fixture.detectChanges();

        component.selectNode(new MouseEvent('click'), leafNode);
        expect(component.selectedKeys()).toEqual([leafNode.key as string]);

        component.selectNode(new MouseEvent('click'), leafNode);
        expect(component.selectedKeys()).toEqual([]);
    });

    it('covers ArrowLeft no-parent and ArrowRight expanded-node return paths', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            togglePanel: () => void;
            expandedKeys: { set: (keys: Set<string>) => void };
            onPanelKeydown: (event: KeyboardEvent) => void;
            getFocusedNodeKey: () => string | null;
            focusNodeButtonByKey: (key: string) => void;
            toggleNodeExpansion: (event: Event, node: TreeNode) => void;
        };

        component.togglePanel();
        component.expandedKeys.set(new Set(['docs']));

        spyOn(component, 'getFocusedNodeKey').and.returnValues('docs', 'docs');
        const focusByKeySpy = spyOn(component, 'focusNodeButtonByKey');
        const toggleExpansionSpy = spyOn(component, 'toggleNodeExpansion');

        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        component.onPanelKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

        expect(focusByKeySpy).not.toHaveBeenCalled();
        expect(toggleExpansionSpy).toHaveBeenCalledTimes(1);
    });

    it('covers meta-key deselection branch in multiple mode', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance;
        const leafNode = options[0].children?.[0] as TreeNode;

        fixture.componentRef.setInput('selectionMode', 'multiple');
        fixture.componentRef.setInput('metaKeySelection', true);
        fixture.detectChanges();

        component.selectNode(new MouseEvent('click'), leafNode);
        expect(component.selectedKeys()).toEqual([leafNode.key as string]);

        component.selectNode(new MouseEvent('click', { ctrlKey: true }), leafNode);
        expect(component.selectedKeys()).toEqual([]);
    });

    it('covers shouldLazyLoad negative paths', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            shouldLazyLoad: (node: TreeNode) => boolean;
            lazyChildrenByKey: { set: (value: Record<string, TreeNode[]>) => void };
        };

        fixture.componentRef.setInput('loadChildren', null);
        fixture.detectChanges();
        expect(component.shouldLazyLoad({ key: 'k', label: 'n' })).toBeFalse();

        fixture.componentRef.setInput('loadChildren', async () => []);
        fixture.detectChanges();
        expect(component.shouldLazyLoad({ key: 'k', label: 'n', children: [{ key: 'c', label: 'c' }] })).toBeFalse();

        component.lazyChildrenByKey.set({ k: [{ key: 'x', label: 'x' }] });
        expect(component.shouldLazyLoad({ key: 'k', label: 'n' })).toBeFalse();
    });

    it('covers alignPanelPosition with missing refs and both directions', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            state: { open: () => void };
            alignPanelPosition: () => void;
            panelOpenUpwards: () => boolean;
        };

        component.alignPanelPosition();
        component.state.open();
        component.alignPanelPosition();

        const triggerSpy = spyOn(component as unknown as {
            triggerButtonRef: () => { nativeElement: { getBoundingClientRect: () => DOMRect } };
        }, 'triggerButtonRef').and.returnValue({
            nativeElement: {
                getBoundingClientRect: () => ({ top: 400, bottom: 450 } as DOMRect),
            },
        });
        const panelSpy = spyOn(component as unknown as {
            panelRef: () => { nativeElement: { getBoundingClientRect: () => DOMRect } };
        }, 'panelRef').and.returnValue({
            nativeElement: {
                getBoundingClientRect: () => ({ height: 500 } as DOMRect),
            },
        });

        const innerHeightSpy = spyOnProperty(window, 'innerHeight', 'get').and.returnValue(500);
        component.alignPanelPosition();
        expect(component.panelOpenUpwards()).toBeTrue();

        triggerSpy.and.returnValue({
            nativeElement: {
                getBoundingClientRect: () => ({ top: 100, bottom: 120 } as DOMRect),
            },
        });
        panelSpy.and.returnValue({
            nativeElement: {
                getBoundingClientRect: () => ({ height: 60 } as DOMRect),
            },
        });
        innerHeightSpy.and.returnValue(900);
        component.alignPanelPosition();
        expect(component.panelOpenUpwards()).toBeFalse();
    });

    it('covers selection and meta/checkbox helper branches', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            isMetaKeyEvent: (event: Event) => boolean;
            getCheckboxSelection: () => TreeselectCheckboxSelection;
            writeValue: (value: unknown) => void;
            selectNode: (event: Event, node: TreeNode) => void;
            getSelectedKeys: () => string[];
            selectedValueText: () => string;
            markAsTouched: () => void;
            registerOnTouched: (fn: () => void) => void;
        };

        expect(component.isMetaKeyEvent(new Event('click'))).toBeFalse();
        expect(component.isMetaKeyEvent(new MouseEvent('click', { ctrlKey: true }))).toBeTrue();

        component.writeValue('invalid');
        expect(component.getCheckboxSelection()).toEqual({});
        component.writeValue(['array']);
        expect(component.getCheckboxSelection()).toEqual({});
        component.writeValue(null);
        expect(component.getCheckboxSelection()).toEqual({});

        fixture.componentRef.setInput('selectionMode', 'single');
        fixture.detectChanges();
        component.selectNode(new MouseEvent('click'), { key: 'blocked', label: 'Blocked', disabled: true });
        component.selectNode(new MouseEvent('click'), { key: 'not-selectable', label: 'No', selectable: false });
        component.selectNode(new MouseEvent('click'), { label: 'No key' });
        expect(component.getSelectedKeys()).toEqual([]);
        expect(component.selectedValueText()).toContain('Selecciona');

        const touchSpy = jasmine.createSpy();
        component.registerOnTouched(touchSpy);
        component.markAsTouched();
        expect(touchSpy).toHaveBeenCalled();
    });

    it('covers invalid state, host click and escape behavior', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            state: { isOpen: () => boolean; open: () => void };
            onDocumentClick: (event: Event) => void;
            onEscapePressed: () => void;
            closePanel: () => void;
            isInvalid: () => boolean;
            ngControl?: { invalid: boolean; touched: boolean; dirty: boolean };
        };

        Object.defineProperty(component, 'ngControl', {
            value: { invalid: true, touched: false, dirty: false },
            configurable: true,
        });
        expect(component.isInvalid()).toBeFalse();

        Object.defineProperty(component, 'ngControl', {
            value: { invalid: true, touched: true, dirty: false },
            configurable: true,
        });
        expect(component.isInvalid()).toBeTrue();

        component.state.open();
        const closeSpy = spyOn(component, 'closePanel').and.callThrough();

        component.onDocumentClick(new MouseEvent('click', { bubbles: true }));
        expect(closeSpy).toHaveBeenCalled();

        component.state.open();
        component.onEscapePressed();
        expect(closeSpy).toHaveBeenCalledTimes(2);
    });

    it('covers helper methods for selection and indexing', async () => {
        const fixture = await createComponent();
        const component = fixture.componentInstance as unknown as {
            getSelectedKeys: () => string[];
            getCheckboxSelection: () => TreeselectCheckboxSelection;
            getMultipleSelection: () => string[];
            createNodeIndex: (nodes: TreeNode[]) => { nodeLabelByKey: Map<string, string> };
            nodeIndex: () => TreeNodeIndex;
            writeValue: (value: unknown) => void;
        };

        expect(collectDescendantKeys(component.nodeIndex(), 'docs').sort()).toEqual(['docs:contracts', 'docs:reports'].sort());

        fixture.componentRef.setInput('selectionMode', 'single');
        fixture.detectChanges();
        component.writeValue('docs:reports');
        expect(component.getSelectedKeys()).toEqual(['docs:reports']);

        fixture.componentRef.setInput('selectionMode', 'multiple');
        fixture.detectChanges();
        component.writeValue(['docs:reports', 'docs:contracts']);
        expect(component.getMultipleSelection().length).toBe(2);

        fixture.componentRef.setInput('selectionMode', 'checkbox');
        fixture.detectChanges();
        component.writeValue({ docs: { checked: true, partialChecked: false } });
        expect(component.getCheckboxSelection()['docs']?.checked).toBeTrue();

        const index = component.createNodeIndex([{ key: undefined, label: 'No key' } as unknown as TreeNode]);
        expect(index.nodeLabelByKey.size).toBe(0);
    });
});
