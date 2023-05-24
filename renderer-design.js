// import { effect } from "./reactive.js";
// import { ref } from "./primitive-reactive.js";

// const {effect, ref} = VueReactivity

// const renderer = (domstring, contaienr) => {
//   contaienr.innerHTML = domstring
// }

// const count = ref(0)
// effect(() => {
//   renderer(`<h1>${count.value}</h1>`, document.getElementById('app'))
// })

// count.value++



const createRenderer = (options) => {
  const {insert, setElementText, createElement} = options
  const render = (vnode, container) => {
    if(vnode){
      patch(container._vnode, vnode, container)
    }else{
      if(container._vnode){
        // unmount
        container.innerHTML = ''
        container._vnode = null
      }
    }
    container._vnode = vnode
  }
  const hydrate = (vnode, container) => {

  }
  const patch = (n1, n2, container) => {
    if(!n1){
      mountElement(n2, container)
    }
  }
  const mountElement = (vnode, container) => {
    const el = createElement(vnode.type)
    if(typeof vnode.children === 'string'){
      setElementText(el, vnode.children)
    }
    insert(el, container)
  }
  return {
    render,
    hydrate
  }
}

const renderer = createRenderer({
  createElement(tag){
    return document.createElement(tag)
  },
  setElementText(el, text){
    el.textContent = text
  },
  insert(el, parent, anchor = null){
    parent.insertBefore(el, anchor)
  }
})

const vnode = {
  type: 'h1',
  children: 'hello'
}

renderer.render(vnode, document.getElementById('app'))