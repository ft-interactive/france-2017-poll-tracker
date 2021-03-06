import markdownIt from 'markdown-it';
import removeMarkdown from 'remove-markdown';
import { utcFormat } from 'd3-time-format';
import nunjucks from 'nunjucks';
import he from 'he';

export { default as slugify } from 'slugify';
const SafeString = nunjucks.runtime.SafeString;

const formatterCache = new Map();
const defaultFTDateFormat = '%A, %-e %B %Y';

// export function slugify(text) {
//   return slug(text);
// }

export function isotime(date) {
  if (!date) {
    return '';
  } else if (!(date instanceof Date)) {
    return date;
  }

  return date.toISOString();
}

// strftime format docs: https://github.com/d3/d3-time-format
export function strftime(_date, format = defaultFTDateFormat) {
  const date = new Date(_date);

  if (!date) {
    return '';
  } else if (!(date instanceof Date)) {
    return date;
  }

  if (formatterCache.has(format)) {
    return formatterCache.get(format)(date);
  }

  const fm = utcFormat(format);
  formatterCache.set(format, fm);
  return fm(date);
}

export function ftdate(d) {
  return strftime(d);
}

const markdown = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

export function md(str, inline) {
  return !str ? '' :
    new SafeString(inline ? markdown.renderInline(str) : markdown.render(str));
}

export function plain(str, stripListLeaders = true) {
  return removeMarkdown(str, { stripListLeaders, gfm: true });
}

export function json(o, prop) {
  try {
    return new SafeString(
      JSON.stringify(prop ? o[prop] : o).replace(/<\/script/g, '\\x3C/script'),
    );
  } catch (e) {
    return '';
  }
}

export function inlineScriptElement(o, name) {
  return new SafeString(
    `<script>;(function(){window.${name}=${json(o)};}());</script>`,
  );
}

export function jsonScriptElement(o, id, attr) {
  const idAttr = id ? ` id="${id}"` : '';
  return new SafeString(
    `<script type="application/json"${idAttr} ${attr}>${json(o)}</script>`,
  );
}

export function encodedJSON(str) {
  try {
    return encodeURIComponent(
      JSON.stringify(JSON.parse(str || ''), null, ''),
    );
  } catch (e) {
    return '';
  }
}

export function spoorTrackingPixel(str) {
  const jsonString = encodedJSON(str.trim());
  const img = `<img src="https://spoor-api.ft.com/px.gif?data=${jsonString}" height="1" width="1" />`;
  return new SafeString(
  `<!--[if lt IE 9]>
  ${img}
  <![endif]-->
  <noscript data-o-component="o-tracking">${img}</noscript>`,
  );
}

// converts any URL to an Image Service URL (with the given query params)
// - see https://www.ft.com/__origami/service/image/v2/docs/api for options
export const imageServiceUrl = (url, queryParams = {}) => {
  const queryString = Object.keys(queryParams)
    .map(name => `${encodeURIComponent(name)}=${encodeURIComponent(queryParams[name])}`)
    .join('&')
  ;

  return `https://www.ft.com/__origami/service/image/v2/images/raw/${encodeURIComponent(url)}?source=ig&${queryString}`;
};

// converts any URL to an `srcset` string containing *multiple* Image Service
// URLs respecting the given widths
export const imageServiceSrcset = (url, widths, queryParams) => widths.map(width =>
  `${imageServiceUrl(url, { ...queryParams, width })} ${width}w`,
).join(', ');

// returns the largest item in an array of numbers
export const arrayMax = array => Math.max(...array);

// Get an item from an object. Useful when combined with `set` and `first()`.
export const get = (obj, prop) => obj[prop];

// replace spaces with '&nbsp;'
export const noBreak = string => new SafeString(he.encode(string).split(' ').join('&nbsp'));

export const numberWithCommas = (x) => {
  const parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};
