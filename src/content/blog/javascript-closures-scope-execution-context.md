---
title: 'Closures & Execution Context: JavaScript Magic Explained'
description: 'Deep dive vào Closures, Lexical Scope, và Execution Context - Tại sao JavaScript functions có "trí nhớ"?'
pubDate: 'Dec 25 2025'
heroImage: '../../assets/javascript-closures-scope-execution.png'
category: 'JavaScript'
---

## Lời mở đầu: Function có "trí nhớ"?

Bạn có bao giờ tự hỏi tại sao code này hoạt động?

```javascript
function createCounter() {
  let count = 0;
  return function() {
    return ++count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
```

`count` đã được khai báo trong `createCounter`, hàm đó đã **chạy xong** và return rồi. Vậy tại sao inner function vẫn **"nhớ"** được `count`?

Đây là **magic của Closures** - một trong những concepts quan trọng nhất và dễ hiểu sai nhất trong JavaScript. Hôm nay, chúng ta sẽ:
- Hiểu **Execution Context** và **Call Stack**
- Phân biệt **Lexical Scope** vs **Dynamic Scope**
- Master **Closures** từ góc độ kỹ sư
- Tránh **memory leaks** liên quan đến closures
- Apply vào real-world use cases

Let's dive deep! 🚀

## 1. Execution Context: Nơi Code "sống"

### 1.1. Execution Context là gì?

**Execution Context (EC)** là môi trường mà JavaScript code được **execute**. Mỗi khi một function được gọi, JavaScript engine tạo một EC mới.

**3 loại Execution Context:**

1. **Global Execution Context (GEC)**
   - Được tạo khi script chạy lần đầu
   - Chỉ có 1 GEC trong toàn bộ program
   - Tạo `window` object (browser) hoặc `global` object (Node.js)
   - `this` = `window` (strict mode: `undefined`)

2. **Function Execution Context (FEC)**
   - Tạo mỗi khi function được invoke
   - Mỗi function call = 1 FEC mới
   - Có riêng `this`, `arguments`, và local variables

3. **Eval Execution Context**
   - Tạo bởi `eval()` function
   - Ít dùng, không recommend (security issues)

### 1.2. Execution Context có gì bên trong?

Mỗi EC có **3 components chính:**

**1. Variable Environment (VE)**
- Chứa `var` declarations
- Function declarations
- Arguments object (cho functions)

**2. Lexical Environment (LE)**
- Chứa `let`, `const` declarations
- Reference đến **outer environment** (parent scope)

**3. `this` Binding**
- Value của `this` keyword

**Structure:**

```
ExecutionContext = {
  VariableEnvironment: {
    environmentRecord: {
      // var declarations, function declarations
    },
    outer: <reference to parent VE>
  },
  
  LexicalEnvironment: {
    environmentRecord: {
      // let, const declarations
    },
    outer: <reference to parent LE>
  },
  
  ThisBinding: <value of this>
}
```

### 1.3. Execution Context Lifecycle

Mỗi EC trải qua **2 phases:**

**Phase 1: Creation Phase**

1. **Tạo Variable Object/Environment**
   - Scan code để tìm declarations
   - Function declarations được **hoisted** đầy đủ
   - `var` variables được **hoisted** với value `undefined`
   - `let`/`const` vào **Temporal Dead Zone (TDZ)**

2. **Tạo Scope Chain**
   - Link đến parent scope qua `outer` reference

3. **Determine `this` value**
   - Phụ thuộc vào cách function được call

**Phase 2: Execution Phase**

- Execute code line by line
- Assign values cho variables
- Execute functions

**Example:**

```javascript
console.log(foo); // undefined (hoisted var)
console.log(bar); // ReferenceError: Cannot access 'bar' before initialization (TDZ)

var foo = 'hello';
let bar = 'world';

function greet() {
  console.log('Hi!');
}

greet(); // Hi!
```

**Creation Phase:**
```
GlobalEC = {
  VariableEnvironment: {
    foo: undefined,        // var hoisted
    greet: <function>      // function hoisted
  },
  LexicalEnvironment: {
    bar: <uninitialized>   // TDZ
  }
}
```

**Execution Phase:**
```
foo → 'hello'
bar → 'world'
greet() executes
```

## 2. Call Stack: Quản lý Execution Contexts

### 2.1. Call Stack là gì?

**Call Stack** (hay **Execution Stack**) là **LIFO (Last In, First Out) data structure** để track execution contexts.

**Hoạt động:**

