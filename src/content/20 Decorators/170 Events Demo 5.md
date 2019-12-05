```js
  //...
  @State() isOpen = false;

  @Listen('openModal')
  openModalWindow() {
    this.isOpen = true;
  }
  //...
```
