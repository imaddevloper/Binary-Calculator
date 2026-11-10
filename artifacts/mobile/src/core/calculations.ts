export type Base = 2 | 10 | 16;
export type BinaryOperation = 'add' | 'subtract' | 'multiply' | 'divide';

const MAX_INPUT_LENGTH = 256;

const DIGITS = '0123456789ABCDEF';

function digitValue(character: string): number {
  return DIGITS.indexOf(character.toUpperCase());
}

export function parseIntegerInput(raw: string, base: Base): bigint {
  const value = raw.trim();
  if (!value) throw new Error('empty');
  if (value.length > MAX_INPUT_LENGTH) throw new Error('tooLong');

  let digits = value;
  let sign = 1n;
  if (digits.startsWith('-') || digits.startsWith('+')) {
    if (digits[0] === '-') sign = -1n;
    digits = digits.slice(1);
  }
  if (base === 2 && /^0b/i.test(digits)) digits = digits.slice(2);
  if (base === 16 && /^0x/i.test(digits)) digits = digits.slice(2);
  if (!digits) throw new Error('invalid');

  let result = 0n;
  for (const character of digits) {
    const digit = digitValue(character);
    if (digit < 0 || digit >= base) throw new Error('invalid');
    result = result * BigInt(base) + BigInt(digit);
  }
  return result * sign;
}

export function formatInteger(value: bigint, base: Base): string {
  const negative = value < 0n;
  const magnitude = negative ? -value : value;
  const output = magnitude.toString(base).toUpperCase();
  return `${negative ? '-' : ''}${output}`;
}

export function convertBetweenBases(value: string, fromBase: Base) {
  const decimal = parseIntegerInput(value, fromBase);
  return {
    decimal: formatInteger(decimal, 10),
    binary: formatInteger(decimal, 2),
    hexadecimal: formatInteger(decimal, 16),
    value: decimal,
  };
}

function divisionSteps(value: bigint, radix: 2 | 16): string[] {
  const negative = value < 0n;
  let remainderValue = negative ? -value : value;
  if (remainderValue === 0n) return ['0 ÷ ' + radix + ' = 0 remainder 0'];

  const rows: string[] = [];
  while (remainderValue > 0n) {
    const quotient = remainderValue / BigInt(radix);
    const remainder = Number(remainderValue % BigInt(radix));
    rows.push(
      `${remainderValue} ÷ ${radix} = ${quotient} remainder ${DIGITS[remainder]}`,
    );
    remainderValue = quotient;
  }
  rows.push(
    negative
      ? 'Read the remainders from bottom to top, then add the minus sign.'
      : 'Read the remainders from bottom to top.',
  );
  return rows;
}

export function decimalToBinarySteps(value: bigint): string[] {
  return divisionSteps(value, 2);
}

export function decimalToHexSteps(value: bigint): string[] {
  return [...divisionSteps(value, 16), 'Hexadecimal digits continue after 9: A=10, B=11, C=12, D=13, E=14, F=15.'];
}

export function binaryToDecimalSteps(input: string): string[] {
  const value = parseIntegerInput(input, 2);
  const digits = input.trim().replace(/^[+-]?0b/i, '').replace(/^[+-]/, '');
  const terms = [...digits]
    .reverse()
    .map((bit, position) => ({ bit, position }))
    .filter(({ bit }) => bit === '1')
    .map(({ position }) => `1 × 2^${position} = ${2n ** BigInt(position)}`);
  return [
    `${input.trim()}₂ = ${terms.length ? terms.join(' + ') : '0'}`,
    `Add the place values: ${value.toString()}₁₀`,
  ];
}

export function hexToDecimalSteps(input: string): string[] {
  const value = parseIntegerInput(input, 16);
  let digits = input.trim().replace(/^[+-]?0x/i, '').replace(/^[+-]/, '');
  digits = digits.toUpperCase();
  const terms = [...digits]
    .reverse()
    .map((digit, position) => {
      const numeric = digitValue(digit);
      return `${numeric} × 16^${position} = ${BigInt(numeric) * 16n ** BigInt(position)}`;
    });
  return [`${digits}₁₆ = ${terms.join(' + ')}`, `Add the place values: ${value.toString()}₁₀`];
}

