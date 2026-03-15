import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TreeselectComponent } from './treeselect/components/treeselect/treeselect.component';
import { TreeNode } from './treeselect/models/tree-node.model';
import { TreeselectCheckboxSelection } from './treeselect/models/treeselect-selection.model';
import { TreeselectOpsService } from './ops/treeselect-ops.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, TreeselectComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly ops = inject(TreeselectOpsService);

  protected readonly options: TreeNode[] = [
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
      children: [
        { key: 'media:images', label: 'Imágenes', leaf: true },
        { key: 'media:videos', label: 'Videos', leaf: true },
      ],
    },
  ];

  protected readonly virtualOptions: TreeNode[] = Array.from({ length: 2000 }, (_, index) => ({
    key: `virtual:${index + 1}`,
    label: `Nodo ${index + 1}`,
    leaf: true,
  }));

  protected readonly lazyOptions: TreeNode[] = [
    { key: 'lazy:docs', label: 'Lazy Docs' },
    { key: 'lazy:media', label: 'Lazy Media' },
    { key: 'lazy:ops', label: 'Lazy Ops' },
  ];

  protected readonly checkboxDeepOptions: TreeNode[] = [
    {
      key: 'org',
      label: 'Organización',
      children: [
        {
          key: 'org:it',
          label: 'IT',
          children: [
            {
              key: 'org:it:platform',
              label: 'Platform',
              children: [
                { key: 'org:it:platform:devops', label: 'DevOps', leaf: true },
                { key: 'org:it:platform:sre', label: 'SRE', leaf: true },
              ],
            },
            {
              key: 'org:it:security',
              label: 'Security',
              children: [{ key: 'org:it:security:appsec', label: 'AppSec', leaf: true }],
            },
          ],
        },
        {
          key: 'org:finance',
          label: 'Finance',
          children: [{ key: 'org:finance:payroll', label: 'Payroll', leaf: true }],
        },
      ],
    },
    {
      key: 'projects',
      label: 'Proyectos',
      children: [
        {
          key: 'projects:alpha',
          label: 'Alpha',
          children: [
            { key: 'projects:alpha:frontend', label: 'Frontend', leaf: true },
            {
              key: 'projects:alpha:backend',
              label: 'Backend',
              children: [
                { key: 'projects:alpha:backend:api', label: 'API', leaf: true },
                { key: 'projects:alpha:backend:jobs', label: 'Jobs', leaf: true },
              ],
            },
          ],
        },
      ],
    },
  ];

  protected readonly virtualValue = signal<string | null>(null);
  protected readonly lazyValue = signal<string | null>(null);

  protected readonly selectedKey = signal<string | null>(null);
  protected readonly selectedKeys = signal<string[]>([]);
  protected readonly checkedNodes = signal<TreeselectCheckboxSelection>({});
  protected readonly deepCheckedNodes = signal<TreeselectCheckboxSelection>({});
  protected readonly rolloutSeed = signal('local-demo-user');
  protected readonly treeselectRolloutPercent = signal(100);
  protected readonly treeselectFeatureEnabled = computed(() =>
    this.isEnabledByRollout(this.rolloutSeed(), this.treeselectRolloutPercent()),
  );
  protected ngModelValue: string | null = null;

  protected readonly reactiveForm = new FormGroup({
    tree: new FormControl<string | null>(null, { validators: [Validators.required] }),
  });

  protected onSelectionChange(nextValue: unknown): void {
    this.selectedKey.set(typeof nextValue === 'string' ? nextValue : null);
  }

  protected onMultipleSelectionChange(nextValue: unknown): void {
    this.selectedKeys.set(Array.isArray(nextValue) ? nextValue.filter((item): item is string => typeof item === 'string') : []);
  }

  protected onCheckboxSelectionChange(nextValue: unknown): void {
    if (!nextValue || Array.isArray(nextValue) || typeof nextValue === 'string') {
      this.checkedNodes.set({});
      return;
    }

    this.checkedNodes.set(nextValue as TreeselectCheckboxSelection);
  }

  protected onDeepCheckboxSelectionChange(nextValue: unknown): void {
    if (!nextValue || Array.isArray(nextValue) || typeof nextValue === 'string') {
      this.deepCheckedNodes.set({});
      return;
    }

    this.deepCheckedNodes.set(nextValue as TreeselectCheckboxSelection);
  }

  protected onVirtualSelectionChange(nextValue: unknown): void {
    this.virtualValue.set(typeof nextValue === 'string' ? nextValue : null);
  }

  protected onLazySelectionChange(nextValue: unknown): void {
    this.lazyValue.set(typeof nextValue === 'string' ? nextValue : null);
  }

  protected async loadLazyChildren(node: TreeNode): Promise<TreeNode[]> {
    await new Promise((resolve) => setTimeout(resolve, 250));

    return [
      { key: `${node.key}:a`, label: `${node.label} / A`, leaf: true },
      { key: `${node.key}:b`, label: `${node.label} / B`, leaf: true },
      { key: `${node.key}:c`, label: `${node.label} / C`, leaf: true },
    ];
  }

  protected checkedNodeCount(): number {
    return Object.keys(this.checkedNodes()).length;
  }

  protected deepCheckedNodeCount(): number {
    return Object.keys(this.deepCheckedNodes()).length;
  }

  protected markReactiveTouched(): void {
    this.reactiveForm.markAllAsTouched();
  }

  protected get reactiveInvalid(): boolean {
    const control = this.reactiveForm.controls.tree;
    return control.invalid && (control.touched || control.dirty);
  }

  protected onTreeselectShow(instanceId: string): void {
    this.ops.trackPanelOpened(instanceId);
  }

  protected onTreeselectHide(instanceId: string): void {
    this.ops.trackPanelClosed(instanceId);
  }

  protected onTreeselectClear(instanceId: string): void {
    this.ops.trackClear(instanceId);
  }

  private isEnabledByRollout(seed: string, percent: number): boolean {
    const boundedPercent = Math.max(0, Math.min(100, percent));
    const bucket = this.hashToBucket(seed);
    return bucket < boundedPercent;
  }

  private hashToBucket(seed: string): number {
    let hash = 0;

    for (let index = 0; index < seed.length; index++) {
      hash = (hash << 5) - hash + seed.charCodeAt(index);
      hash |= 0;
    }

    return Math.abs(hash) % 100;
  }
}
