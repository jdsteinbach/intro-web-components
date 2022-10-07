```js
  //...
  render() {
    const modalClasses = {
      modal: true,
      'modal--open': this.isOpen
    };

    return (
      <section class={modalClasses}>
        <slot />
      </section>
    );
  }
}
```
