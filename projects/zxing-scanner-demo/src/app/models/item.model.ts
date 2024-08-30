export class Item {
  private _isEnabled: boolean = false;

  constructor(
    public name: string,
    isEnabled: boolean,
    private confirm: (item: Item, value: boolean) => Promise<boolean>
  ) {
    this._isEnabled = isEnabled;
  }

  isEnabled(value?: boolean): boolean | void {
    if (value === undefined) {
      return this._isEnabled;
    } else if (value !== this._isEnabled && this.confirm) {
      this.confirm(this, value).then((confirmed) => {
        if (confirmed) {
          this._isEnabled = value;
        }
      });
    }
  }
}
