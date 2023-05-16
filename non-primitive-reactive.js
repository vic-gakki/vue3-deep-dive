/**
 * proxy只能代理 对象 的基本语义
 * 复合操作通过基本操作组合而成
 * 
 * js中对象的分类
 *  常规对象[ordinary object]
 *    1. 对于必要内部方法，必须使用ECMA规范10.1.x节给出的定义实现
 *    2. 对于内部方法[[Call]]，必须使用ECMA规范10.2.1节给出的定义实现
 *    3. 对于内部方法[[Construct]]，必须使用ECMA规范10.2.2节给出的定义实现
 *  异质对象[exotic object]
 *    不满足以上三点要求的对象，如果proxy
 *
 * 对象的内部方法和内部槽
 *  必要的内部方法
 *    [[Get]]
 *    [[Set]]
 *    [[Delete]]
 *    [[GetPrototypeOf]]
 *    [[SetPrototypeOf]]
 *    [[IsExtensible]]
 *    [[PreventExtensions]]
 *    [[GetOwnProperty]]
 *    [[DefineOwnProperty]]
 *    [[HasProperty]]
 *    [[OwnPropertyKeys]]
 *  额外的必要内部方法
 *    [[Call]]
 *    [[Construct]]
 * 
 *  proxy用来自定义内部方法和行为的拦截函数名字（与上对应）
 *   get set deleteProperty getPrototypeOf setPrototypeOf isExtensible preventExtensions getOwnPropertyDescriptor defineProperty has ownKeys apply construct
 */