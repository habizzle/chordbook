const ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

const templateMarker = Symbol('templateResult');

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);

export const raw = (value) => ({__raw: String(value ?? '')});

const interpolate = (value) => {
    if (value === null || value === undefined || value === false) {
        return '';
    }
    if (typeof value === 'object' && templateMarker in value) {
        return value[templateMarker];
    }
    if (typeof value === 'object' && '__raw' in value) {
        return value.__raw;
    }
    if (Array.isArray(value)) {
        return value.map(interpolate).join('');
    }
    return esc(value);
};

export const html = (strings, ...values) => {
    let content = '';
    strings.forEach((part, index) => {
        content += part;
        if (index < values.length) {
            content += interpolate(values[index]);
        }
    });
    return {
        [templateMarker]: content,
        toString: () => content,
    };
};