export function binaryToHexSteps(input: string): string[] {
  const clean = input.trim().replace(/^[+-]?0b/i, '').replace(/^[+-]/, '');
  const padding = (4 - (clean.length % 4)) % 4;
  const padded = `${'0'.repeat(padding)}${clean}`;
  const groups = padded.match(/.{4}/g) ?? [];
  const mapped = groups.map((group) => `${group}₂ = ${parseInt(group, 2).toString(16).toUpperCase()}₁₆`);
  return [
    padding
      ? `Pad the left side with ${padding} zero${padding === 1 ? '' : 'es'} for grouping; the value does not change.`
      : 'Group the bits into four-bit nibbles.',
    ...mapped,
    `Result: ${formatInteger(parseIntegerInput(input, 2), 16)}₁₆`,
  ];
}

export function getBitBreakdown(value: bigint, width?: number) {
  const magnitude = value < 0n ? -value : value;
  const bits = magnitude.toString(2);
  const targetWidth = Math.max(width ?? 0, bits.length);
  const padded = bits.padStart(targetWidth, '0');
  return [...padded].map((bit, index) => ({
    bit,
    position: targetWidth - index - 1,
    placeValue: 2n ** BigInt(targetWidth - index - 1),
  }));
}

function binaryMagnitude(value: bigint): string {
  return (value < 0n ? -value : value).toString(2);
}

function addSteps(left: bigint, right: bigint): string[] {
  const a = binaryMagnitude(left);
  const b = binaryMagnitude(right);
  const width = Math.max(a.length, b.length);
  let carry = 0;
  const output: string[] = [];
  const rows: string[] = [];
  for (let index = 0; index < width; index += 1) {
    const position = width - index - 1;
    const sum = Number(a[a.length - index - 1] ?? 0) + Number(b[b.length - index - 1] ?? 0) + carry;
    output.unshift(String(sum % 2));
    carry = Math.floor(sum / 2);
    rows.push(`Column ${index + 1}: ${sum % 2} written, carry ${carry}.`);
  }
  if (carry) output.unshift('1');
  return [`  ${a.padStart(width, '0')}`, `+ ${b.padStart(width, '0')}`, ...rows, `Result: ${output.join('')}`];
}

function subtractSteps(left: bigint, right: bigint): string[] {
  const result = left - right;
  if (result < 0n) {
    return [
      'The second operand is larger, so the mathematical result is negative.',
      `${left}₂ − ${right}₂ = −${(-result).toString(2)}₂`,
      'The result is signed; it is not wrapped to a fixed bit width.',
    ];
  }
  return [
    `${left.toString(2)}₂ − ${right.toString(2)}₂`,
    `Subtract the unsigned values exactly: ${left} − ${right} = ${result}.`,
    `Result: ${result.toString(2)}₂`,
  ];
}

export function calculateBinary(
  leftInput: string,
  operation: BinaryOperation,
  rightInput: string,
) {
  const left = parseIntegerInput(leftInput, 2);
  const right = parseIntegerInput(rightInput, 2);
  if (left < 0n || right < 0n) throw new Error('unsignedOnly');
  if (operation === 'divide' && right === 0n) throw new Error('divisionByZero');

  let value: bigint;
  let steps: string[];
  let remainder: bigint | null = null;
  switch (operation) {
    case 'add':
      value = left + right;
      steps = addSteps(left, right);
      break;
    case 'subtract':
      value = left - right;
      steps = subtractSteps(left, right);
      break;
    case 'multiply': {
      value = left * right;
      const partials = [...right.toString(2)]
        .reverse()
        .map((bit, index) =>
          bit === '1'
            ? `${left.toString(2)} shifted left ${index} place${index === 1 ? '' : 's'} = ${(left << BigInt(index)).toString(2)}`
            : `0 at position ${index}: no partial product`,
        );
      steps = [...partials, `Sum the partial products: ${value.toString(2)}₂`];
      break;
    }
    case 'divide':
      value = left / right;
      remainder = left % right;
      steps = [
        `${left.toString(2)}₂ = ${right.toString(2)}₂ × ${value.toString(2)}₂ + ${remainder.toString(2)}₂`,
        `Quotient: ${value.toString(2)}₂`,
        `Remainder: ${remainder.toString(2)}₂`,
      ];
      break;
  }
  return {
    result: value.toString(2),
    decimalResult: value.toString(),
    remainder: remainder?.toString(2) ?? null,
    steps,
  };
}

