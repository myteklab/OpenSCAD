// Customizer: parse OpenSCAD source for customizable parameters.
// Uses the same annotation format as the OpenSCAD Customizer / Thingiverse:
//
//   /* [Section Name] */
//   // description shown under the control
//   width = 10;        // [5:50]        slider
//   height = 2.5;      // [0:0.5:10]    slider with step
//   count = 4;         // [12]          slider 0..12
//   size = "M";        // [S, M, L]     dropdown
//   style = 10;        // [10:Small, 20:Big]  dropdown with labels
//   rounded = true;    //               checkbox
//   name = "Ada";      //               text field
//   /* [Hidden] */                      everything below is hidden
//
// Only top-level literal assignments before the first module/function
// definition are customizable. Pure functions over source text; no DOM.

// Matches: name = <rest of line>
const ASSIGN_RE = /^(\s*)([A-Za-z_$][A-Za-z0-9_]*)\s*=\s*(.*)$/;
const SECTION_RE = /^\s*\/\*\s*\[(.+?)\]\s*\*\/\s*$/;
const STOP_RE = /^\s*(module|function)\s/;
const NUMBER_RE = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;

// Parse the literal value at the start of `text` (the part after "=").
// Returns {type, value, raw, length} or null if not a supported literal.
function parseLiteral(text) {
  // String literal
  if (text[0] === '"') {
    for (let i = 1; i < text.length; i++) {
      if (text[i] === '\\') { i++; continue; }
      if (text[i] === '"') {
        const raw = text.slice(0, i + 1);
        return { type: 'string', value: raw.slice(1, -1).replace(/\\(.)/g, '$1'), raw, length: raw.length };
      }
    }
    return null; // unterminated
  }
  // Boolean
  const boolMatch = /^(true|false)\b/.exec(text);
  if (boolMatch) {
    return { type: 'boolean', value: boolMatch[1] === 'true', raw: boolMatch[1], length: boolMatch[1].length };
  }
  // Number
  const numMatch = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/.exec(text);
  if (numMatch && NUMBER_RE.test(numMatch[0])) {
    return { type: 'number', value: parseFloat(numMatch[0]), raw: numMatch[0], length: numMatch[0].length };
  }
  return null;
}

// Parse a trailing annotation comment like "[5:50]" or "[S, M, L]".
// Returns {} when there is no usable annotation.
function parseAnnotation(comment, valueType) {
  if (!comment) return {};
  const m = /\[([^\]]*)\]/.exec(comment);
  if (!m) return {};
  const inner = m[1].trim();
  if (!inner) return {};

  if (inner.includes(',')) {
    // Option list: "a, b, c" or "10:Small, 20:Big"
    const options = inner.split(',').map(part => {
      const p = part.trim();
      const colon = p.indexOf(':');
      if (colon > 0 && valueType !== 'string') {
        const v = p.slice(0, colon).trim();
        const label = p.slice(colon + 1).trim();
        if (NUMBER_RE.test(v)) return { value: parseFloat(v), label };
      }
      if (colon > 0 && valueType === 'string') {
        return { value: p.slice(0, colon).trim(), label: p.slice(colon + 1).trim() };
      }
      return { value: valueType === 'number' && NUMBER_RE.test(p) ? parseFloat(p) : p, label: p };
    });
    return { options };
  }

  if (valueType === 'number') {
    const parts = inner.split(':').map(s => s.trim());
    if (parts.length === 1 && NUMBER_RE.test(parts[0])) {
      return { min: 0, max: parseFloat(parts[0]) };
    }
    if (parts.length === 2 && parts.every(p => NUMBER_RE.test(p))) {
      return { min: parseFloat(parts[0]), max: parseFloat(parts[1]) };
    }
    if (parts.length === 3 && parts.every(p => NUMBER_RE.test(p))) {
      return { min: parseFloat(parts[0]), step: parseFloat(parts[1]), max: parseFloat(parts[2]) };
    }
  }
  return {};
}

// Parse source text for customizable parameters.
// Returns { parameters: [...], sections: [...] }. Each parameter:
//   { name, type, value, raw, line (1-based), valueStart, valueEnd (0-based cols),
//     section, description, min, max, step, options }
export function parseParameters(source) {
  const lines = source.split('\n');
  const parameters = [];
  const sections = [];
  let section = null;
  let description = null;
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false;
      description = null;
      continue;
    }

    const sectionMatch = SECTION_RE.exec(line);
    if (sectionMatch) {
      section = sectionMatch[1].trim();
      if (section !== 'Hidden' && !sections.includes(section)) sections.push(section);
      description = null;
      continue;
    }

    // Block comment opening (that is not a section header)
    const trimmed = line.trim();
    if (trimmed.startsWith('/*')) {
      if (!line.slice(line.indexOf('/*') + 2).includes('*/')) inBlockComment = true;
      description = null;
      continue;
    }

    if (STOP_RE.test(line)) break;

    // Standalone comment line: remember as description for the next assignment
    if (trimmed.startsWith('//')) {
      description = trimmed.replace(/^\/\/\s?/, '').trim() || null;
      continue;
    }

    if (trimmed === '') { description = null; continue; }

    const assign = ASSIGN_RE.exec(line);
    if (!assign) { description = null; continue; }

    const [, indent, name, rest] = assign;
    const literal = parseLiteral(rest);
    if (literal) {
      const afterLiteral = rest.slice(literal.length);
      const semi = /^\s*;/.exec(afterLiteral);
      if (semi) {
        const afterSemi = afterLiteral.slice(semi[0].length);
        const commentMatch = /\/\/\s*(.*)$/.exec(afterSemi);
        const valueStart = line.length - rest.length;
        const param = {
          name,
          type: literal.type,
          value: literal.value,
          raw: literal.raw,
          line: i + 1,
          valueStart,
          valueEnd: valueStart + literal.length,
          section,
          description,
          ...parseAnnotation(commentMatch ? commentMatch[1] : null, literal.type),
        };
        if (section !== 'Hidden') parameters.push(param);
      }
    }
    description = null;
  }

  return { parameters, sections };
}

// Format a JS value as OpenSCAD source for a parameter of the given type.
export function formatValue(type, value) {
  if (type === 'string') return '"' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  if (type === 'boolean') return value ? 'true' : 'false';
  // Number: trim float noise (0.30000000000000004 -> 0.3)
  const n = Number(value);
  if (Number.isInteger(n)) return String(n);
  return String(parseFloat(n.toFixed(6)));
}

// Decimal places implied by a step value, for slider readouts.
export function stepDecimals(step) {
  if (!step || Number.isInteger(step)) return 0;
  const s = String(step);
  const dot = s.indexOf('.');
  return dot === -1 ? 0 : s.length - dot - 1;
}