```
1. Script starts → Push GlobalEC lên stack
2. Function called → Push FEC lên stack
3. Function returns → Pop FEC khỏi stack
4. Script ends → Pop GlobalEC
```

**Visual:**

```javascript
function first() {
  console.log('First');
  second();
  console.log('First again');
}

function second() {
  console.log('Second');
  third();
  console.log('Second again');
}

function third() {
  console.log('Third');
}

first();
```

**Call Stack Evolution:**

```
Step 1: Script starts
┌─────────────┐
│  GlobalEC   │
└─────────────┘

Step 2: first() called
┌─────────────┐
│  first EC   │
├─────────────┤
│  GlobalEC   │
└─────────────┘

Step 3: second() called (inside first)
┌─────────────┐
│  second EC  │
├─────────────┤
│  first EC   │
├─────────────┤
│  GlobalEC   │
└─────────────┘

Step 4: third() called (inside second)
┌─────────────┐
│  third EC   │
├─────────────┤
│  second EC  │
├─────────────┤
│  first EC   │
├─────────────┤
│  GlobalEC   │
└─────────────┘

Step 5: third() returns
┌─────────────┐
│  second EC  │
├─────────────┤
│  first EC   │
├─────────────┤
│  GlobalEC   │
└─────────────┘

Step 6: second() returns
┌─────────────┐
│  first EC   │
├─────────────┤
│  GlobalEC   │
└─────────────┘

Step 7: first() returns
┌─────────────┐
│  GlobalEC   │
└─────────────┘
```

**Output:**
```
First
Second
Third
Second again
First again
```

### 2.2. Stack Overflow

Call Stack có **giới hạn size** (browser: ~10,000 frames, Node.js: ~15,000).

**Infinite recursion:**

```javascript
function recurse() {
  recurse(); // No base case!
}

recurse(); // Uncaught RangeError: Maximum call stack size exceeded
```

**Stack khi overflow:**

```
┌─────────────┐
│  recurse EC │ ← 15000th call
├─────────────┤
│  recurse EC │
├─────────────┤
│  recurse EC │
├─────────────┤
│     ...     │
├─────────────┤
│  GlobalEC   │
└─────────────┘
Stack Overflow! 💥
```

## 3. Lexical Scope: "Nơi sinh ra" quyết định

### 3.1. Lexical Scope vs Dynamic Scope

**Lexical Scope** (hay **Static Scope**):
- Scope được xác định **tại thời điểm viết code** (where function is **defined**)
- JavaScript dùng lexical scope

**Dynamic Scope**:
- Scope được xác định **tại thời điểm chạy code** (where function is **called**)
- Bash, Perl dùng dynamic scope

**Example minh họa:**

```javascript
const name = 'Global';

function outer() {
  const name = 'Outer';
  
  function inner() {
    console.log(name); // Lexical: 'Outer', Dynamic: depends on caller
  }
  
  return inner;
}

const fn = outer();
fn(); // Lexical scope → 'Outer'

// Nếu JS dùng dynamic scope:
function anotherContext() {
  const name = 'Another';
  fn(); // Dynamic scope → 'Another'
}
```

**Trong JavaScript (Lexical):**
- `inner` được define **bên trong** `outer`
- `inner` nhìn thấy variables của `outer`
- Không quan trọng `inner` được **call ở đâu**

### 3.2. Scope Chain

**Scope Chain** là chuỗi các **outer references** từ inner scope đến global scope.

**Lookup process:**

```javascript
const a = 'global';

function outer() {
  const b = 'outer';
  
  function inner() {
    const c = 'inner';
    console.log(a); // Where is 'a'?
  }
  
  inner();
}

outer();
```

**Scope Chain:**

```
inner scope: { c: 'inner' }
       ↓ (outer reference)
outer scope: { b: 'outer' }
       ↓ (outer reference)
global scope: { a: 'global' }
```

**Variable lookup cho `a`:**

1. Check **inner scope** → `a` not found
2. Check **outer scope** (via outer reference) → `a` not found
3. Check **global scope** → `a` found! → Return `'global'`

**Nếu không tìm thấy ở global:**
```javascript
console.log(notExist); // ReferenceError: notExist is not defined
```

### 3.3. Block Scope vs Function Scope

**Function Scope (`var`):**

```javascript
function test() {
  if (true) {
    var x = 10;
  }
  console.log(x); // 10 (var không có block scope)
}
```

**Block Scope (`let`/`const`):**

