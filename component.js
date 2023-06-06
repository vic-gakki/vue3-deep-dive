import { renderer } from "./renderer-design.js"
const {ref} = VueReactivity
const MyComponent = {
  name: 'MyComponent',
  setup(props, {emit}){
    console.log({props})
    const count = ref(0)
    const onClick = () => {
      emit('click')
    }
    return {
      count,
      onClick
    }
  },
  render(){
    return {
      type: 'div',
      children: [
        {
          type: 'p',
          children: `${this.count.value}`,
          props: {
            onClick: () => {
              this.onClick()
            }
          }
        }
      ]
    }
  }
}

const compVnode = {
  type: MyComponent,
  props: {
    onClick(){
      console.log('click')
    }
  }
}
renderer.render(compVnode, document.getElementById('app'))