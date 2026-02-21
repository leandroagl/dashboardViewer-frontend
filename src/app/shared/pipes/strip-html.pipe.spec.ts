import { StripHtmlPipe } from './strip-html.pipe';

describe('StripHtmlPipe', () => {
  let pipe: StripHtmlPipe;

  beforeEach(() => {
    pipe = new StripHtmlPipe();
  });

  it('returns empty string for empty input', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('returns empty string for null-like input', () => {
    expect(pipe.transform(null as unknown as string)).toBe('');
    expect(pipe.transform(undefined as unknown as string)).toBe('');
  });

  it('strips simple HTML tags', () => {
    expect(pipe.transform('<p>Hola mundo</p>')).toBe('Hola mundo');
  });

  it('strips nested tags', () => {
    expect(pipe.transform('<div><strong>texto</strong> <em>más</em></div>')).toBe('texto más');
  });

  it('decodes HTML entities', () => {
    expect(pipe.transform('&lt;b&gt;no es tag&lt;/b&gt;')).toBe('<b>no es tag</b>');
  });

  it('returns plain text unchanged', () => {
    expect(pipe.transform('sin etiquetas')).toBe('sin etiquetas');
  });

  it('neutralizes script injection (XSS)', () => {
    const result = pipe.transform('<script>alert("xss")</script>contenido');
    expect(result).not.toContain('<script>');
    expect(result).toContain('contenido');
  });
});