```javascript
function test() {
  if (true) {
    let y = 20;
    const z = 30;
  }
  console.log(y); // ReferenceError (let có block scope)
}
```

**Scope boundaries:**

```
Function { }  ← var, let, const scoped
Block { }     ← let, const scoped only
```

## 4. Closures: The Magic Revealed

### 4.1. Closure là gì?

**Closure** = **Function** + **Lexical Environment** (nơi function được define)

**Định nghĩa chính xác:**
> A closure is a function that has access to variables in its outer (enclosing) lexical scope, even after the outer function has returned.

**Key insight:** Function "nhớ" variables từ nơi nó được **sinh ra**, không phải nơi nó được **gọi**.

### 4.2. Closure Creation

```javascript
function outer() {
  const message = 'Hello';
  
  function inner() {
    console.log(message); // Access outer variable
  }
  
  return inner;
}

const myClosure = outer();
myClosure(); // 'Hello'
```

**Điều gì xảy ra?**

**Step 1:** `outer()` được call
```
Call Stack:
┌─────────────┐
│  outer EC   │
│  message:'Hello'
│  inner: <fn>│
├─────────────┤
│  GlobalEC   │
└─────────────┘
```

**Step 2:** `outer()` returns `inner` function
```
Call Stack:
┌─────────────┐
│  GlobalEC   │
│ myClosure: <inner fn>
└─────────────┘

outer EC được pop khỏi stack,
NHƯNG message vẫn còn trong memory!
```

**Step 3:** `myClosure()` (aka `inner()`) được call
```
Call Stack:
┌─────────────┐
│  inner EC   │
│  [[Scope]]: → {message: 'Hello'} (closure!)
├─────────────┤
│  GlobalEC   │
└─────────────┘
```

**Closure Environment:**

```
inner function object = {
  code: function() { console.log(message); },
  [[Scope]]: {
    message: 'Hello'  ← Captured from outer!
  }
}
```

`inner` có reference đến **outer's lexical environment**, nên `message` không bị garbage collected.

### 4.3. Multiple Closures

```javascript
function createCounter() {
  let count = 0;
  
  return {
    increment: function() { return ++count; },
    decrement: function() { return --count; },
    getCount: function() { return count; }
  };
}

const counter1 = createCounter();
console.log(counter1.increment()); // 1
console.log(counter1.increment()); // 2

const counter2 = createCounter();
console.log(counter2.increment()); // 1 (independent!)
```

**Mỗi call tạo closure riêng:**

```
counter1 closure: { count: 2 }
counter2 closure: { count: 1 }
```

3 methods (`increment`, `decrement`, `getCount`) trong **cùng counter** share **cùng closure environment**.

### 4.4. Closures trong Loops (Classic Bug)

**Vấn đề:**

```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i);
  }, 1000);
}
// Output: 3, 3, 3 (NOT 0, 1, 2!)
```

**Tại sao?**

- `var i` là **function-scoped** (global scope)
- 3 setTimeout callbacks share **cùng `i`**
- Khi callbacks chạy (sau 1s), loop đã chạy xong → `i = 3`

**Visualization:**

```
Loop ends → i = 3

Callback 1: console.log(i) → 3 (same i)
Callback 2: console.log(i) → 3 (same i)
Callback 3: console.log(i) → 3 (same i)
```

**Solution 1: Dùng `let` (block scope)**

```javascript
for (let i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i);
  }, 1000);
}
// Output: 0, 1, 2 ✓
```

Mỗi iteration tạo **new block scope** với riêng `i`.

**Solution 2: IIFE (Immediately Invoked Function Expression)**

```javascript
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(function() {
      console.log(j);
    }, 1000);
  })(i);
}
// Output: 0, 1, 2 ✓
```

IIFE tạo **new function scope** cho mỗi iteration, capture `i` as parameter `j`.

## 5. Practical Use Cases

### 5.1. Data Privacy / Encapsulation

```javascript
function createBankAccount(initialBalance) {
  let balance = initialBalance; // Private variable
  
  return {
    deposit(amount) {
      if (amount > 0) {
        balance += amount;
        return balance;
      }
    },
    
    withdraw(amount) {
      if (amount > 0 && amount <= balance) {
        balance -= amount;
        return balance;
      }
      return 'Insufficient funds';
    },
    
    getBalance() {
      return balance;
    }
  };
}

const account = createBankAccount(1000);
console.log(account.getBalance()); // 1000
account.deposit(500);              // 1500
console.log(account.balance);      // undefined (private!)
```

