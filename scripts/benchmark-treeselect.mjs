import { performance } from 'node:perf_hooks';

const scenarios = [1000, 5000, 10000];

for (const size of scenarios) {
    const nodes = generateNodes(size);

    const normalizeMs = measure(() => normalizeTreeNodes(nodes));
    const filterMs = measure(() => filterNodes(nodes, 'nodo 9'));
    const flattenMs = measure(() => flattenNodes(nodes));

    const result = {
        size,
        normalizeMs: round(normalizeMs),
        filterMs: round(filterMs),
        flattenMs: round(flattenMs),
        totalMs: round(normalizeMs + filterMs + flattenMs),
    };

    console.info('[TreeselectBenchmark]', result);
}

function measure(task) {
    const start = performance.now();
    task();
    return performance.now() - start;
}

function round(value) {
    return Number(value.toFixed(2));
}

function generateNodes(size) {
    return Array.from({ length: size }, (_, index) => ({
        key: `node:${index + 1}`,
        label: `Nodo ${index + 1}`,
        leaf: true,
    }));
}

function normalizeTreeNodes(nodes, parentPath = 'root') {
    return nodes.map((node, index) => {
        const key = node.key ?? `${parentPath}-${index}`;

        return {
            ...node,
            key,
            children: node.children ? normalizeTreeNodes(node.children, key) : undefined,
        };
    });
}

function filterNodes(nodes, query) {
    const q = query.toLowerCase();
    return nodes.filter((node) => node.label.toLowerCase().includes(q));
}

function flattenNodes(nodes, level = 1) {
    const rows = [];

    for (const node of nodes) {
        rows.push({ node, level });

        if (node.children?.length) {
            rows.push(...flattenNodes(node.children, level + 1));
        }
    }

    return rows;
}
