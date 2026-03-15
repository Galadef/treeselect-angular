import {
    collectDescendantKeys,
    createTreeNodeIndex,
    findNodeByKey,
    getSelectedNodeLabel,
    hasDuplicateKeys,
    normalizeTreeNodes,
} from './tree-node.utils';
import { TreeNode } from '../models/tree-node.model';

describe('tree-node.utils', () => {
    it('normalizes keys recursively when missing', () => {
        const nodes: TreeNode[] = [
            {
                label: 'Root',
                children: [
                    { label: 'Child A', leaf: true },
                    { key: 'custom-child', label: 'Child B', leaf: true },
                ],
            },
        ];

        const normalized = normalizeTreeNodes(nodes);

        expect(normalized[0]?.key).toBe('root-0');
        expect(normalized[0]?.children?.[0]?.key).toBe('root-0-0');
        expect(normalized[0]?.children?.[1]?.key).toBe('custom-child');
    });

    it('resolves selected label from deep hierarchy', () => {
        const nodes: TreeNode[] = [
            {
                key: 'docs',
                label: 'Documentos',
                children: [
                    {
                        key: 'docs:reports',
                        label: 'Reportes',
                        children: [{ key: 'docs:reports:q1', label: 'Q1', leaf: true }],
                    },
                ],
            },
        ];

        expect(getSelectedNodeLabel(nodes, 'docs:reports:q1')).toBe('Q1');
        expect(getSelectedNodeLabel(nodes, 'missing')).toBeNull();
        expect(getSelectedNodeLabel(nodes, null)).toBeNull();
    });

    it('detects duplicate keys in nested structures', () => {
        const nodes: TreeNode[] = [
            {
                key: 'a',
                label: 'A',
                children: [{ key: 'b', label: 'B', leaf: true }],
            },
            {
                key: 'c',
                label: 'C',
                children: [{ key: 'b', label: 'B2', leaf: true }],
            },
        ];

        expect(hasDuplicateKeys(nodes)).toBeTrue();
    });

    it('handles deep trees without key collisions', () => {
        const deepTree = buildDeepTree(50);
        const normalized = normalizeTreeNodes([deepTree]);

        const lastKey = collectDeepestKey(normalized[0]!);

        expect(lastKey).toBeTruthy();
        expect(hasDuplicateKeys(normalized)).toBeFalse();
        expect(getSelectedNodeLabel(normalized, lastKey)).toContain('Nivel 50');
    });

    it('creates index, resolves descendants and finds nodes by key', () => {
        const nodes: TreeNode[] = [
            {
                key: 'docs',
                label: 'Documentos',
                children: [
                    { key: 'docs:reports', label: 'Reportes', leaf: true },
                    { key: 'docs:contracts', label: 'Contratos', leaf: true },
                ],
            },
        ];

        const index = createTreeNodeIndex(nodes);

        expect(index.nodeLabelByKey.get('docs')).toBe('Documentos');
        expect(collectDescendantKeys(index, 'docs').sort()).toEqual(['docs:contracts', 'docs:reports'].sort());
        expect(findNodeByKey(nodes, 'docs:reports')?.label).toBe('Reportes');
        expect(findNodeByKey(nodes, 'missing')).toBeNull();
    });
});

function buildDeepTree(depth: number): TreeNode {
    let node: TreeNode = { label: `Nivel ${depth}`, leaf: true };

    for (let current = depth - 1; current >= 1; current--) {
        node = {
            label: `Nivel ${current}`,
            children: [node],
        };
    }

    return node;
}

function collectDeepestKey(node: TreeNode): string {
    if (!node.children?.length) {
        return node.key ?? '';
    }

    return collectDeepestKey(node.children[0]!);
}
