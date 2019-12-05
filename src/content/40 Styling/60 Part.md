```jsx
render() {
  return (<div>
    <button part="trigger">Click Me</button>
  </div>);
}
```
```css
/* Outer CSS allowed through the Shadow DOM */
custom-element::part(trigger) {
  color: dodgerblue;
}
```

_* Implemented in Firefox/Chrome, not in Spec_