export type IPv4Category = {
  key: string;
  cidr: string;
};

export type IPv4ValidationResult =
  | { valid: true; octets: number[] }
  | { valid: false; reason: 'empty' | 'format' | 'range' | 'leadingZero' };

export function validateIPv4(raw: string): IPv4ValidationResult {
  const address = raw.trim();
  if (!address) return { valid: false, reason: 'empty' };
  if (address.length > 15) return { valid: false, reason: 'format' };

  const parts = address.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) {
    return { valid: false, reason: 'format' };
  }
  if (parts.some((part) => part.length > 1 && part.startsWith('0'))) {
    return { valid: false, reason: 'leadingZero' };
  }
  if (parts.some((part) => part.length > 3)) return { valid: false, reason: 'range' };

  const octets = parts.map(Number);
  if (octets.some((octet) => octet > 255)) return { valid: false, reason: 'range' };
  return { valid: true, octets };
}

function ipv4ToInteger(octets: number[]): bigint {
  return octets.reduce((value, octet) => (value << 8n) | BigInt(octet), 0n);
}

function addressInteger(address: string): bigint {
  return ipv4ToInteger(address.split('.').map(Number));
}

function inCidr(address: string, network: string, prefix: number): boolean {
  const mask = prefix === 0 ? 0n : ((1n << 32n) - 1n) ^ ((1n << BigInt(32 - prefix)) - 1n);
  return (addressInteger(address) & mask) === (addressInteger(network) & mask);
}

function classifyIPv4(address: string): IPv4Category {
  if (address === '255.255.255.255') return { key: 'limitedBroadcast', cidr: '255.255.255.255/32' };
  if (address === '0.0.0.0') return { key: 'unspecified', cidr: '0.0.0.0/32' };
  const ranges: Array<[string, string, number]> = [
    ['loopback', '127.0.0.0', 8],
    ['private', '10.0.0.0', 8],
    ['private', '172.16.0.0', 12],
    ['private', '192.168.0.0', 16],
    ['linkLocal', '169.254.0.0', 16],
    ['shared', '100.64.0.0', 10],
    ['documentation', '192.0.2.0', 24],
    ['documentation', '198.51.100.0', 24],
    ['documentation', '203.0.113.0', 24],
    ['benchmarking', '198.18.0.0', 15],
    ['protocolAssignment', '192.0.0.0', 24],
    ['reserved', '0.0.0.0', 8],
    ['multicast', '224.0.0.0', 4],
    ['reserved', '240.0.0.0', 4],
  ];
  for (const [key, network, prefix] of ranges) {
    if (inCidr(address, network, prefix)) return { key, cidr: `${network}/${prefix}` };
  }
  return { key: 'other', cidr: '' };
}

export function analyzeIPv4(raw: string) {
  const address = raw.trim();
  const validation = validateIPv4(address);
  if (!validation.valid) throw new Error(validation.reason);
  const octets = validation.octets;
  const binaryOctets = octets.map((octet) => octet.toString(2).padStart(8, '0'));
  const hexadecimalOctets = octets.map((octet) => octet.toString(16).toUpperCase().padStart(2, '0'));
  const combinedBinary = binaryOctets.join('.');
  const hex = ipv4ToInteger(octets).toString(16).toUpperCase().padStart(8, '0');
  const category = classifyIPv4(address);

  const classFirst = octets[0];
  const historicalClass =
    classFirst >= 1 && classFirst <= 126
      ? 'A'
      : classFirst >= 128 && classFirst <= 191
        ? 'B'
        : classFirst >= 192 && classFirst <= 223
          ? 'C'
          : classFirst >= 224 && classFirst <= 239
            ? 'D'
            : classFirst >= 240
              ? 'E'
              : 'special';

  return {
    address,
    octets: octets.map((decimal, index) => ({
      decimal,
      binary: binaryOctets[index],
      hexadecimal: hexadecimalOctets[index],
      position: index + 1,
    })),
    combinedBinary,
    hexadecimal: hex,
    decimal32: ipv4ToInteger(octets).toString(),
    category,
    historicalClass,
    conversionSteps: {
      octets: octets.map((decimal, index) => ({
        decimal,
        binary: binaryOctets[index],
        hexadecimal: hexadecimalOctets[index],
        position: index + 1,
      })),
      combinedBinary,
      hexadecimal: hex,
      decimal32: ipv4ToInteger(octets).toString(),
    },
  };
}

