import { Directive, ElementRef, Input, OnInit } from '@angular/core';
declare var $: any;

@Directive({
  selector: '[appBootstrapSwitch]'
})
export class BootstrapSwitchDirective implements OnInit {

  @Input() checked: boolean;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    $(this.el.nativeElement).bootstrapSwitch('state', this.checked);

    // You can also listen to change events and handle them in your Angular component
    $(this.el.nativeElement).on('switchChange.bootstrapSwitch', (event, state) => {
      console.log('Switch state changed to:', state);
    });
  }
}
