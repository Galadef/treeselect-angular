import { TreeNode } from './tree-node.model';

export interface TreeselectValueTemplateContext {
    selectedLabels: string[];
    selectedValueText: string;
}

export interface TreeselectNodeTemplateContext {
    node: TreeNode;
    expanded: boolean;
    selected: boolean;
    partial: boolean;
}

export interface TreeselectEmptyTemplateContext {
    query: string;
}