export type IPv6Category = {
  key: string;
  cidr: string;
  scopeKey: string;
};

export type IPv6ValidationResult =
  | {
      valid: true;
      groups: number[];
      expandedAddress: string;
      compressedZeroGroups: number;
      embeddedIPv4: { address: string; groups: string[] } | null;
    }
  | { valid: false; reason: 'empty' | 'format' };

export type IPv6ConversionStep =
  | { kind: 'embeddedIPv4'; address: string; groups: string }
  | { kind: 'expansion'; address: string; zeroGroups: number }
  | { kind: 'alreadyExpanded' }
  | { kind: 'group'; position: number; hexadecimal: string; binary: string }
  | { kind: 'assemble' };

export function validateIPv6(raw: string): IPv6ValidationResult {
  const address = raw.trim();
  if (!address) return { valid: false, reason: 'empty' };
  if (address.length > 45 || address.includes('%') || address.includes('/')) {
    return { valid: false, reason: 'format' };
  }

  let candidate = address;
  let embeddedIPv4: { address: string; groups: string[] } | null = null;
  if (candidate.includes('.')) {
    const separator = candidate.lastIndexOf(':');
    if (separator < 0) return { valid: false, reason: 'format' };
    const ipv4Address = candidate.slice(separator + 1);
    const ipv4 = validateIPv4(ipv4Address);
    if (!ipv4.valid) return { valid: false, reason: 'format' };
    const firstGroup = ((ipv4.octets[0] << 8) | ipv4.octets[1]).toString(16);
    const secondGroup = ((ipv4.octets[2] << 8) | ipv4.octets[3]).toString(16);
    embeddedIPv4 = {
      address: ipv4Address,
      groups: [firstGroup, secondGroup],
    };
    candidate = `${candidate.slice(0, separator + 1)}${firstGroup}:${secondGroup}`;
  }

  const firstCompression = candidate.indexOf('::');
  if (candidate.includes(':::') || firstCompression !== candidate.lastIndexOf('::')) {
    return { valid: false, reason: 'format' };
  }

  let parsedGroups: string[];
  let compressedZeroGroups = 0;
  if (firstCompression >= 0) {
    const [left, right] = candidate.split('::');
    const leftGroups = left ? left.split(':') : [];
    const rightGroups = right ? right.split(':') : [];
    const explicitGroups = leftGroups.length + rightGroups.length;
    if (explicitGroups >= 8) return { valid: false, reason: 'format' };
    compressedZeroGroups = 8 - explicitGroups;
    parsedGroups = [
      ...leftGroups,
      ...Array.from({ length: compressedZeroGroups }, () => '0'),
      ...rightGroups,
    ];
  } else {
    parsedGroups = candidate.split(':');
    if (parsedGroups.length !== 8) return { valid: false, reason: 'format' };
  }

  if (
    parsedGroups.length !== 8 ||
    parsedGroups.some((group) => !/^[0-9a-f]{1,4}$/i.test(group))
  ) {
    return { valid: false, reason: 'format' };
  }

  const groups = parsedGroups.map((group) => Number.parseInt(group, 16));
  return {
    valid: true,
    groups,
    expandedAddress: groups
      .map((group) => group.toString(16).padStart(4, '0'))
      .join(':'),
    compressedZeroGroups,
    embeddedIPv4,
  };
}

function ipv6ToInteger(groups: number[]): bigint {
  return groups.reduce((value, group) => (value << 16n) | BigInt(group), 0n);
}

function inIPv6Prefix(address: bigint, network: bigint, prefix: number): boolean {
  const hostBits = 128 - prefix;
  const mask =
    prefix === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << BigInt(hostBits)) - 1n);
  return (address & mask) === (network & mask);
}

