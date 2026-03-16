import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { TreeselectOpsService } from './treeselect/ops/treeselect-ops.service';

describe('AppComponent', () => {
  const opsServiceMock = {
    trackPanelOpened: jasmine.createSpy('trackPanelOpened'),
    trackPanelClosed: jasmine.createSpy('trackPanelClosed'),
    trackClear: jasmine.createSpy('trackClear'),
  };

  beforeEach(async () => {
    opsServiceMock.trackPanelOpened.calls.reset();
    opsServiceMock.trackPanelClosed.calls.reset();
    opsServiceMock.trackClear.calls.reset();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: TreeselectOpsService, useValue: opsServiceMock }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render project title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('TreeSelect Angular 19');
  });

  it('updates single and multiple selections defensively', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance as unknown as {
      onSelectionChange: (value: unknown) => void;
      onMultipleSelectionChange: (value: unknown) => void;
      selectedKey: () => string | null;
      selectedKeys: () => string[];
    };

    app.onSelectionChange('docs:reports');
    expect(app.selectedKey()).toBe('docs:reports');

    app.onSelectionChange(123);
    expect(app.selectedKey()).toBeNull();

    app.onMultipleSelectionChange(['a', 'b', 3, null]);
    expect(app.selectedKeys()).toEqual(['a', 'b']);

    app.onMultipleSelectionChange('invalid');
    expect(app.selectedKeys()).toEqual([]);
  });

  it('handles checkbox selection normalization', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance as unknown as {
      onCheckboxSelectionChange: (value: unknown) => void;
      checkedNodes: () => Record<string, unknown>;
      checkedNodeCount: () => number;
    };

    app.onCheckboxSelectionChange({
      docs: { checked: true, partialChecked: false },
    });
    expect(app.checkedNodes()['docs']).toBeTruthy();
    expect(app.checkedNodeCount()).toBe(1);

    app.onCheckboxSelectionChange('invalid');
    expect(app.checkedNodes()).toEqual({});
  });

  it('handles deep checkbox selection normalization', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance as unknown as {
      onDeepCheckboxSelectionChange: (value: unknown) => void;
      deepCheckedNodes: () => Record<string, unknown>;
      deepCheckedNodeCount: () => number;
    };

    app.onDeepCheckboxSelectionChange({
      'org:it:platform:devops': { checked: true, partialChecked: false },
    });
    expect(app.deepCheckedNodes()['org:it:platform:devops']).toBeTruthy();
    expect(app.deepCheckedNodeCount()).toBe(1);

    app.onDeepCheckboxSelectionChange([]);
    expect(app.deepCheckedNodes()).toEqual({});
  });

  it('updates virtual and lazy selected values', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance as unknown as {
      onVirtualSelectionChange: (value: unknown) => void;
      onLazySelectionChange: (value: unknown) => void;
      virtualValue: () => string | null;
      lazyValue: () => string | null;
    };

    app.onVirtualSelectionChange('virtual:1');
    app.onLazySelectionChange('lazy:docs:a');
    expect(app.virtualValue()).toBe('virtual:1');
    expect(app.lazyValue()).toBe('lazy:docs:a');

    app.onVirtualSelectionChange(false);
    app.onLazySelectionChange({});
    expect(app.virtualValue()).toBeNull();
    expect(app.lazyValue()).toBeNull();
  });

  it('marks reactive form touched and exposes invalid state', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance as unknown as {
      reactiveForm: { controls: { tree: { setValue: (value: string | null) => void } } };
      markReactiveTouched: () => void;
      reactiveInvalid: boolean;
    };

    expect(app.reactiveInvalid).toBeFalse();

    app.markReactiveTouched();
    expect(app.reactiveInvalid).toBeTrue();

    app.reactiveForm.controls.tree.setValue('docs:reports');
    expect(app.reactiveInvalid).toBeFalse();
  });

  it('loads lazy children using async loader', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance as unknown as {
      loadLazyChildren: (node: { key: string; label: string }) => Promise<{ key: string; label: string }[]>;
    };

    jasmine.clock().install();

    try {
      const promise = app.loadLazyChildren({ key: 'lazy:docs', label: 'Lazy Docs' });
      jasmine.clock().tick(251);
      const children = await promise;

      expect(children.length).toBe(3);
      expect(children[0]?.key).toBe('lazy:docs:a');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('delegates ops tracking handlers to service', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance as unknown as {
      onTreeselectShow: (instanceId: string) => void;
      onTreeselectHide: (instanceId: string) => void;
      onTreeselectClear: (instanceId: string) => void;
    };

    app.onTreeselectShow('a');
    app.onTreeselectHide('a');
    app.onTreeselectClear('a');

    expect(opsServiceMock.trackPanelOpened).toHaveBeenCalledWith('a');
    expect(opsServiceMock.trackPanelClosed).toHaveBeenCalledWith('a');
    expect(opsServiceMock.trackClear).toHaveBeenCalledWith('a');
  });

  it('evaluates rollout feature flags with bounded percentages', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance as unknown as {
      rolloutSeed: { set: (seed: string) => void };
      treeselectRolloutPercent: { set: (value: number) => void };
      treeselectFeatureEnabled: () => boolean;
      hashToBucket: (seed: string) => number;
      isEnabledByRollout: (seed: string, percent: number) => boolean;
    };

    app.rolloutSeed.set('seed-A');
    app.treeselectRolloutPercent.set(0);
    expect(app.treeselectFeatureEnabled()).toBeFalse();

    app.treeselectRolloutPercent.set(100);
    expect(app.treeselectFeatureEnabled()).toBeTrue();

    const bucket = app.hashToBucket('seed-B');
    expect(bucket).toBeGreaterThanOrEqual(0);
    expect(bucket).toBeLessThan(100);

    expect(app.isEnabledByRollout('seed-C', -10)).toBeFalse();
    expect(app.isEnabledByRollout('seed-C', 300)).toBeTrue();
  });
});
