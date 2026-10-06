import {describe, it, expect} from 'vitest';
import {esc, html, raw} from '../src/html.js';

describe('esc', () => {
    it('escapes html special characters', () => {
        expect(esc('<script>alert("xss")</script>'))
            .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
        expect(esc("'&")).toBe('&#39;&amp;');
        expect(esc(null)).toBe('');
        expect(esc(5)).toBe('5');
    });
});

describe('html', () => {
    it('escapes interpolated values', () => {
        const title = '<script>alert(1)</script>';
        const result = String(html`<h2>${title}</h2>`);
        expect(result).toBe('<h2>&lt;script&gt;alert(1)&lt;/script&gt;</h2>');
    });

    it('keeps static markup intact', () => {
        expect(String(html`<p class="x">plain</p>`)).toBe('<p class="x">plain</p>');
    });

    it('does not double-escape nested templates', () => {
        const inner = html`<b>${'a<b'}</b>`;
        const outer = String(html`<div>${inner}</div>`);
        expect(outer).toBe('<div><b>a&lt;b</b></div>');
    });

    it('escapes array elements individually', () => {
        const result = String(html`<ul>${['<i>', html`<li>${'x&y'}</li>`]}</ul>`);
        expect(result).toBe('<ul>&lt;i&gt;<li>x&amp;y</li></ul>');
    });

    it('renders null, undefined and false as empty', () => {
        expect(String(html`<p>${null}${undefined}${false}</p>`)).toBe('<p></p>');
    });

    it('renders numbers', () => {
        expect(String(html`<span>${0}</span>`)).toBe('<span>0</span>');
    });

    it('passes raw values through unescaped', () => {
        expect(String(html`<div>${raw('<b>trusted</b>')}</div>`)).toBe('<div><b>trusted</b></div>');
    });

    it('coerces to string for innerHTML-style assignment', () => {
        const result = html`<p>${'a&b'}</p>`;
        expect(`${result}`).toBe('<p>a&amp;b</p>');
    });
});
