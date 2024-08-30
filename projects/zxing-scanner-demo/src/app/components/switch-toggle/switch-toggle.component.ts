import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Item } from '../../models/item.model';

@Component({
  selector: 'app-switch-toggle',
  templateUrl: './switch-toggle.component.html',
  styleUrls: ['./switch-toggle.component.css']
})
export class SwitchToggleComponent {

  @Output() toggleValue = new EventEmitter<any>();

  config = {
    value: false,
    name: '',
    disabled: false,
    height: 18,
    width: 55,
    margin: 3,
    fontSize: 3,
    speed: 300,
    color: {
      checked: '#56C128',
      unchecked: '#dcdcdc',
    },
    switchColor: {
      checked: '#ffff',
      unchecked: 'crimson',
    },
    labels: {
      unchecked: 'ON',
      checked: 'OFF',
    },
    checkedLabel: '',
    uncheckedLabel: '',
    fontColor: {
      checked: '#fafafa',
      unchecked: '#ffffff',
    },
    textAlign: 'left',
  };


  getToggleValue(){
    this.toggleValue.emit(this.config.value);
  }
}
