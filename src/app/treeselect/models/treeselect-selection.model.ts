export type TreeselectSelectionMode = 'single' | 'multiple' | 'checkbox';

export type TreeselectDisplayMode = 'comma' | 'chip';

export interface TreeselectCheckboxState {
    checked: boolean;
    partialChecked: boolean;
}

export type TreeselectMultipleSelection = string[] | Record<string, boolean>;

export type TreeselectCheckboxSelection = Record<string, TreeselectCheckboxState>;

export type TreeselectValue = string | TreeselectMultipleSelection | TreeselectCheckboxSelection | null;