function classifyIPv6(groups: number[], addressValue: bigint): IPv6Category {
  if (addressValue === 0n) {
    return { key: 'ipv6Unspecified', cidr: '::/128', scopeKey: 'scopeUnspecified' };
  }
  if (addressValue === 1n) {
    return { key: 'ipv6Loopback', cidr: '::1/128', scopeKey: 'scopeLoopback' };
  }
  if (inIPv6Prefix(addressValue, 0x00000000000000000000ffff00000000n, 96)) {
    return { key: 'ipv4Mapped', cidr: '::ffff:0:0/96', scopeKey: 'scopeSpecial' };
  }

  if (groups[0] >> 8 === 0xff) {
    const multicastScope = groups[0] & 0x000f;
    const multicastScopeKeys: Record<number, string> = {
      1: 'scopeInterfaceLocal',
      2: 'scopeLinkLocal',
      3: 'scopeRealmLocal',
      4: 'scopeAdminLocal',
      5: 'scopeSiteLocal',
      8: 'scopeOrganizationLocal',
      14: 'scopeGlobal',
    };
    return {
      key: 'ipv6Multicast',
      cidr: 'ff00::/8',
      scopeKey: multicastScopeKeys[multicastScope] ?? 'scopeReserved',
    };
  }
  if (inIPv6Prefix(addressValue, 0xfc000000000000000000000000000000n, 7)) {
    return { key: 'uniqueLocal', cidr: 'fc00::/7', scopeKey: 'scopeUniqueLocal' };
  }
  if (inIPv6Prefix(addressValue, 0xfe800000000000000000000000000000n, 10)) {
    return { key: 'linkLocal', cidr: 'fe80::/10', scopeKey: 'scopeLinkLocal' };
  }
  if (inIPv6Prefix(addressValue, 0x0064ff9b000100000000000000000000n, 48)) {
    return { key: 'nat64Local', cidr: '64:ff9b:1::/48', scopeKey: 'scopeSpecial' };
  }
  if (inIPv6Prefix(addressValue, 0x0064ff9b000000000000000000000000n, 96)) {
    return { key: 'nat64', cidr: '64:ff9b::/96', scopeKey: 'scopeSpecial' };
  }
  if (inIPv6Prefix(addressValue, 0x01000000000000000000000000000000n, 64)) {
    return { key: 'discardOnly', cidr: '100::/64', scopeKey: 'scopeSpecial' };
  }
  if (inIPv6Prefix(addressValue, 0x20010db8000000000000000000000000n, 32)) {
    return { key: 'documentation', cidr: '2001:db8::/32', scopeKey: 'scopeSpecial' };
  }
  if (inIPv6Prefix(addressValue, 0x3fff0000000000000000000000000000n, 20)) {
    return { key: 'documentation', cidr: '3fff::/20', scopeKey: 'scopeSpecial' };
  }
  if (inIPv6Prefix(addressValue, 0x20010000000000000000000000000000n, 32)) {
    return { key: 'teredo', cidr: '2001::/32', scopeKey: 'scopeSpecial' };
  }
  if (inIPv6Prefix(addressValue, 0x20010020000000000000000000000000n, 28)) {
    return { key: 'orchid', cidr: '2001:20::/28', scopeKey: 'scopeSpecial' };
  }
  if (inIPv6Prefix(addressValue, 0x20010000000000000000000000000000n, 23)) {
    return { key: 'protocolAssignment', cidr: '2001::/23', scopeKey: 'scopeSpecial' };
  }
  if (inIPv6Prefix(addressValue, 0x20020000000000000000000000000000n, 16)) {
    return { key: 'sixToFour', cidr: '2002::/16', scopeKey: 'scopeSpecial' };
  }
  if (addressValue < (1n << 32n)) {
    return { key: 'ipv4Compatible', cidr: '::/96', scopeKey: 'scopeSpecial' };
  }
  if (inIPv6Prefix(addressValue, 0x20000000000000000000000000000000n, 3)) {
    return { key: 'globalUnicast', cidr: '2000::/3', scopeKey: 'scopeGlobal' };
  }
  return { key: 'reservedIPv6', cidr: '', scopeKey: 'scopeReserved' };
}

