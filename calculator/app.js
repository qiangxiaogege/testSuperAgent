'use strict';

var display = null;

var state = {
  current: '0',
  previous: null,
  operator: null,
  waitingForOperand: false
};

function render(value) {
  if (!display) {
    display = document.getElementById('display');
  }
  if (display) {
    display.textContent = value;
  }
}

function reset() {
  state.current = '0';
  state.previous = null;
  state.operator = null;
  state.waitingForOperand = false;
  render(state.current);
}

function inputDigit(digit) {
  if (state.waitingForOperand) {
    state.current = digit;
    state.waitingForOperand = false;
  } else if (state.current === '0') {
    state.current = digit;
  } else {
    state.current += digit;
  }
  render(state.current);
}

function inputDecimal() {
  if (state.waitingForOperand) {
    state.current = '0.';
    state.waitingForOperand = false;
  } else if (state.current.indexOf('.') === -1) {
    state.current += '.';
  } else {
    return;
  }
  render(state.current);
}

function normalizeOperator(key) {
  if (key === '×' || key === '*' || key === 'x') {
    return '*';
  }
  if (key === '÷' || key === '/') {
    return '/';
  }
  if (key === '+' || key === '-') {
    return key;
  }
  return null;
}

function compute(operator, left, right) {
  if (!window.Calculator || typeof window.Calculator.compute !== 'function') {
    return 'Error';
  }
  return window.Calculator.compute(left, operator, right);
}

function inputOperator(operator) {
  if (state.operator !== null) {
    if (state.waitingForOperand) {
      state.operator = operator;
      return;
    }
    var result = compute(state.operator, state.previous, state.current);
    if (result === 'Error') {
      state.current = '0';
      state.previous = null;
      state.operator = null;
      state.waitingForOperand = true;
      render('Error');
      return;
    }
    state.current = result;
    render(result);
    state.previous = result;
    state.operator = operator;
    state.waitingForOperand = true;
    return;
  }
  state.previous = state.current;
  state.operator = operator;
  state.waitingForOperand = true;
}

function equals() {
  if (state.operator === null || state.previous === null) {
    return;
  }
  var result = compute(state.operator, state.previous, state.current);
  if (result === 'Error') {
    state.current = '0';
    state.previous = null;
    state.operator = null;
    state.waitingForOperand = true;
    render('Error');
    return;
  }
  state.current = result;
  state.previous = null;
  state.operator = null;
  state.waitingForOperand = true;
  render(result);
}

function handleKey(key) {
  if (key === 'clear' || key === 'C' || key === 'c') {
    reset();
    return;
  }
  if (key === '=' || key === 'equals') {
    equals();
    return;
  }
  if (key === '.') {
    inputDecimal();
    return;
  }
  if (key.length === 1 && key >= '0' && key <= '9') {
    inputDigit(key);
    return;
  }
  var operator = normalizeOperator(key);
  if (operator !== null) {
    inputOperator(operator);
  }
}

function bindButtons() {
  var buttons = document.querySelectorAll('[data-key]');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener('click', onButtonClick);
  }
}

function onButtonClick(event) {
  var key = event.currentTarget.getAttribute('data-key');
  if (key !== null) {
    handleKey(key);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindButtons);
} else {
  bindButtons();
}
