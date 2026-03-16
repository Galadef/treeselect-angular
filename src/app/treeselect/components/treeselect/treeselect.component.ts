import {
    AfterContentInit,
    ChangeDetectionStrategy,
    Component,
    ContentChildren,
    computed,
    ElementRef,
    effect,
    EventEmitter,
    HostListener,
    Output,
    input,
    output,
    signal,
    TemplateRef,
    viewChild,
    inject,
    isDevMode,
    OnDestroy,
    QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import {
    TreeselectDisplayMode,
    TreeselectCheckboxSelection,
    TreeselectMultipleSelection,
    TreeselectSelectionMode,
    TreeselectValue,
} from '../../models/treeselect-selection.model';
import { TreeNode } from '../../models/tree-node.model';
import {
    TreeselectFilterEvent,
    TreeselectLazyLoadErrorEvent,
    TreeselectNodeEvent,
} from '../../models/treeselect-events.model';
import {
    TreeselectEmptyTemplateContext,
    TreeselectNodeTemplateContext,
    TreeselectValueTemplateContext,
} from '../../models/treeselect-templates.model';
import {
    collectDescendantKeys,
    createTreeNodeIndex,
    findNodeByKey,
    getSelectedNodeLabel,
    hasDuplicateKeys,
    normalizeTreeNodes,
} from '../../utils/tree-node.utils';
import { TreeselectStateService } from '../../services/treeselect-state.service';
import { TreeselectPrimeTemplateDirective } from './treeselect-prime-template.directive';

let nextTreeselectInstanceId = 0;

@Component({
    selector: 'app-treeselect',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './treeselect.component.html',
    styleUrl: './treeselect.component.scss',
    providers: [TreeselectStateService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeselectComponent implements AfterContentInit, ControlValueAccessor, OnDestroy {
    private readonly host = inject(ElementRef<HTMLElement>);
    private readonly ngControl = inject(NgControl, { self: true, optional: true });

    constructor() {
        if (this.ngControl) {
            this.ngControl.valueAccessor = this;
        }
    }

    readonly options = input<TreeNode[]>([]);
    readonly selectionMode = input<TreeselectSelectionMode>('single');
    readonly display = input<TreeselectDisplayMode>('comma');
    readonly metaKeySelection = input(false);
    readonly placeholder = input('Selecciona');
    readonly showClear = input(false);
    readonly showSelectAll = input(false);
    readonly selectAllLabel = input('Seleccionar todos');
    readonly variant = input<'filled' | 'outlined'>('outlined');

    readonly filter = input(false);
    readonly filterBy = input('label');
    readonly filterMode = input<'lenient' | 'strict'>('lenient');
    readonly filterPlaceholder = input('Buscar');
    readonly filterInputAutoFocus = input(true);
    readonly resetFilterOnHide = input(true);
    readonly filterLocale = input<string | undefined>(undefined);

    readonly virtualScroll = input(false);
    readonly virtualScrollItemSize = input(36);
    readonly virtualScrollOptions = input<{ scrollHeight?: string } | null>(null);
    readonly scrollHeight = input('400px');
    readonly lazy = input(false);
    readonly loadChildren = input<((node: TreeNode) => Promise<TreeNode[]>) | null>(null);

    readonly loading = input(false);
    readonly loadingMode = input<'mask' | 'icon'>('icon');

    readonly propagateSelectionDown = input(true);
    readonly propagateSelectionUp = input(true);
    readonly checkboxSelectionStartLevel = input(1);

    readonly disabled = input(false);
    readonly tabindex = input(0);
    readonly inputId = input<string | null>(null);
    readonly ariaLabel = input<string | null>(null);
    readonly ariaLabelledBy = input<string | null>(null);
    readonly autofocus = input(false);

    readonly rootClass = input('');
    readonly panelClass = input('');
    readonly labelClass = input('');

    readonly rootStyle = input<Record<string, string> | null>(null);
    readonly panelStyle = input<Record<string, string> | null>(null);
    readonly labelStyle = input<Record<string, string> | null>(null);
    readonly emptyMessage = input('Sin resultados');

    // Compat no-op inputs to keep PrimeNG templates compiling without changes.
    readonly appendTo = input<unknown>(null);
    readonly overlayOptions = input<unknown>(null);
    readonly showTransitionOptions = input<string | undefined>(undefined);
    readonly hideTransitionOptions = input<string | undefined>(undefined);

    readonly valueTemplate = input<TemplateRef<TreeselectValueTemplateContext> | null>(null);
    readonly headerTemplate = input<TemplateRef<undefined> | null>(null);
    readonly footerTemplate = input<TemplateRef<undefined> | null>(null);
    readonly emptyTemplate = input<TemplateRef<TreeselectEmptyTemplateContext> | null>(null);

    readonly triggerIconTemplate = input<TemplateRef<undefined> | null>(null);
    readonly clearIconTemplate = input<TemplateRef<undefined> | null>(null);
    readonly togglerIconTemplate = input<TemplateRef<undefined> | null>(null);
    readonly checkboxIconTemplate = input<TemplateRef<TreeselectNodeTemplateContext> | null>(null);
    readonly loadingIconTemplate = input<TemplateRef<undefined> | null>(null);
    readonly filterIconTemplate = input<TemplateRef<undefined> | null>(null);
    readonly closeIconTemplate = input<TemplateRef<undefined> | null>(null);
    readonly itemTogglerIconTemplate = input<TemplateRef<unknown> | null>(null);
    readonly itemCheckboxIconTemplate = input<TemplateRef<TreeselectNodeTemplateContext> | null>(null);
    readonly itemLoadingIconTemplate = input<TemplateRef<unknown> | null>(null);

    readonly value = input<TreeselectValue>(null);

    // eslint-disable-next-line @angular-eslint/no-input-rename
    readonly containerStyleClassCompat = input('', { alias: 'containerStyleClass' });
    // eslint-disable-next-line @angular-eslint/no-input-rename
    readonly panelStyleClassCompat = input('', { alias: 'panelStyleClass' });
    // eslint-disable-next-line @angular-eslint/no-input-rename
    readonly labelStyleClassCompat = input('', { alias: 'labelStyleClass' });
    // eslint-disable-next-line @angular-eslint/no-input-rename
    readonly containerStyleCompat = input<Record<string, string> | null>(null, { alias: 'containerStyle' });

    readonly valueChange = output<TreeselectValue>();
    readonly nodeSelect = output<TreeselectNodeEvent>();
    readonly nodeUnselect = output<TreeselectNodeEvent>();
    readonly nodeExpand = output<TreeselectNodeEvent>();
    readonly nodeCollapse = output<TreeselectNodeEvent>();
    readonly filterApplied = output<TreeselectFilterEvent>();
    readonly panelShown = output<void>();
    readonly panelHidden = output<void>();
    readonly cleared = output<void>();
    readonly lazyLoadError = output<TreeselectLazyLoadErrorEvent>();

    // eslint-disable-next-line @angular-eslint/no-output-rename, @angular-eslint/no-output-on-prefix
    @Output('onNodeSelect') readonly onNodeSelect = new EventEmitter<TreeselectNodeEvent>();
    // eslint-disable-next-line @angular-eslint/no-output-rename, @angular-eslint/no-output-on-prefix
    @Output('onNodeUnselect') readonly onNodeUnselect = new EventEmitter<TreeselectNodeEvent>();
    // eslint-disable-next-line @angular-eslint/no-output-rename, @angular-eslint/no-output-on-prefix
    @Output('onNodeExpand') readonly onNodeExpand = new EventEmitter<TreeselectNodeEvent>();
    // eslint-disable-next-line @angular-eslint/no-output-rename, @angular-eslint/no-output-on-prefix
    @Output('onNodeCollapse') readonly onNodeCollapse = new EventEmitter<TreeselectNodeEvent>();
    // eslint-disable-next-line @angular-eslint/no-output-rename, @angular-eslint/no-output-on-prefix
    @Output('onFilter') readonly onFilter = new EventEmitter<unknown>();
    // eslint-disable-next-line @angular-eslint/no-output-rename, @angular-eslint/no-output-on-prefix
    @Output('onShow') readonly onShow = new EventEmitter<void>();
    // eslint-disable-next-line @angular-eslint/no-output-rename, @angular-eslint/no-output-on-prefix
    @Output('onHide') readonly onHide = new EventEmitter<void>();
    // eslint-disable-next-line @angular-eslint/no-output-rename, @angular-eslint/no-output-on-prefix
    @Output('onClear') readonly onClear = new EventEmitter<void>();

    @ContentChildren(TreeselectPrimeTemplateDirective)
    projectedTemplates?: QueryList<TreeselectPrimeTemplateDirective>;

    readonly state = inject(TreeselectStateService);
    readonly triggerButtonRef = viewChild<ElementRef<HTMLButtonElement>>('triggerButton');
    readonly filterInputRef = viewChild<ElementRef<HTMLInputElement>>('filterInput');
    readonly panelRef = viewChild<ElementRef<HTMLElement>>('panelElement');
    readonly virtualViewportRef = viewChild<ElementRef<HTMLElement>>('virtualViewport');
    readonly expandedKeys = signal<Set<string>>(new Set<string>());
    readonly lazyChildrenByKey = signal<Record<string, TreeNode[]>>({});
    readonly loadingKeys = signal<Set<string>>(new Set<string>());
    readonly scrollTop = signal(0);
    readonly panelOpenUpwards = signal(false);
    readonly lazyLoadErrors = signal<Record<string, string>>({});
    readonly normalizedOptions = computed(() => {
        const mergedOptions = this.mergeLazyChildren(this.options(), this.lazyChildrenByKey());
        return normalizeTreeNodes(mergedOptions);
    });
    readonly isDisabled = computed(() => this.cvaDisabled() ?? this.disabled());
    readonly mergedRootClass = computed(() => this.joinClassValues(this.rootClass(), this.containerStyleClassCompat()));
    readonly mergedPanelClass = computed(() => this.joinClassValues(this.panelClass(), this.panelStyleClassCompat()));
    readonly mergedLabelClass = computed(() => this.joinClassValues(this.labelClass(), this.labelStyleClassCompat()));
    readonly mergedRootStyle = computed(() => this.mergeStyles(this.rootStyle(), this.containerStyleCompat()));
    readonly panelScrollHeight = computed(() => this.virtualScrollOptions()?.scrollHeight ?? this.scrollHeight());
    readonly isFilledVariant = computed(() => this.variant() === 'filled');
    readonly selectableCheckboxKeys = computed(() => this.collectSelectableCheckboxKeys(this.normalizedOptions()));
    readonly allSelectableChecked = computed(() => {
        const selectableKeys = this.selectableCheckboxKeys();

        return selectableKeys.length > 0 && selectableKeys.every((key) => this.getCheckboxSelection()[key]?.checked);
    });
    readonly resolvedValueTemplate = computed(() => this.valueTemplate() ?? this.templateByType()['value'] ?? null);
    readonly resolvedHeaderTemplate = computed(() => this.headerTemplate() ?? this.templateByType()['header'] ?? null);
    readonly resolvedFooterTemplate = computed(() => this.footerTemplate() ?? this.templateByType()['footer'] ?? null);
    readonly resolvedEmptyTemplate = computed(() => this.emptyTemplate() ?? this.templateByType()['empty'] ?? null);
    readonly resolvedClearIconTemplate = computed(
        () => this.clearIconTemplate() ?? this.templateByType()['clearicon'] ?? null,
    );
    readonly resolvedFilterIconTemplate = computed(
        () => this.filterIconTemplate() ?? this.templateByType()['filtericon'] ?? null,
    );
    readonly resolvedCloseIconTemplate = computed(
        () => this.closeIconTemplate() ?? this.templateByType()['closeicon'] ?? null,
    );
    readonly resolvedPanelTriggerIconTemplate = computed(
        () => this.togglerIconTemplate() ?? this.templateByType()['triggericon'] ?? null,
    );
    readonly resolvedItemTogglerIconTemplate = computed(
        () => this.itemTogglerIconTemplate() ?? this.templateByType()['itemtogglericon'] ?? null,
    );
    readonly resolvedItemCheckboxIconTemplate = computed(
        () => this.itemCheckboxIconTemplate() ?? this.checkboxIconTemplate() ?? this.templateByType()['itemcheckboxicon'] ?? null,
    );
    readonly resolvedItemLoadingIconTemplate = computed(
        () => this.itemLoadingIconTemplate() ?? this.loadingIconTemplate() ?? this.templateByType()['itemloadingicon'] ?? null,
    );
    readonly selectedKeys = computed(() => this.getSelectedKeys());
    readonly panelId = `treeselect-${++nextTreeselectInstanceId}`;
    readonly treeId = `${this.panelId}-tree`;
    readonly popupId = `${this.panelId}-popup`;
    readonly nodeIndex = computed(() => this.createNodeIndex(this.normalizedOptions()));
    readonly validNodeKeys = computed(() => new Set(this.nodeIndex().nodeLabelByKey.keys()));
    readonly visibleFlatNodes = computed(() => this.flattenVisibleNodes(this.filteredNodes()));
    readonly virtualStartIndex = computed(() => {
        if (!this.virtualScroll()) {
            return 0;
        }

        return Math.max(0, Math.floor(this.scrollTop() / this.virtualScrollItemSize()));
    });
    readonly virtualPageSize = computed(() => {
        if (!this.virtualScroll()) {
            return this.visibleFlatNodes().length;
        }

        const viewportHeight = this.virtualViewportRef()?.nativeElement.clientHeight ?? 320;
        return Math.max(1, Math.ceil(viewportHeight / this.virtualScrollItemSize()) + 6);
    });
    readonly virtualEndIndex = computed(() => Math.min(
        this.visibleFlatNodes().length,
        this.virtualStartIndex() + this.virtualPageSize(),
    ));
    readonly virtualVisibleNodes = computed(() => this.visibleFlatNodes().slice(
        this.virtualStartIndex(),
        this.virtualEndIndex(),
    ));
    readonly virtualOffset = computed(() => this.virtualStartIndex() * this.virtualScrollItemSize());
    readonly virtualTotalHeight = computed(() => this.visibleFlatNodes().length * this.virtualScrollItemSize());

    readonly selectedLabels = computed(() => {
        const labels: string[] = [];

        for (const key of this.selectedKeys()) {
            const label = this.nodeIndex().nodeLabelByKey.get(key);

            if (label) {
                labels.push(label);
            }
        }

        return labels;
    });

    readonly selectedCommaLabel = computed(() => this.selectedLabels().join(', '));

    readonly selectedLabel = computed(() => {
        if (this.selectedLabels().length === 0) {
            return this.placeholder();
        }

        if (this.selectionMode() === 'single') {
            const currentValue = this.internalValue();
            const selected = typeof currentValue === 'string' ? currentValue : null;
            return getSelectedNodeLabel(this.normalizedOptions(), selected) ?? this.placeholder();
        }

        return this.selectedCommaLabel();
    });

    readonly filteredNodes = computed(() => {
        if (!this.filter() || !this.state.filterText().trim()) {
            return this.normalizedOptions();
        }

        const query = this.state.filterText().trim().toLowerCase();

        return this.filterTree(this.normalizedOptions(), query);
    });

    private readonly internalValue = signal<TreeselectValue>(null);
    private readonly cvaDisabled = signal<boolean | null>(null);
    private readonly duplicateKeyWarningShown = signal(false);
    private readonly templateByType = signal<Record<string, TemplateRef<unknown>>>({});
    private alignFrameId: number | null = null;
    private onCvaChange: (value: TreeselectValue) => void = () => undefined;
    private onCvaTouched: () => void = () => undefined;
    private readonly syncInputValue = effect(() => {
        this.applyValue(this.value(), false);
    });
    private readonly warnDuplicateKeys = effect(() => {
        const hasDuplicates = hasDuplicateKeys(this.normalizedOptions());

        if (!hasDuplicates) {
            this.duplicateKeyWarningShown.set(false);
            return;
        }

        if (isDevMode() && !this.duplicateKeyWarningShown()) {
            console.warn('[TreeSelect] Se detectaron keys duplicadas en options.');
            this.duplicateKeyWarningShown.set(true);
        }
    });
    private readonly reconcileExpandedState = effect(() => {
        const validKeys = this.validNodeKeys();
        const currentExpanded = this.expandedKeys();
        const nextExpanded = new Set(Array.from(currentExpanded).filter((key) => validKeys.has(key)));

        if (nextExpanded.size !== currentExpanded.size) {
            this.expandedKeys.set(nextExpanded);
        }
    });
    private readonly reconcileValueState = effect(() => {
        const currentValue = this.internalValue();
        const reconciledValue = this.reconcileValueWithCurrentOptions(currentValue);

        if (!this.isSameValue(currentValue, reconciledValue)) {
            this.applyValue(reconciledValue, true);
        }
    });

    writeValue(value: TreeselectValue): void {
        this.applyValue(value, false);
    }

    ngAfterContentInit(): void {
        this.refreshProjectedTemplateMap();

        this.projectedTemplates?.changes.subscribe(() => {
            this.refreshProjectedTemplateMap();
        });
    }

    ngOnDestroy(): void {
        this.cancelScheduledAlign();
    }

    registerOnChange(fn: (value: TreeselectValue) => void): void {
        this.onCvaChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onCvaTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.cvaDisabled.set(isDisabled);
    }

    togglePanel(): void {
        if (this.isDisabled()) {
            return;
        }

        this.state.toggle();

        if (this.state.isOpen()) {
            this.panelShown.emit();
            this.onShow.emit();
            this.scheduleAlignPanelPosition();

            if (this.filter() && this.filterInputAutoFocus()) {
                queueMicrotask(() => {
                    this.filterInputRef()?.nativeElement.focus();
                });
            } else {
                queueMicrotask(() => {
                    this.focusFirstNodeButton();
                });
            }

            return;
        }

        this.panelHidden.emit();
        this.onHide.emit();
    }

    closePanel(): void {
        if (this.state.isOpen()) {
            this.state.close(this.resetFilterOnHide());
            this.panelHidden.emit();
            this.onHide.emit();
            this.onCvaTouched();

            queueMicrotask(() => {
                this.triggerButtonRef()?.nativeElement.focus();
            });
        }
    }

    clear(event: Event): void {
        event.stopPropagation();

        this.applyValue(null, true);
        this.expandedKeys.set(new Set<string>());
        this.cleared.emit();
        this.onClear.emit();
    }

    async toggleNodeExpansion(event: Event, node: TreeNode): Promise<void> {
        event.stopPropagation();

        if (!node.key) {
            return;
        }

        const nextExpanded = new Set(this.expandedKeys());

        if (nextExpanded.has(node.key)) {
            nextExpanded.delete(node.key);
            this.expandedKeys.set(nextExpanded);
            this.nodeCollapse.emit({ originalEvent: event, node });
            this.onNodeCollapse.emit({ originalEvent: event, node });
            this.scheduleAlignPanelPosition();
            return;
        }

        if (this.lazy() && this.shouldLazyLoad(node)) {
            await this.loadNodeChildren(node);
        }

        nextExpanded.add(node.key);
        this.expandedKeys.set(nextExpanded);
        this.nodeExpand.emit({ originalEvent: event, node });
        this.onNodeExpand.emit({ originalEvent: event, node });
        this.scheduleAlignPanelPosition();
    }

    isNodeExpanded(node: TreeNode): boolean {
        if (!node.key) {
            return false;
        }

        return this.expandedKeys().has(node.key);
    }

    selectNode(event: Event, node: TreeNode): void {
        event.stopPropagation();

        if (this.isDisabled() || node.disabled || node.selectable === false || !node.key) {
            return;
        }

        if (this.selectionMode() === 'multiple') {
            this.selectMultipleNode(event, node);
            return;
        }

        if (this.selectionMode() === 'checkbox') {
            if (!this.isCheckboxSelectableNode(node)) {
                return;
            }

            this.toggleCheckboxNode(event, node);
            return;
        }

        const isSameNode = this.internalValue() === node.key;

        if (isSameNode) {
            this.applyValue(null, true);
            this.nodeUnselect.emit({ originalEvent: event, node });
            this.onNodeUnselect.emit({ originalEvent: event, node });
            return;
        }

        this.applyValue(node.key, true);
        this.nodeSelect.emit({ originalEvent: event, node });
        this.onNodeSelect.emit({ originalEvent: event, node });
    }

    onFilterInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.state.setFilterText(target.value);
        this.scheduleAlignPanelPosition();
        this.filterApplied.emit({
            originalEvent: event,
            query: target.value,
            filteredNodes: this.filteredNodes(),
        });

        this.onFilter.emit({
            filter: target.value,
            filteredValue: this.filteredNodes(),
        });
    }

    onVirtualScroll(event: Event): void {
        const target = event.target as HTMLElement;
        this.scrollTop.set(target.scrollTop);
    }

    isSelected(node: TreeNode): boolean {
        if (!node.key) {
            return false;
        }

        if (this.selectionMode() === 'single') {
            return this.internalValue() === node.key;
        }

        if (this.selectionMode() === 'multiple') {
            return this.getMultipleSelection().includes(node.key);
        }

        return this.getCheckboxSelection()[node.key]?.checked ?? false;
    }

    isPartiallySelected(node: TreeNode): boolean {
        if (this.selectionMode() !== 'checkbox' || !node.key) {
            return false;
        }

        return this.getCheckboxSelection()[node.key]?.partialChecked ?? false;
    }

    shouldRenderCheckbox(level: number): boolean {
        return this.selectionMode() === 'checkbox' && level >= this.getCheckboxStartLevel();
    }

    hasSelectableCheckboxNodes(): boolean {
        return this.selectionMode() === 'checkbox' && this.selectableCheckboxKeys().length > 0;
    }

    isSelectAllChecked(): boolean {
        return this.allSelectableChecked();
    }

    toggleSelectAll(event: Event): void {
        event.stopPropagation();

        if (this.selectionMode() !== 'checkbox') {
            return;
        }

        this.expandedKeys.set(this.collectExpandableNodeKeys(this.normalizedOptions()));

        if (this.allSelectableChecked()) {
            this.applyValue({}, true);
            return;
        }

        const selectableKeys = this.selectableCheckboxKeys();
        const nextSelection: TreeselectCheckboxSelection = {};

        for (const key of selectableKeys) {
            nextSelection[key] = {
                checked: true,
                partialChecked: false,
            };
        }

        this.applyValue(nextSelection, true);
    }

    trackByNodeKey(index: number, node: TreeNode): string {
        return node.key ?? `${index}`;
    }

    hasValue(): boolean {
        return this.selectedKeys().length > 0;
    }

    selectedValueText(): string {
        return this.selectedCommaLabel() || this.placeholder();
    }

    valueTemplateContext(): TreeselectValueTemplateContext {
        return {
            selectedLabels: this.selectedLabels(),
            selectedValueText: this.selectedValueText(),
        };
    }

    emptyTemplateContext(): TreeselectEmptyTemplateContext {
        return {
            query: this.state.filterText(),
        };
    }

    nodeTemplateContext(node: TreeNode): TreeselectNodeTemplateContext {
        return {
            node,
            expanded: this.isNodeExpanded(node),
            selected: this.isSelected(node),
            partial: this.isPartiallySelected(node),
        };
    }

    markAsTouched(): void {
        this.onCvaTouched();
    }

    isInvalid(): boolean {
        return !!this.ngControl?.invalid && !!(this.ngControl.touched || this.ngControl.dirty);
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event): void {
        if (!this.state.isOpen()) {
            return;
        }

        const clickedInside = this.host.nativeElement.contains(event.target as Node);

        if (!clickedInside) {
            this.closePanel();
        }
    }

    @HostListener('document:keydown.escape')
    onEscapePressed(): void {
        this.closePanel();
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        this.scheduleAlignPanelPosition();
    }

    @HostListener('window:scroll')
    onWindowScroll(): void {
        this.scheduleAlignPanelPosition();
    }

    onTriggerKeydown(event: KeyboardEvent): void {
        if (this.isDisabled()) {
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.togglePanel();
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();

            if (!this.state.isOpen()) {
                this.togglePanel();
                return;
            }

            this.focusFirstNodeButton();
        }
    }

    onPanelKeydown(event: KeyboardEvent): void {
        if (!this.state.isOpen()) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            this.closePanel();
            return;
        }

        if (event.key === 'Tab') {
            this.closePanel();
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.focusNodeButtonByOffset(1);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.focusNodeButtonByOffset(-1);
            return;
        }

        if (event.key === 'ArrowRight') {
            const key = this.getFocusedNodeKey();

            if (!key) {
                return;
            }

            const node = findNodeByKey(this.normalizedOptions(), key);

            if (!node?.children?.length || this.isNodeExpanded(node)) {
                return;
            }

            event.preventDefault();
            this.toggleNodeExpansion(event, node);
            return;
        }

        if (event.key === 'ArrowLeft') {
            const key = this.getFocusedNodeKey();

            if (!key) {
                return;
            }

            const node = findNodeByKey(this.normalizedOptions(), key);

            if (node && node.children?.length && this.isNodeExpanded(node)) {
                event.preventDefault();
                this.toggleNodeExpansion(event, node);
                return;
            }

            const parentKey = this.nodeIndex().parentByKey.get(key);

            if (!parentKey) {
                return;
            }

            event.preventDefault();
            this.focusNodeButtonByKey(parentKey);
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            const key = this.getFocusedNodeKey();

            if (!key) {
                return;
            }

            const node = findNodeByKey(this.normalizedOptions(), key);

            if (!node) {
                return;
            }

            event.preventDefault();
            this.selectNode(event, node);
        }
    }

    private applyValue(nextValue: TreeselectValue, emitChanges: boolean): void {
        this.internalValue.set(nextValue);

        if (!emitChanges) {
            return;
        }

        this.valueChange.emit(nextValue);
        this.onCvaChange(nextValue);
        this.onCvaTouched();
    }

    private reconcileValueWithCurrentOptions(currentValue: TreeselectValue): TreeselectValue {
        const validKeys = this.validNodeKeys();

        if (this.selectionMode() === 'single') {
            if (typeof currentValue !== 'string') {
                return null;
            }

            return validKeys.has(currentValue) ? currentValue : null;
        }

        if (this.selectionMode() === 'multiple') {
            if (Array.isArray(currentValue)) {
                const uniqueValues = Array.from(new Set(currentValue));
                return uniqueValues.filter((key): key is string => typeof key === 'string' && validKeys.has(key));
            }

            if (!this.isMultipleSelectionMap(currentValue)) {
                return null;
            }

            const nextSelection: Record<string, boolean> = {};

            for (const [key, selected] of Object.entries(currentValue)) {
                if (selected && validKeys.has(key)) {
                    nextSelection[key] = true;
                }
            }

            return nextSelection;
        }

        if (!currentValue || Array.isArray(currentValue) || typeof currentValue === 'string') {
            return {};
        }

        const nextSelection: TreeselectCheckboxSelection = {};

        for (const [key, state] of Object.entries(currentValue)) {
            if (!validKeys.has(key)) {
                continue;
            }

            nextSelection[key] = {
                checked: !!state.checked,
                partialChecked: !!state.partialChecked,
            };
        }

        return nextSelection;
    }

    private isSameValue(left: TreeselectValue, right: TreeselectValue): boolean {
        if (left === right) {
            return true;
        }

        if (left === null || right === null) {
            return left === right;
        }

        if (typeof left === 'string' || typeof right === 'string') {
            return left === right;
        }

        if (Array.isArray(left) || Array.isArray(right)) {
            if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
                return false;
            }

            return left.every((value, index) => value === right[index]);
        }

        const leftEntries = Object.entries(left).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
        const rightEntries = Object.entries(right).sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

        if (leftEntries.length !== rightEntries.length) {
            return false;
        }

        return leftEntries.every(([leftKey, leftState], index) => {
            const [rightKey, rightState] = rightEntries[index] ?? [];

            return (
                leftKey === rightKey
                && leftState.checked === rightState?.checked
                && leftState.partialChecked === rightState?.partialChecked
            );
        });
    }

    private filterTree(nodes: TreeNode[], query: string): TreeNode[] {
        const filteredNodes: (TreeNode | null)[] = nodes
            .map((node) => {
                const ownText = this.getNodeFilterValue(node);
                const ownMatch = ownText.includes(query);
                const children = node.children ? this.filterTree(node.children, query) : [];
                const hasChildrenMatch = children.length > 0;

                if (this.filterMode() === 'strict') {
                    if (!ownMatch) {
                        return null;
                    }

                    return {
                        ...node,
                        children: children.length > 0 ? children : undefined,
                    };
                }

                if (!ownMatch && !hasChildrenMatch) {
                    return null;
                }

                return {
                    ...node,
                    children: hasChildrenMatch ? children : node.children,
                };
            })
            .filter((node) => node !== null);

        return filteredNodes.filter((node): node is TreeNode => node !== null);
    }

    private shouldLazyLoad(node: TreeNode): boolean {
        if (!node.key || node.leaf === true || !this.loadChildren()) {
            return false;
        }

        if (node.children && node.children.length > 0) {
            return false;
        }

        if (this.lazyChildrenByKey()[node.key]) {
            return false;
        }

        return true;
    }

    private async loadNodeChildren(node: TreeNode): Promise<void> {
        const loader = this.loadChildren();

        if (!loader || !node.key) {
            return;
        }

        const nodeKey = node.key;

        const loading = new Set(this.loadingKeys());
        loading.add(nodeKey);
        this.loadingKeys.set(loading);

        try {
            const children = await loader(node);
            this.lazyLoadErrors.update((current) => {
                const next = { ...current };
                delete next[nodeKey];
                return next;
            });
            this.lazyChildrenByKey.set({
                ...this.lazyChildrenByKey(),
                [nodeKey]: children,
            });
        } catch (error) {
            this.lazyLoadErrors.update((current) => ({
                ...current,
                [nodeKey]: 'No se pudieron cargar los hijos. Puedes reintentar.',
            }));

            if (isDevMode()) {
                console.error('[TreeSelect] Error cargando hijos lazy.', error);
            }

            this.lazyLoadError.emit({ node, error });
        } finally {
            const nextLoading = new Set(this.loadingKeys());
            nextLoading.delete(nodeKey);
            this.loadingKeys.set(nextLoading);
            this.scheduleAlignPanelPosition();
        }
    }

    private mergeLazyChildren(nodes: TreeNode[], lazyChildrenByKey: Record<string, TreeNode[]>): TreeNode[] {
        return nodes.map((node) => {
            const mappedChildren = node.children ? this.mergeLazyChildren(node.children, lazyChildrenByKey) : undefined;
            const lazyChildren = node.key ? lazyChildrenByKey[node.key] : undefined;

            if (lazyChildren) {
                return {
                    ...node,
                    children: this.mergeLazyChildren(lazyChildren, lazyChildrenByKey),
                };
            }

            return {
                ...node,
                children: mappedChildren,
            };
        });
    }

    private flattenVisibleNodes(nodes: TreeNode[], level = 1): { node: TreeNode; level: number }[] {
        const rows: { node: TreeNode; level: number }[] = [];

        for (const node of nodes) {
            rows.push({ node, level });

            if (node.children?.length && this.isNodeExpanded(node)) {
                rows.push(...this.flattenVisibleNodes(node.children, level + 1));
            }
        }

        return rows;
    }

    private getNodeFilterValue(node: TreeNode): string {
        if (this.filterBy() !== 'label') {
            const customField = (node as unknown as Record<string, unknown>)[this.filterBy()];
            return String(customField ?? '').toLowerCase();
        }

        return node.label.toLowerCase();
    }

    private collectSelectableCheckboxKeys(nodes: TreeNode[]): string[] {
        const keys: string[] = [];

        for (const node of nodes) {
            if (this.isSelectableCheckboxNode(node)) {
                keys.push(node.key as string);
            }

            if (node.children?.length) {
                keys.push(...this.collectSelectableCheckboxKeys(node.children));
            }
        }

        return keys;
    }

    private collectExpandableNodeKeys(nodes: TreeNode[]): Set<string> {
        const expanded = new Set<string>();

        for (const node of nodes) {
            if (node.key && (node.children?.length || (this.lazy() && node.leaf !== true))) {
                expanded.add(node.key);
            }

            if (node.children?.length) {
                const childExpanded = this.collectExpandableNodeKeys(node.children);

                for (const key of childExpanded) {
                    expanded.add(key);
                }
            }
        }

        return expanded;
    }

    private isSelectableCheckboxNode(node: TreeNode): boolean {
        return !!node.key
            && !node.disabled
            && node.selectable !== false
            && this.isCheckboxSelectableNode(node);
    }

    private alignPanelPosition(): void {
        if (!this.state.isOpen()) {
            return;
        }

        const triggerRect = this.triggerButtonRef()?.nativeElement.getBoundingClientRect();
        const panelRect = this.panelRef()?.nativeElement.getBoundingClientRect();

        if (!triggerRect || !panelRect) {
            return;
        }

        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        const preferTop = spaceBelow < panelRect.height && spaceAbove > spaceBelow;

        this.panelOpenUpwards.set(preferTop);
    }

    private selectMultipleNode(event: Event, node: TreeNode): void {
        if (!node.key) {
            return;
        }

        const current = new Set(this.getMultipleSelection());
        const key = node.key;
        const isSelected = current.has(key);

        if (!this.metaKeySelection()) {
            if (isSelected) {
                current.delete(key);
                this.nodeUnselect.emit({ originalEvent: event, node });
                this.onNodeUnselect.emit({ originalEvent: event, node });
            } else {
                current.add(key);
                this.nodeSelect.emit({ originalEvent: event, node });
                this.onNodeSelect.emit({ originalEvent: event, node });
            }
        } else {
            if (this.isMetaKeyEvent(event)) {
                if (isSelected) {
                    current.delete(key);
                    this.nodeUnselect.emit({ originalEvent: event, node });
                    this.onNodeUnselect.emit({ originalEvent: event, node });
                } else {
                    current.add(key);
                    this.nodeSelect.emit({ originalEvent: event, node });
                    this.onNodeSelect.emit({ originalEvent: event, node });
                }
            } else {
                if (isSelected && current.size === 1) {
                    current.clear();
                    this.nodeUnselect.emit({ originalEvent: event, node });
                    this.onNodeUnselect.emit({ originalEvent: event, node });
                } else {
                    current.clear();
                    current.add(key);
                    this.nodeSelect.emit({ originalEvent: event, node });
                    this.onNodeSelect.emit({ originalEvent: event, node });
                }
            }
        }

        this.applyValue(this.toMultipleValue(current), true);
    }

    private toggleCheckboxNode(event: Event, node: TreeNode): void {
        if (!node.key) {
            return;
        }

        const checkboxSelection = { ...this.getCheckboxSelection() };
        const shouldCheck = !checkboxSelection[node.key]?.checked;

        const targetKeys = this.propagateSelectionDown()
            ? [node.key, ...collectDescendantKeys(this.nodeIndex(), node.key)]
            : [node.key];

        for (const key of targetKeys) {
            checkboxSelection[key] = {
                checked: shouldCheck,
                partialChecked: false,
            };
        }

        if (!shouldCheck) {
            for (const key of targetKeys) {
                delete checkboxSelection[key];
            }
        }

        if (this.propagateSelectionUp()) {
            this.recalculateAncestors(node.key, checkboxSelection);
        }

        this.applyValue(checkboxSelection, true);

        if (shouldCheck) {
            this.nodeSelect.emit({ originalEvent: event, node });
            this.onNodeSelect.emit({ originalEvent: event, node });
            return;
        }

        this.nodeUnselect.emit({ originalEvent: event, node });
        this.onNodeUnselect.emit({ originalEvent: event, node });
    }

    private recalculateAncestors(key: string, selection: TreeselectCheckboxSelection): void {
        const parentByKey = this.nodeIndex().parentByKey;
        const childrenByKey = this.nodeIndex().childrenByKey;
        let currentParent = parentByKey.get(key) ?? null;

        while (currentParent) {
            const childKeys = childrenByKey.get(currentParent) ?? [];
            const childStates = childKeys.map((childKey) => selection[childKey]);

            const allChecked = childStates.length > 0 && childStates.every((state) => state?.checked);
            const someChecked = childStates.some((state) => state?.checked || state?.partialChecked);

            if (allChecked) {
                selection[currentParent] = { checked: true, partialChecked: false };
            } else if (someChecked) {
                selection[currentParent] = { checked: false, partialChecked: true };
            } else {
                delete selection[currentParent];
            }

            currentParent = parentByKey.get(currentParent) ?? null;
        }
    }

    private getSelectedKeys(): string[] {
        if (this.selectionMode() === 'single') {
            const currentValue = this.internalValue();
            return typeof currentValue === 'string' ? [currentValue] : [];
        }

        if (this.selectionMode() === 'multiple') {
            return this.getMultipleSelection();
        }

        return Object.entries(this.getCheckboxSelection())
            .filter(([, value]) => value.checked)
            .map(([key]) => key);
    }

    private getMultipleSelection(): string[] {
        const currentValue = this.internalValue();

        if (Array.isArray(currentValue)) {
            return currentValue;
        }

        if (this.isMultipleSelectionMap(currentValue)) {
            return Object.entries(currentValue)
                .filter(([, selected]) => selected)
                .map(([key]) => key);
        }

        return [];
    }

    private toMultipleValue(selectedKeys: Set<string>): TreeselectMultipleSelection {
        if (this.shouldUseArrayForMultipleValue()) {
            return Array.from(selectedKeys);
        }

        const asRecord: Record<string, boolean> = {};

        for (const key of selectedKeys) {
            asRecord[key] = true;
        }

        return asRecord;
    }

    private shouldUseArrayForMultipleValue(): boolean {
        return Array.isArray(this.internalValue());
    }

    private isMultipleSelectionMap(value: unknown): value is Record<string, boolean> {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return false;
        }

        return Object.values(value).every((entry) => typeof entry === 'boolean');
    }

    private isCheckboxSelectionMap(value: unknown): value is TreeselectCheckboxSelection {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return false;
        }

        return Object.values(value).every((entry) => (
            !!entry
            && typeof entry === 'object'
            && 'checked' in entry
            && 'partialChecked' in entry
        ));
    }

    private getCheckboxSelection(): TreeselectCheckboxSelection {
        const currentValue = this.internalValue();

        if (!this.isCheckboxSelectionMap(currentValue)) {
            return {};
        }

        return currentValue;
    }

    private isMetaKeyEvent(event: Event): boolean {
        if (!(event instanceof MouseEvent)) {
            return false;
        }

        return event.metaKey || event.ctrlKey;
    }

    private createNodeIndex(nodes: TreeNode[]) {
        return createTreeNodeIndex(nodes);
    }

    private refreshProjectedTemplateMap(): void {
        const mapped: Record<string, TemplateRef<unknown>> = {};

        for (const projected of this.projectedTemplates ?? []) {
            const key = projected.type?.trim().toLowerCase();

            if (!key) {
                continue;
            }

            mapped[key] = projected.template;
        }

        this.templateByType.set(mapped);
    }

    private joinClassValues(...values: (string | null | undefined)[]): string {
        return values
            .filter((value): value is string => !!value && value.trim().length > 0)
            .join(' ')
            .trim();
    }

    private mergeStyles(
        base: Record<string, string> | null,
        compat: Record<string, string> | null,
    ): Record<string, string> | null {
        if (!base && !compat) {
            return null;
        }

        return {
            ...(compat ?? {}),
            ...(base ?? {}),
        };
    }

    private getFocusableNodeButtons(): HTMLButtonElement[] {
        return Array.from(
            this.host.nativeElement.querySelectorAll('.p-treenode-label:not(:disabled)'),
        ) as HTMLButtonElement[];
    }

    private focusFirstNodeButton(): void {
        const firstNode = this.getFocusableNodeButtons().at(0);
        firstNode?.focus();
    }

    private focusNodeButtonByOffset(offset: number): void {
        const buttons = this.getFocusableNodeButtons();

        if (buttons.length === 0) {
            return;
        }

        const activeElement = document.activeElement as HTMLButtonElement | null;
        const currentIndex = buttons.findIndex((button) => button === activeElement);
        const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;
        const nextIndex = Math.min(buttons.length - 1, Math.max(0, safeCurrentIndex + offset));

        buttons[nextIndex]?.focus();
    }

    private focusNodeButtonByKey(nodeKey: string): void {
        const selector = `.p-treenode-label[data-node-key="${CSS.escape(nodeKey)}"]`;
        const button = this.host.nativeElement.querySelector(selector) as HTMLButtonElement | null;
        button?.focus();
    }

    private getFocusedNodeKey(): string | null {
        const activeElement = document.activeElement;

        if (!(activeElement instanceof HTMLButtonElement)) {
            return null;
        }

        return activeElement.dataset['nodeKey'] ?? null;
    }

    lazyLoadErrorMessage(node: TreeNode): string | null {
        if (!node.key) {
            return null;
        }

        return this.lazyLoadErrors()[node.key] ?? null;
    }

    private isCheckboxSelectableNode(node: TreeNode): boolean {
        if (!node.key) {
            return false;
        }

        const nodeLevel = this.getNodeLevel(node.key);
        return nodeLevel >= this.getCheckboxStartLevel();
    }

    private getCheckboxStartLevel(): number {
        const requestedLevel = Number(this.checkboxSelectionStartLevel());

        if (!Number.isFinite(requestedLevel)) {
            return 1;
        }

        return Math.max(1, Math.floor(requestedLevel));
    }

    private getNodeLevel(key: string): number {
        let level = 1;
        const parentByKey = this.nodeIndex().parentByKey;
        let cursor = parentByKey.get(key) ?? null;

        while (cursor) {
            level += 1;
            cursor = parentByKey.get(cursor) ?? null;
        }

        return level;
    }

    private scheduleAlignPanelPosition(): void {
        if (!this.state.isOpen() || this.alignFrameId !== null) {
            return;
        }

        this.alignFrameId = window.requestAnimationFrame(() => {
            this.alignFrameId = null;
            this.alignPanelPosition();
        });
    }

    private cancelScheduledAlign(): void {
        if (this.alignFrameId === null) {
            return;
        }

        window.cancelAnimationFrame(this.alignFrameId);
        this.alignFrameId = null;
    }
}
