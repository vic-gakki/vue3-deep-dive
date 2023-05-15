
function renderer(vnode, container){
  if(typeof vnode.tag === 'string'){
    mountElement(vnode, container)
  }else if(typeof vnode.tag === 'function'){
    mountComponent(vnode, container)
  }
}

function mountElement(vnode, container){
  const el = document.createElement(vnode.tag)
  for(let prop in vnode.props){
    if(prop.startsWith('on')){
      el.addEventListener(prop.slice(2).toLowerCase(), vnode.props[prop])
    }else {
      el.setAttribute(prop, vnode.props[prop])
    }
  }
  if(vnode.children){
    if(typeof vnode.children === 'string'){
      el.textContent = vnode.children
    }else {
      vnode.children.forEach(child => {
        renderer(child, el)
      })
    }
  }
  container.appendChild(el)
}

function mountComponent(vnode, container){
  const subtree = vnode.tag()
  renderer(subtree, container)
}

const vnode = {
  tag: 'div',
  props: {
    onClick: () => alert('hello')
  },
  children: 'click me',
}

function HelloComponent(){
  return {
    tag: 'div',
    props: {
      onClick: () => alert('hello world')
    },
    children: 'click me',
  }
}


const component = {
  tag: HelloComponent
}

renderer(vnode, document.body)
renderer(component, document.body)