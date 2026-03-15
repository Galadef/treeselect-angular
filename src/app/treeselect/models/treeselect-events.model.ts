import { TreeNode } from './tree-node.model';

export interface TreeselectNodeEvent {
    originalEvent: Event;
    node: TreeNode;
}

export interface TreeselectFilterEvent {
    originalEvent: Event;
    query: string;
    filteredNodes: TreeNode[];
}

export interface TreeselectLazyLoadErrorEvent {
    node: TreeNode;
    error: unknown;
}
