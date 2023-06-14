const State = {
  initial: 0,
  tagStart: 1,
  tagName: 2,
  text: 3,
  tagEnd: 4,
  tagEndName: 5,
}

const isAlpha = char => {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
}


const tokenize = str => {
  const chars = []
  const tokens = []
  let currentState = State.initial
  let char = ''
  while(str){
    char = str[0]
    switch(currentState){
      case State.initial:
        if(char === '<'){
          currentState = State.tagStart
        }else if(isAlpha(char)){
          chars.push(char)
          currentState = State.text
        }
        break;
      case State.tagStart:
        if(isAlpha(char)){
          chars.push(char)
          currentState = State.tagName
        }else if(char === '/'){
          currentState = State.tagEnd
        }
        break;
      case State.tagName:
        if(isAlpha(char)){
          chars.push(char)
        }else if(char === '>'){
          currentState = State.initial
          tokens.push({
            type: 'tag',
            name: chars.join('')
          })
          chars.length = 0
        }
        break;
      case State.text:
        if(isAlpha(char)){
          chars.push(char)
        }else if(char === '<'){
          currentState = State.tagStart
          tokens.push({
            type: 'text',
            content: chars.join('')
          })
          chars.length = 0
        }
        break;
      case State.tagEnd:
        if(isAlpha(char)){
          chars.push(char)
          currentState = State.tagEndName
        }
        break;
      case State.tagEndName:
        if(isAlpha(char)){
          chars.push(char)
        }else if(char === '>'){
          currentState = State.initial
          tokens.push({
            type: 'tagEnd',
            name: chars.join('')
          })
          chars.length = 0
        }
        break;
      default:
        console.warn(`unknown state: ${currentState}`)
    }
    str = str.slice(1)
  }
  return tokens
}

const str = '<p>Vue</p>'
const res = tokenize(str)
console.log(res)