**Không thể trực tiếp access `balance`** → True encapsulation!

### 5.2. Function Factory / Partial Application

```javascript
function multiply(a) {
  return function(b) {
    return a * b;
  };
}

const double = multiply(2);
const triple = multiply(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
```

**Currying example:**

```javascript
function add(a) {
  return function(b) {
    return function(c) {
      return a + b + c;
    };
  };
}

console.log(add(1)(2)(3)); // 6

// Or with arrow functions:
const addArrow = a => b => c => a + b + c;
```

### 5.3. Event Handlers với Context

```javascript
function setupButton(buttonId, message) {
  const button = document.getElementById(buttonId);
  
  button.addEventListener('click', function() {
    alert(message); // Closure over 'message'
  });
}

setupButton('btn1', 'Button 1 clicked!');
setupButton('btn2', 'Button 2 clicked!');
```

Mỗi handler **nhớ** riêng `message` của nó.

### 5.4. Memoization (Caching)

```javascript
function memoize(fn) {
  const cache = {}; // Closure over cache
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (key in cache) {
      console.log('From cache');
      return cache[key];
    }
    
    console.log('Computing...');
    const result = fn(...args);
    cache[key] = result;
    return result;
  };
}

const slowSquare = n => {
  // Simulate slow computation
  for (let i = 0; i < 1e9; i++) {}
  return n * n;
};

const fastSquare = memoize(slowSquare);

console.log(fastSquare(5)); // Computing... 25
console.log(fastSquare(5)); // From cache 25
```

`cache` được preserve qua mỗi call → Perfect for caching!

### 5.5. Module Pattern

```javascript
const Calculator = (function() {
  // Private variables
  let history = [];
  
  // Private function
  function log(operation) {
    history.push(operation);
  }
  
  // Public API
  return {
    add(a, b) {
      const result = a + b;
      log(`${a} + ${b} = ${result}`);
      return result;
    },
    
    getHistory() {
      return [...history]; // Return copy
    },
    
    clearHistory() {
      history = [];
    }
  };
})();

Calculator.add(2, 3);     // 5
Calculator.add(5, 7);     // 12
console.log(Calculator.getHistory()); // ['2 + 3 = 5', '5 + 7 = 12']
console.log(Calculator.history);      // undefined (private!)
```

**Module pattern** cho phép:
- Private state (`history`)
- Private helpers (`log`)
- Public API (`add`, `getHistory`)

## 6. Common Pitfalls

### 6.1. Memory Leaks

**Problem:** Closures giữ reference đến outer variables → Ngăn garbage collection

```javascript
function createHugeClosure() {
  const hugeArray = new Array(1000000).fill('data');
  
  return function() {
    console.log(hugeArray[0]); // Keeps entire hugeArray in memory!
  };
}

const closures = [];
for (let i = 0; i < 100; i++) {
  closures.push(createHugeClosure());
}
// Memory: 100 * 1MB = 100MB kept in memory!
```

**Solution:** Chỉ capture data cần thiết

```javascript
function createSmallClosure() {
  const hugeArray = new Array(1000000).fill('data');
  const firstElement = hugeArray[0]; // Extract needed data
  
  return function() {
    console.log(firstElement); // Only keeps 1 string, not entire array
  };
}
```

### 6.2. `this` trong Closures

**Problem:** `this` không được captured như variables thường

```javascript
const obj = {
  name: 'Object',
  
  printName: function() {
    setTimeout(function() {
      console.log(this.name); // undefined (this = window/global)
    }, 1000);
  }
};

obj.printName();
```

**Solution 1: Arrow function** (lexical `this`)

```javascript
printName: function() {
  setTimeout(() => {
    console.log(this.name); // 'Object' ✓
  }, 1000);
}
```

**Solution 2: Store `this` reference**

```javascript
printName: function() {
  const self = this;
  setTimeout(function() {
    console.log(self.name); // 'Object' ✓
  }, 1000);
}
```

### 6.3. Closure trong Class Methods

```javascript
class Counter {
  constructor() {
    this.count = 0;
  }
  
  increment() {
    this.count++;
  }
  
  setupButton() {
    document.getElementById('btn').addEventListener('click', this.increment);
    // Bug: 'this' will be button element, not Counter instance!
  }
}
```

**Solution: Bind hoặc arrow function**

