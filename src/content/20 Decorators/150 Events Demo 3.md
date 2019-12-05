```js
  //...
  render() {
    return (
      <button onClick={() => this.triggerClick()}>
        <slot />
      </button>
    );
  }
}
```
