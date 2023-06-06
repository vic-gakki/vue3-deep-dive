import { renderer } from "./renderer-design.js"
const {ref} = VueReactivity
const MyComponent = {
  name: 'MyComponent',
  setup(){
    const count = ref(0)
    return {
      count
    }
  },
  render(){
    return {
      type: 'div',
      children: [
        {
          type: 'p',
          children: `${this.count.value}`
        }
      ]
    }
  }
}

const compVnode = {
  type: MyComponent
}
renderer.render(compVnode, document.getElementById('app'))