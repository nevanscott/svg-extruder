import { JSDOM } from "jsdom";

const isNode = typeof window === "undefined";

let parseSvg, serializeSvg, createSvgElement, cloneElement, removeElements;

// Shared Namespace
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

if (isNode) {
  // Node.js Environment
  parseSvg = (svg) => {
    const dom = new JSDOM(svg, { contentType: "image/svg+xml" });
    const doc = dom.window.document;
    const svgElement = doc.querySelector("svg");
    return { dom, doc, svgElement };
  };

  serializeSvg = (docOrDom) => {
    if (docOrDom.defaultView) {
      return docOrDom.defaultView.document.documentElement.outerHTML;
    }
    return docOrDom.serialize(); // Use the original `dom` if passed directly
  };

  createSvgElement = (doc, tagName, attributes = {}) => {
    const element = doc.createElementNS(SVG_NAMESPACE, tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  };

  cloneElement = (element) => element.cloneNode(true);

  removeElements = (doc, selector) => {
    doc.querySelectorAll(selector).forEach((el) => el.remove());
  };
} else {
  // Browser Environment
  parseSvg = (svg) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const svgElement = doc.querySelector("svg");
    return { doc, svgElement };
  };

  serializeSvg = (doc) => new XMLSerializer().serializeToString(doc);

  createSvgElement = (doc, tagName, attributes = {}) => {
    const element = doc.createElementNS(SVG_NAMESPACE, tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  };

  cloneElement = (element) => element.cloneNode(true);

  removeElements = (doc, selector) => {
    doc.querySelectorAll(selector).forEach((el) => el.remove());
  };
}

export {
  isNode,
  SVG_NAMESPACE,
  parseSvg,
  serializeSvg,
  createSvgElement,
  cloneElement,
  removeElements,
};
