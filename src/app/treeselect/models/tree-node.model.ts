export interface TreeNode {
    key?: string;
    label: string;
    data?: unknown;
    children?: TreeNode[];
    leaf?: boolean;
    expanded?: boolean;
    disabled?: boolean;
    selectable?: boolean;
    partialSelected?: boolean;
    icon?: string;
}
