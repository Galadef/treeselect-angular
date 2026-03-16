import { Directive, inject, Input, TemplateRef } from '@angular/core';

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: 'ng-template[pTemplate]',
    standalone: true,
})
export class TreeselectPrimeTemplateDirective {
    @Input('pTemplate') type = '';

    readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}
