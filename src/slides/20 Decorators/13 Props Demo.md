```js
import { Component, h, Prop } from '@stencil/core';

@Component({
  tag: 'say-hello'
})
export class SayHello {
  @Prop() name: string;

  render() {
    return <p>Hello, World! I'm {this.name}.</p>;
  }
}
```
