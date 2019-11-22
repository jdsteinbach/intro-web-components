import { initialize } from 'reveal.js'
import { initHighlightingOnLoad } from 'highlight.js'

initialize({
  controls: true,
  progress: true,
  history: true,
  center: true,
  width: 800,
  height: 600,
  transition: 'fade'
});


initHighlightingOnLoad()

{
  const codepenSrc = 'https://production-assets.codepen.io/assets/embed/ei.js'
  let s = document.createElement('script')
  s.src = codepenSrc
  s.setAttribute('async', true)
  document.body.appendChild(s)
}