```javascript
setupButton() {
  // Option 1: bind
  document.getElementById('btn')
    .addEventListener('click', this.increment.bind(this));
  
  // Option 2: arrow function
  document.getElementById('btn')
    .addEventListener('click', () => this.increment());
}

// Option 3: Class field arrow function
class Counter {
  count = 0;
  
  increment = () => {
    this.count++;
  }
}
```

## 7. Performance Considerations

### 7.1. Closure Creation Cost

Mỗi closure = Memory overhead (closure environment + function object).

**Bad: Tạo closure trong loop**

```javascript
const buttons = document.querySelectorAll('.button');

buttons.forEach(button => {
  button.addEventListener('click', function() {
    // New closure cho MỖI button
    console.log('Clicked!');
  });
});
```

**Better: Reuse function**

```javascript
function handleClick() {
  console.log('Clicked!');
}

buttons.forEach(button => {
  button.addEventListener('click', handleClick);
});
```

### 7.2. Garbage Collection

Closures được GC khi:
- Không còn reference đến closure function
- Outer function's environment không còn ai reference

```javascript
function outer() {
  const data = new Array(1000000);
  
  return function inner() {
    console.log(data.length);
  };
}

let closure = outer();
// 'data' vẫn trong memory (closure reference)

closure = null;
// Giờ 'data' có thể được GC
```

## 8. Interview Questions Perspective

### 8.1. Classic Questions

**Q: Closure là gì? Cho ví dụ.**

A: Closure là function có access đến variables trong outer scope, ngay cả sau khi outer function đã return. Example: Counter pattern.

**Q: Phân biệt `var`, `let`, `const` trong context của closures.**

A:
- `var`: Function-scoped, có thể gây bug trong loop
- `let`/`const`: Block-scoped, mỗi iteration tạo new binding

**Q: Giải thích `this` trong closures.**

A: Regular functions không capture `this` lexically. Arrow functions thì có (lexical `this`).

### 8.2. Advanced Questions

**Q: Memory leak có thể xảy ra như thế nào với closures?**

A: Closure giữ reference đến entire outer scope, kể cả variables không dùng đến. Solution: Extract only needed data, hoặc explicitly `null` out references.

**Q: Performance implications của closures?**

A: Memory overhead cho mỗi closure environment. Avoid tạo closures trong hot paths (loops, recursive calls).

## 9. Kết luận: Master the Fundamentals

**Key Takeaways:**

✅ **Execution Context** - Môi trường code execute, có Variable/Lexical Environment + `this`  
✅ **Call Stack** - LIFO structure tracking ECs  
✅ **Lexical Scope** - Scope xác định tại nơi function **defined**, không phải **called**  
✅ **Scope Chain** - Lookup qua outer references  
✅ **Closures** - Function + Lexical Environment, "nhớ" outer variables  
✅ **Use Cases** - Data privacy, factory functions, memoization, module pattern  
✅ **Pitfalls** - Memory leaks, `this` binding, loop bugs  
✅ **Performance** - Closure creation cost, GC implications  

**Best Practices:**

1. **Hiểu lexical scope** - Biết function "nhìn thấy" variables nào
2. **Dùng `let`/`const`** - Tránh `var` trong loops
3. **Arrow functions cho `this`** - Khi cần lexical `this`
4. **Cẩn thận memory** - Chỉ capture data cần thiết
5. **Reuse functions** - Tránh tạo closures không cần thiết
6. **Test với DevTools** - Profile memory để detect leaks

**The Big Picture:**

Closures không phải "advanced feature" - nó là **fundamental behavior** của JavaScript. Mỗi khi bạn:
- Dùng callbacks
- Viết event handlers
- Implement modules
- Use React hooks (useState, useEffect)

...bạn đang dùng closures!

Master closures = Master JavaScript. 🎯

---

**Resources:**

📚 [You Don't Know JS: Scope & Closures - Kyle Simpson](https://github.com/getify/You-Dont-Know-JS)  
🎥 [JavaScript Execution Context Visualized](https://www.youtube.com/watch?v=Nt-qa_LlUH0)  
🔧 [JavaScript Visualizer 9000](https://www.jsv9000.app/)  
📖 [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures)  
🛠️ [Chrome DevTools Memory Profiler](https://developer.chrome.com/docs/devtools/memory-problems/)

---

*Hiểu Closures không chỉ giúp bạn viết code tốt hơn, mà còn giúp bạn debug faster và design better APIs. Invest time vào fundamentals - nó sẽ pay off trong toàn bộ career!* 🚀

**#JavaScript #Closures #Scope #ExecutionContext #WebDevelopment #FrontendEngineering**
