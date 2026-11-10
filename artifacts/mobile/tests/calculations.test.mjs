import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeIPv4,
  analyzeIPv6,
  binaryToDecimalSteps,
  binaryToHexSteps,
  calculateBinary,
  convertBetweenBases,
  extractIPv4Candidates,
  extractIPCandidates,
  formatInteger,
  getBitBreakdown,
  parseIntegerInput,
} from '../src/core/calculations.ts';

test('converts decimal values to binary and hexadecimal exactly', () => {
  const examples = [
    ['0', '0', '0'],
    ['1', '1', '1'],
    ['10', '1010', 'A'],
    ['15', '1111', 'F'],
    ['16', '10000', '10'],
    ['64', '1000000', '40'],
    ['127', '1111111', '7F'],
    ['128', '10000000', '80'],
    ['168', '10101000', 'A8'],
    ['192', '11000000', 'C0'],
    ['255', '11111111', 'FF'],
  ];
  for (const [decimal, binary, hexadecimal] of examples) {
    const result = convertBetweenBases(decimal, 10);
    assert.equal(result.binary, binary);
    assert.equal(result.hexadecimal, hexadecimal);
    assert.equal(result.decimal, decimal);
  }
});

test('parses prefixes, signs, leading zeros and large integers without precision loss', () => {
  assert.equal(parseIntegerInput('0b001010', 2), 10n);
  assert.equal(parseIntegerInput('-0xFF', 16), -255n);
  assert.equal(parseIntegerInput('00010', 10), 10n);
  assert.equal(parseIntegerInput('123456789012345678901234567890', 10).toString(), '123456789012345678901234567890');
  assert.equal(formatInteger(-255n, 16), '-FF');
  assert.throws(() => parseIntegerInput('102', 2));
  assert.throws(() => parseIntegerInput('1.5', 10));
  assert.throws(() => parseIntegerInput('', 10));
  assert.throws(() => parseIntegerInput('G', 16));
  assert.throws(() => parseIntegerInput('1'.repeat(257), 2));
});

test('produces conversion steps and bit place values', () => {
  assert.ok(binaryToDecimalSteps('11000000').some((step) => step.includes('192')));
  assert.ok(binaryToHexSteps('11000000').some((step) => step.includes('C')));
  const bits = getBitBreakdown(192n, 8);
  assert.equal(bits.map((bit) => bit.bit).join(''), '11000000');
  assert.deepEqual(bits.map((bit) => Number(bit.placeValue)), [128, 64, 32, 16, 8, 4, 2, 1]);
});

test('performs binary arithmetic and reports quotient remainders', () => {
  assert.equal(calculateBinary('1010', 'add', '0011').result, '1101');
  assert.equal(calculateBinary('1111', 'add', '0001').result, '10000');
  assert.equal(calculateBinary('1000', 'subtract', '0001').result, '111');
  assert.equal(calculateBinary('1', 'subtract', '10').result, '-1');
  assert.equal(calculateBinary('101', 'multiply', '11').result, '1111');
  const division = calculateBinary('1101', 'divide', '10');
  assert.equal(division.result, '110');
  assert.equal(division.remainder, '1');
  assert.throws(() => calculateBinary('1', 'divide', '0'), /divisionByZero/);
  assert.throws(() => calculateBinary('-1', 'add', '1'), /unsignedOnly/);
});

test('strictly validates IPv4 and computes padded binary, hex and decimal', () => {
  const examples = [
    ['0.0.0.0', '00000000.00000000.00000000.00000000'],
    ['1.0.0.0', '00000001.00000000.00000000.00000000'],
    ['127.0.0.1', '01111111.00000000.00000000.00000001'],
    ['192.168.1.10', '11000000.10101000.00000001.00001010'],
    ['255.255.255.255', '11111111.11111111.11111111.11111111'],
  ];
  for (const [address, binary] of examples) {
    assert.equal(analyzeIPv4(address).combinedBinary, binary);
  }
  const result = analyzeIPv4('192.168.1.10');
  assert.equal(result.hexadecimal, 'C0A8010A');
  assert.equal(result.decimal32, '3232235786');
  assert.equal(analyzeIPv4('192.168.1.10').category.key, 'private');
  assert.equal(analyzeIPv4('127.0.0.1').category.key, 'loopback');
  assert.equal(analyzeIPv4('8.8.8.8').category.key, 'other');
  assert.equal(analyzeIPv4('255.255.255.255').category.key, 'limitedBroadcast');
  assert.equal(analyzeIPv4('224.0.0.1').category.key, 'multicast');
  assert.equal(analyzeIPv4('169.254.1.1').category.key, 'linkLocal');
  for (const invalid of ['256.1.1.1', '192.168.1', '192.168.1.10.5', '192..1.10', '192.168.one.10', '-1.2.3.4', '1.2.3.999', '01.2.3.4']) {
    assert.throws(() => analyzeIPv4(invalid), `Expected ${invalid} to be invalid`);
  }
});

test('extracts only valid IPv4 candidates from plain text', () => {
  assert.deepEqual(extractIPv4Candidates('Try 192.168.1.10 or 999.1.1.1, then 8.8.8.8.'), [
    '192.168.1.10',
    '8.8.8.8',
  ]);
});


test('analyzes IPv6 compressed and expanded addresses as 128 bits', () => {
  const result = analyzeIPv6('2001:db8::1');
  assert.equal(result.groups.length, 8);
  assert.equal(result.binary128.length, 128);
  assert.equal(result.hexadecimal.length, 32);
  assert.equal(result.expandedAddress, '2001:0db8:0000:0000:0000:0000:0000:0001');
  assert.equal(result.category.key, 'documentation');
  assert.equal(analyzeIPv6('::1').category.key, 'ipv6Loopback');
  assert.equal(analyzeIPv6('::').category.key, 'ipv6Unspecified');
  assert.throws(() => analyzeIPv6('2001:::1'));
  assert.throws(() => analyzeIPv6('2001:db8::1::2'));
});

test('extracts valid IPv4 and IPv6 candidates from OCR text without guessing corrections', () => {
  assert.deepEqual(extractIPCandidates('Gateway 192.168.1.10, DNS 8.8.8.8 and IPv6 2001:db8::1'), [
    { address: '192.168.1.10', version: 'ipv4' },
    { address: '8.8.8.8', version: 'ipv4' },
    { address: '2001:db8::1', version: 'ipv6' },
  ]);
  assert.deepEqual(extractIPCandidates('Invalid 999.1.1.1 and 2001:::1'), []);
  assert.deepEqual(extractIPCandidates('Local loopback ::1 and unspecified ::'), [
    { address: '::1', version: 'ipv6' },
    { address: '::', version: 'ipv6' },
  ]);
  assert.deepEqual(extractIPCandidates('Mapped address ::ffff:192.0.2.1'), [
    { address: '::ffff:192.0.2.1', version: 'ipv6' },
  ]);
});
