# malbolge-vm

malbolge-vm is a node library to deal with Malbolge code. 

This library let's you:
* Validate Malbolge code
* Normalize / Assemble Malbolge code
* Execute Malbolge code step by step with user input support. You can also see the internal registers and memory.
* Dynamically append and execute code (providing you've not accessed the default memory)

It also includes a CLI interpreter with input support if you install it globally.

## Installation
To use it in your project:
```
npm install --save malbolge-vm
```
If you want to use the `malbolge-interpreter` command, you can install this globally:
```
npm install -g malbolge-vm
```
Then you will be able to run Malbolge programs via command line:
```
malbolge-interpreter some_file.mb
```

## Usage

### Basic code execution

```javascript
var mb = require('malbolge-vm');
var code = '(&%$_""7<5492V0TA3P';

//First of all, we create new Malbolge VM, by using the load function
var vm = mb.load(code);

//Then that object gives us the ability to access registers and memory:
console.log('A register:', vm.a);
console.log('C register:', vm.c);
console.log('D register:', vm.d);
console.log('Memory @', 40, ':', vm.mem[40]);

var result = '';

try {
  //For simple code execution, use the exec function
  //exec function executes the VM and returns the output
  result = mb.exec(vm);
} catch (e) {
  //When it fails, it will throw an error message
  //or WANTS_INPUT if it would wait for user input
  if (e === mb.WANTS_INPUT)
    console.log('Error: User input expected.');
  else
    console.log('Error: '+e);
}

console.log('Output: '+result);
```

### Step by step code execution with user input
```javascript
var mb = require('malbolge-vm');
var code = 'ubs`M';

var vm = mb.load(code);

var result = '';
var temp;

//To execute a single step use the step function
//mb.step(vm, [input])
//This normally returns output character code or null
//This can also return EXIT, or throw WANTS_INPUT

while (true) {
  try {
    //When program finishes, step returns EXIT 
    while ((temp = mb.step(vm)) !== mb.EXIT) {
      if (temp !== null)
        result += String.fromCharCode(temp);
    }
    break;
  } catch (e) {
    //step throws WANTS_INPUT when it encounters input instruction
    //and no input is provided
    if (e === mb.WANTS_INPUT) {
      //step function optionally accepts user input - a number
      //use 10 for new line and 59048 for EOF
      mb.step(vm, 51); //assume user wanted to press '3'
      continue;
    }
    console.log('Error:', e);
  }
  break;
}
console.log('Output: '+result);
```


### Code operations

```javascript
var mb = require('malbolge-vm');
var code = '(&%$_""7<5492V0TA3P';
var position = 3;

//Normalize Malbolge code
var normalized = mb.normalize(code);
console.log('Normalized code', normalized);

//Assemble the code back
var assembled = mb.assemble(normalized);
console.log('assembled === code', assembled === code); //true

//Validate code
console.log('Is code valid?', mb.validate(code));
//For validation of normalized code, set the second parameter to true
console.log('Is normalized code valid?', mb.validate(normalized, true));

//To normalize a single instruction
var op = mb.decode(code[position], position);
console.log('Decoded op @', position, ':', op);

//Alternatively you could use decodeInt
op = mb.decodeInt(code.charCodeAt(position), position);
console.log('Decoded op @', position, ':', op);

//When you have a char of the normalized code,
//you can get the op code via assembly dictionary
console.log('Op code @', position, ':', mb.assembly[op]); //instruction 

//If you want to encode an instruction, use encode:
console.log('Halt @', position, 'is', mb.encode(mb.opc.halt, position));
console.log('Char code of halt @', position, 'is', mb.encodeInt(mb.opc.halt, position));

/*
Opcodes in Malbolge:

var opc = {
  jump: 4,
  out: 5,
  in : 23,
  rot: 39,
  movd: 40,
  opr: 62,
  nop: 68,
  halt: 81
};
*/
```

### Dynamic code execution (advanced)
If you'd like to generate Malbolge code dynamically, this library can help you. Note that this topic is advanced - you will not be able to execute code that uses filled memory locations here.
```javascript
var mb = require('malbolge-vm');
var code = 'D'; //NOP instruction

//You can disable filling memory by setting the optional 'partially' argument to true
var vm = mb.load(code, true);
//vm.mem.length is now 1, and we can append more instruction

//but before appending, let's execute the existing part of the code
mb.exec(vm);

//add another NOP, append to code and execute in VM
//appendAndPerform returns the char to be appended to code
code += mb.appendAndPerform(vm, mb.opc.nop);

//now you can analyse vm.a, vm.c, vm.d and vm.mem etc

//add input instruction, and execute as if user pressed enter
code += mb.appendAndPerform(vm, mb.opc.in, 10);
//vm.a is now 10

//now add jump instruction, but do NOT execute
code += mb.appendAndPerform(vm, mb.opc.jump, null, true); //skip set to true

//store the address of the instruction to be executed
var jumpLocation = vm.mem[vm.d] + 1; 

//now we have to fill the remaining memory

//fill the memory with NOP's
while(code.length < jumpLocation) {
  code += mb.appendAndPerform(vm, mb.opc.nop, null, true);
}

//now we can finally jump (vm.c is still 3)
mb.step(vm);

//and NOW we can append the instruction to be executed.
//without skip, because this time we execute it.
code += mb.appendAndPerform(vm, mb.opc.out);

//and finally - halt
code += mb.appendAndPerform(vm, mb.opc.halt);

console.log('Code: ', code);
```
