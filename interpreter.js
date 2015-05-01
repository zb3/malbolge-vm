#!/usr/bin/env node

var mb = require('malbolge-vm');
var fs = require('fs');

if (process.argv.length < 3) {
  process.stderr.write('No input file specified.\n');
  process.exit();
}

var code;
try {
  code = fs.readFileSync(process.argv[2], 'binary');
} catch (e) {
  process.stderr.write('Could not open file!\n');
  process.exit();
}

var vm;
try {
  vm = mb.load(code);
} catch (e) {
  process.stderr.write(e + '\n');
  process.exit();
}

var t, input, inputQueue = [];
var paused = false;

process.stdin.on('readable', queueInput);
process.stdin.on('end', processEOF);

function queueInput() {
  var data = process.stdin.read();
  if (data === null) return;

  for (var t = 0; t < data.length; t++)
    inputQueue.push(data[t]);

  resume();
}

function processEOF() {
  inputQueue.push(59048);
  resume();
}

function resume() {
  if (paused) {
    paused = false;
    execute();
  }
}

function execute() {
  while (true) {
    try {
      while ((t = mb.step(vm, input)) != mb.EXIT) {
        input = null;

        if (t !== null)
          process.stdout.write(String.fromCharCode(t));
      }
      break;
    } catch (e) {
      if (e === mb.WANTS_INPUT) {
        if (inputQueue.length) {
          input = inputQueue.shift();
          continue;
        }
        paused = true;
      } else {
        process.stderr.write('Runtime error: ' + e + '\n');
        return;
      }
    }
    break;
  }
  if (!paused) {
    process.exit();
  }
}
execute();