```js
import { Component, h, Prop, Watch } from '@stencil/core';

@Component({
  tag: 'say-hello'
})
export class SayHello {
  @Prop() name: string;

  @Watch('name')
  updateName(newValue, oldValue) {
    // Fire name-related event, perhaps...
  }
  //...
```
