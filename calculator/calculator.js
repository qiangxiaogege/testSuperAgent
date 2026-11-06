/*
 * calculator.js - pure calculation core for the calculator page.
 *
 * This file deliberately has no DOM dependency: it only defines functions and
 * exposes them on `window.Calculator` so the logic can be checked from the
 * browser console and reused by app.js.
 */
(function (root, factory) {
  'use strict';

  var Calculator = factory();

  // Node/CommonJS export, used by the test runner. In a browser this branch is
  // skipped and only window.Calculator is created.
  if (typeof module === 'object' && module && module.exports) {
    module.exports = Calculator;
  }

  if (root) {
    root.Calculator = Calculator;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var OPERATORS = ['+', '-', '*', '/'];
  var OPERATOR_ALIASES = { '×': '*', '÷': '/' };
  var MAX_SIGNIFICANT_DIGITS = 10;
  var ERROR = 'Error';

  /**
   * True when `key` is a single decimal digit. Used by the app.js key state
   * machine to decide whether a key starts/extends a number.
   */
  function isDigitKey(key) {
    return typeof key === 'string' && key.length === 1 && key >= '0' && key <= '9';
  }

  /**
   * True when `key` is one of the supported operator keys. The on-screen
   * labels "×" and "÷" are accepted as aliases for "*" and "/".
   */
  function isOperatorKey(key) {
    if (typeof key !== 'string') {
      return false;
    }
    return OPERATORS.indexOf(key) !== -1 ||
      Object.prototype.hasOwnProperty.call(OPERATOR_ALIASES, key);
  }

  /** True when `key` is the decimal point key. */
  function isDecimalKey(key) {
    return key === '.';
  }

  /** Map a key or operator label to "+", "-", "*", "/"; null if unknown. */
  function normalizeOperator(op) {
    if (typeof op !== 'string') {
      return null;
    }
    if (OPERATORS.indexOf(op) !== -1) {
      return op;
    }
    if (Object.prototype.hasOwnProperty.call(OPERATOR_ALIASES, op)) {
      return OPERATOR_ALIASES[op];
    }
    return null;
  }

  /**
   * Convert a string or number operand to a finite number. Returns NaN for
   * anything that is not a usable finite value (empty string, "abc", ...).
   */
  function toFiniteNumber(value) {
    var number;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : NaN;
    }
    if (typeof value !== 'string') {
      return NaN;
    }
    if (value.trim() === '') {
      return NaN;
    }
    number = Number(value);
    return Number.isFinite(number) ? number : NaN;
  }

  /**
   * Truncate `value` to `digits` significant decimal digits.
   *
   * The value is first rounded to 12 significant digits so that binary
   * floating point noise (0.1 + 0.2 === 0.30000000000000004) does not leak
   * into the result; any further digits are then simply dropped (truncated),
   * as opposed to rounded.
   */
  function truncateToSignificantDigits(value, digits) {
    var rounded;
    var sign;
    var parts;
    var digitText;
    var exponent;

    if (!Number.isFinite(value)) {
      return NaN;
    }
    if (value === 0) {
      return 0;
    }

    rounded = Number(value.toPrecision(12));
    if (rounded === 0) {
      return 0;
    }

    sign = rounded < 0 ? -1 : 1;
    parts = Math.abs(rounded).toExponential().split('e');
    digitText = parts[0].replace('.', '');
    exponent = parseInt(parts[1], 10);

    // Trailing zeros carry no information and can be dropped before the
    // significant-digit limit is applied.
    digitText = digitText.replace(/0+$/, '') || '0';
    if (digitText.length > digits) {
      digitText = digitText.slice(0, digits);
    }

    return sign * Number(
      digitText.charAt(0) +
      (digitText.length > 1 ? '.' + digitText.slice(1) : '') +
      'e' + exponent
    );
  }

  /**
   * Format a numeric result as the string shown by the calculator.
   * Invalid/non-finite values become "Error"; results are limited to 10
   * significant digits.
   */
  function formatNumber(value) {
    var result;
    var text;

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return ERROR;
    }
    if (value === 0) {
      return '0';
    }

    result = truncateToSignificantDigits(value, MAX_SIGNIFICANT_DIGITS);
    if (!Number.isFinite(result)) {
      return ERROR;
    }

    text = String(result);
    return text === '-0' ? '0' : text;
  }

  /**
   * Compute `a <op> b` and return the display string.
   *
   * @param {string|number} a left operand
   * @param {'+'|'-'|'*'|'/'} op operator
   * @param {string|number} b right operand
   * @returns {string} formatted result, or "Error" for invalid input and
   *   division by zero.
   */
  function compute(a, op, b) {
    var left = toFiniteNumber(a);
    var right = toFiniteNumber(b);
    var operator = normalizeOperator(op);
    var raw;

    if (!Number.isFinite(left) || !Number.isFinite(right) || operator === null) {
      return ERROR;
    }
    if (operator === '/' && right === 0) {
      return ERROR;
    }

    switch (operator) {
      case '+':
        raw = left + right;
        break;
      case '-':
        raw = left - right;
        break;
      case '*':
        raw = left * right;
        break;
      case '/':
        raw = left / right;
        break;
      default:
        return ERROR;
    }

    return formatNumber(raw);
  }

  return {
    compute: compute,
    formatNumber: formatNumber,
    isDigitKey: isDigitKey,
    isOperatorKey: isOperatorKey,
    isDecimalKey: isDecimalKey,
    normalizeOperator: normalizeOperator,
    MAX_SIGNIFICANT_DIGITS: MAX_SIGNIFICANT_DIGITS
  };
});
