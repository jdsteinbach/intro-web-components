```js
  //...
  @Event() openModal!: EventEmitter;

  private triggerClick() {
    this.openModal.emit();
  }
  //...
```
