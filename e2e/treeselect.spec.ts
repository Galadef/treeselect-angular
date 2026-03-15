import { expect, test } from '@playwright/test';

test.describe.serial('TreeSelect e2e serial', () => {
    let page: import('@playwright/test').Page;
    let context: import('@playwright/test').BrowserContext;

    test.beforeAll(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();
    });

    test.afterAll(async () => {
        await context.close();
    });

    test('muestra el shell inicial de TreeSelect', async () => {
        await page.goto('/');

        await expect(page.getByRole('heading', { name: 'TreeSelect Angular 19' })).toBeVisible();
        await expect(page.getByRole('combobox').first()).toBeVisible();
    });

    test('visual regression del shell principal', async () => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto('/');

        await expect(page).toHaveScreenshot('treeselect-shell-top.png', {
            clip: { x: 0, y: 0, width: 1280, height: 760 },
            maxDiffPixelRatio: 0.02,
        });
    });

    test('permite abrir y cerrar con teclado (Enter y Escape)', async () => {
        await page.goto('/');

        const firstCombobox = page.getByRole('combobox').first();
        await firstCombobox.focus();
        await page.keyboard.press('Enter');

        await expect(page.getByRole('tree').first()).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(page.locator('.treeselect__panel')).toHaveCount(0);
    });

    test('permite expandir y colapsar con flechas derecha e izquierda', async () => {
        await page.goto('/');

        const firstCombobox = page.getByRole('combobox').first();
        await firstCombobox.focus();
        await page.keyboard.press('Enter');

        const rootNode = page.getByRole('button', { name: 'Documentos' }).first();
        await rootNode.focus();

        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('button', { name: 'Contratos' }).first()).toBeVisible();

        await page.keyboard.press('ArrowLeft');
        await expect(page.getByRole('button', { name: 'Contratos' })).toHaveCount(0);
    });

    test('selecciona en modo single y permite limpiar', async () => {
        await page.goto('/');

        const singleSection = page
            .locator('.demo-grid > section')
            .filter({ has: page.getByRole('heading', { name: 'Single' }) })
            .first();
        const singleCombobox = singleSection.getByRole('combobox').first();

        await singleCombobox.click();
        await page.getByRole('button', { name: 'Documentos' }).first().click();

        await expect(singleSection.locator('.selection')).toContainText('docs');

        await singleCombobox.click();
        await singleSection.getByRole('button', { name: 'Limpiar' }).click();
        await expect(singleSection.locator('.selection')).toContainText('sin selección');
    });

    test('filtra y muestra estado vacío custom en template', async () => {
        await page.goto('/');

        const templateSection = page
            .locator('.demo-grid > section')
            .filter({ has: page.getByRole('heading', { name: 'Templates custom' }) })
            .first();

        await templateSection.getByRole('combobox').first().click();
        await templateSection.getByRole('textbox').fill('zzz-no-result');

        await expect(templateSection.getByText('Sin resultados para "zzz-no-result"')).toBeVisible();
    });

    test('muestra y permite seleccionar en ejemplo virtual scroll', async () => {
        await page.goto('/');

        const virtualSection = page
            .locator('.demo-grid > section')
            .filter({ has: page.getByRole('heading', { name: 'Virtual scroll (2k nodos)' }) })
            .first();

        await virtualSection.getByRole('combobox').first().click();
        await virtualSection.getByRole('textbox').fill('Nodo 1500');
        await page.getByRole('button', { name: 'Nodo 1500' }).click();

        await expect(virtualSection.locator('.selection')).toContainText('virtual:1500');
    });

    test('carga nodos lazy al expandir y permite seleccionar', async () => {
        await page.goto('/');

        const lazySection = page
            .locator('.demo-grid > section')
            .filter({ has: page.getByRole('heading', { name: 'Lazy loading' }) })
            .first();

        await lazySection.getByRole('combobox').first().click();
        const lazyPanel = lazySection.locator('.treeselect__panel');
        await lazyPanel.getByRole('button', { name: 'Expandir' }).first().click();
        await expect(lazyPanel.getByRole('button', { name: 'Lazy Docs / A' })).toBeVisible();
        await lazyPanel.getByRole('button', { name: 'Lazy Docs / A' }).click();

        await expect(lazySection.locator('.selection')).toContainText('lazy:docs:a');
    });

    test('checkbox: muestra parciales y completos al seleccionar hijos', async () => {
        await page.goto('/');

        const checkboxSection = page
            .locator('.demo-grid > section')
            .filter({ has: page.getByRole('heading', { name: 'Checkbox' }) })
            .first();

        await checkboxSection.getByRole('combobox').first().click();

        const panel = checkboxSection.locator('.treeselect__panel');
        await panel.getByRole('button', { name: 'Expandir' }).first().click();

        const contratosCheckbox = panel.getByRole('button', { name: 'Seleccionar Contratos' });
        const reportesCheckbox = panel.getByRole('button', { name: 'Seleccionar Reportes' });

        await contratosCheckbox.click();
        await expect(checkboxSection.locator('.selection').first()).toContainText('Nodos activos: 2');

        await reportesCheckbox.click();
        await expect(checkboxSection.locator('.selection').first()).toContainText('Nodos activos: 3');
    });

    test('checkbox: respeta nivel de inicio y no muestra checkbox en nivel raíz', async () => {
        await page.goto('/');

        const checkboxSection = page
            .locator('.demo-grid > section')
            .filter({ has: page.getByRole('heading', { name: 'Checkbox' }) })
            .first();

        await checkboxSection.getByRole('combobox').first().click();
        const panel = checkboxSection.locator('.treeselect__panel');

        const docsRow = panel.getByRole('button', { name: 'Documentos' }).locator('xpath=ancestor::div[contains(@class,"treeselect__node-content")][1]');
        await expect(docsRow.locator('.treeselect__checkbox')).toHaveCount(0);

        await panel.getByRole('button', { name: 'Expandir' }).first().click();
        const contractsRow = panel.getByRole('button', { name: 'Contratos' }).locator('xpath=ancestor::div[contains(@class,"treeselect__node-content")][1]');
        await expect(contractsRow.locator('.treeselect__checkbox')).toHaveCount(1);
    });

    test('checkbox profundo: permite seleccionar desde nivel raíz hasta nivel 4', async () => {
        await page.goto('/');

        const deepSection = page
            .locator('.demo-grid > section')
            .filter({ has: page.getByRole('heading', { name: 'Checkbox profundo (nivel 1 a 4)' }) })
            .first();

        await deepSection.getByRole('combobox').first().click();
        const panel = deepSection.locator('.treeselect__panel');

        await panel.getByRole('button', { name: 'Seleccionar Organización' }).click();
        await expect(deepSection.locator('.selection').first()).toContainText('Nodos activos (profundo):');

        const orgExpandButton = panel.getByRole('button', { name: 'Organización' })
            .locator('xpath=preceding-sibling::button[@aria-label="Expandir"][1]');
        await orgExpandButton.click();

        const itExpandButton = panel.getByRole('button', { name: 'IT' })
            .locator('xpath=preceding-sibling::button[@aria-label="Expandir"][1]');
        await itExpandButton.click();

        const platformExpandButton = panel.getByRole('button', { name: 'Platform' })
            .locator('xpath=preceding-sibling::button[@aria-label="Expandir"][1]');
        await platformExpandButton.click();

        const levelFourCheckbox = panel.getByRole('button', { name: /Seleccionar DevOps|Deseleccionar DevOps/ });
        await expect(levelFourCheckbox).toBeVisible();
        await levelFourCheckbox.click();

        await expect(deepSection.locator('.selection').first()).not.toContainText('Nodos activos (profundo): 0');
    });

});
