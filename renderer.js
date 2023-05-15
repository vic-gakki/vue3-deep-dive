function renderer(vnode, container){
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


const vnode = {
  tag: 'div',
  props: {
    onClick: () => alert('hello')
  },
  children: 'click me',
}

renderer(vnode, document.body)