export function analyzeIPv6(raw: string) {
  const address = raw.trim();
  const validation = validateIPv6(address);
  if (!validation.valid) throw new Error(validation.reason);

  const groups = validation.groups.map((value, index) => {
    const hexadecimal = value.toString(16).toUpperCase().padStart(4, '0');
    const binary = value.toString(2).padStart(16, '0');
    return {
      position: index + 1,
      decimal: value,
      hexadecimal,
      binary,
    };
  });
  const binary128 = groups.map((group) => group.binary).join('');
  const addressValue = ipv6ToInteger(validation.groups);
  const steps: IPv6ConversionStep[] = [];

  if (validation.embeddedIPv4) {
    steps.push({
      kind: 'embeddedIPv4',
      address: validation.embeddedIPv4.address,
      groups: validation.embeddedIPv4.groups
        .map((group) => group.toUpperCase().padStart(4, '0'))
        .join(':'),
    });
  }
  if (validation.compressedZeroGroups > 0) {
    steps.push({
      kind: 'expansion',
      address: validation.expandedAddress,
      zeroGroups: validation.compressedZeroGroups,
    });
  } else {
    steps.push({ kind: 'alreadyExpanded' });
  }
  steps.push(
    ...groups.map((group) => ({
      kind: 'group' as const,
      position: group.position,
      hexadecimal: group.hexadecimal,
      binary: group.binary,
    })),
    { kind: 'assemble' as const },
  );

  return {
    address,
    groups,
    expandedAddress: validation.expandedAddress,
    binary128,
    groupedBinary: groups.map((group) => group.binary).join(':'),
    hexadecimal: groups.map((group) => group.hexadecimal).join(''),
    decimal128: addressValue.toString(),
    category: classifyIPv6(validation.groups, addressValue),
    steps,
  };
}

export function extractIPv4Candidates(text: string): string[] {
  const matches = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) ?? [];
  return [...new Set(matches)].filter((candidate) => {
    try {
      analyzeIPv4(candidate);
      return true;
    } catch {
      return false;
    }
  });
}

export type IPCandidate = { address: string; version: 'ipv4' | 'ipv6' };

/** Extract only syntactically valid IP candidates from OCR text. Never auto-correct OCR digits. */
export function extractIPCandidates(text: string): IPCandidate[] {
  const candidates = new Map<string, IPCandidate>();
  // Handwritten dots are often recognized by OCR as commas or Arabic commas.
  // Normalize only a clear four-octet sequence; never guess or rewrite digits.
  const normalizedText = text.replace(
    /(^|[^\d.])(\d{1,3})\s*[,،;]\s*(\d{1,3})\s*[,،;]\s*(\d{1,3})\s*[,،;]\s*(\d{1,3})(?=$|[^\d.])/g,
    (_match, prefix: string, first: string, second: string, third: string, fourth: string) =>
      `${prefix}${first}.${second}.${third}.${fourth}`,
  );
  const ipv4Matches = [...normalizedText.matchAll(/(?:\d{1,3}\.){3}\d{1,3}/g)];
  for (const match of ipv4Matches) {
    const raw = match[0];
    const start = match.index ?? 0;
    const end = start + raw.length;
    // Do not report the embedded IPv4 tail of an IPv4-mapped IPv6 address as a second candidate.
    if (normalizedText[start - 1] === ':' || normalizedText[end] === ':') continue;
    const address = raw.replace(/^[^0-9]+|[^0-9]+$/g, '');
    if (validateIPv4(address).valid) candidates.set(address, { address, version: 'ipv4' });
  }

  // Tokenize OCR output without stripping meaningful IPv6 colons (notably :: and ::1).
  const tokens = normalizedText.split(/\s+/).map((token) => token.replace(/^[\[({<\"'`=]+|[\])}>\"',;!?`]+$/g, ''));
  for (const token of tokens) {
    const candidate = token.replace(/[.,;!?]+$/g, (suffix) => suffix.replace(/[.,;!?]/g, ''));
    if (!candidate.includes(':') || candidate.length > 45) continue;
    if (!validateIPv6(candidate).valid) continue;
    candidates.set(candidate, { address: candidate, version: 'ipv6' });
  }
  return [...candidates.values()];
}
