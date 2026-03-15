import { TreeNode } from '../models/tree-node.model';

export interface TreeNodeIndex {
    nodeLabelByKey: Map<string, string>;
    parentByKey: Map<string, string>;
    childrenByKey: Map<string, string[]>;
}

export function normalizeTreeNodes(nodes: TreeNode[], parentPath = 'root'): TreeNode[] {
    return nodes.map((node, index) => {
        const key = node.key ?? `${parentPath}-${index}`;

        return {
            ...node,
            key,
            children: node.children ? normalizeTreeNodes(node.children, key) : undefined,
        };
    });
}

export function getSelectedNodeLabel(nodes: TreeNode[], selectedKey: string | null): string | null {
    if (!selectedKey) {
        return null;
    }

    for (const node of nodes) {
        if (node.key === selectedKey) {
            return node.label;
        }

        if (node.children) {
            const childLabel = getSelectedNodeLabel(node.children, selectedKey);
            if (childLabel) {
                return childLabel;
            }
        }
    }

    return null;
}

export function hasDuplicateKeys(nodes: TreeNode[], seen = new Set<string>()): boolean {
    for (const node of nodes) {
        if (!node.key) {
            continue;
        }

        if (seen.has(node.key)) {
            return true;
        }

        seen.add(node.key);

        if (node.children && hasDuplicateKeys(node.children, seen)) {
            return true;
        }
    }

    return false;
}

export function createTreeNodeIndex(nodes: TreeNode[]): TreeNodeIndex {
    const nodeLabelByKey = new Map<string, string>();
    const parentByKey = new Map<string, string>();
    const childrenByKey = new Map<string, string[]>();

    const traverse = (currentNodes: TreeNode[], parentKey: string | null) => {
        for (const node of currentNodes) {
            if (!node.key) {
                continue;
            }

            nodeLabelByKey.set(node.key, node.label);

            if (parentKey) {
                parentByKey.set(node.key, parentKey);
                const children = childrenByKey.get(parentKey) ?? [];
                children.push(node.key);
                childrenByKey.set(parentKey, children);
            }

            if (node.children?.length) {
                traverse(node.children, node.key);
            }
        }
    };

    traverse(nodes, null);

    return {
        nodeLabelByKey,
        parentByKey,
        childrenByKey,
    };
}

export function collectDescendantKeys(index: TreeNodeIndex, key: string): string[] {
    const result: string[] = [];
    const queue = [...(index.childrenByKey.get(key) ?? [])];
    let queueIndex = 0;

    while (queueIndex < queue.length) {
        const current = queue[queueIndex];
        queueIndex += 1;

        if (!current) {
            continue;
        }

        result.push(current);
        queue.push(...(index.childrenByKey.get(current) ?? []));
    }

    return result;
}

export function findNodeByKey(nodes: TreeNode[], key: string): TreeNode | null {
    for (const node of nodes) {
        if (node.key === key) {
            return node;
        }

        if (node.children?.length) {
            const nested = findNodeByKey(node.children, key);

            if (nested) {
                return nested;
            }
        }
    }

    return null;
}
