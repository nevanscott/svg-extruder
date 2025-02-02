import paper from "paper";

/**
 * Extracts the segment of a Paper.js path between two points.
 * If `reverseLonger` is true, returns the opposite path instead.
 */
export function extractSegment(path, start, end, reverseLonger = false) {
  if (!path || path.segments.length < 2) return null;

  let startPoint = new paper.Point(start.x, start.y);
  let endPoint = new paper.Point(end.x, end.y);

  let startOffset = path.getOffsetOf(startPoint);
  let endOffset = path.getOffsetOf(endPoint);

  if (isNaN(startOffset)) {
    startPoint = path.getNearestPoint(startPoint);
    startOffset = path.getOffsetOf(startPoint);
  }
  if (isNaN(endOffset)) {
    endPoint = path.getNearestPoint(endPoint);
    endOffset = path.getOffsetOf(endPoint);
  }

  if (isNaN(startOffset) || isNaN(endOffset)) return null;

  const totalLength = path.length;
  let shortSegment, longSegment;

  if (startOffset < endOffset) {
    shortSegment = path
      .clone()
      .splitAt(startOffset)
      .splitAt(endOffset - startOffset);
    longSegment = path
      .clone()
      .splitAt(endOffset)
      .splitAt(totalLength - endOffset + startOffset);
  } else {
    shortSegment = path
      .clone()
      .splitAt(endOffset)
      .splitAt(startOffset - endOffset);
    longSegment = path
      .clone()
      .splitAt(startOffset)
      .splitAt(totalLength - startOffset + endOffset);
  }

  return reverseLonger ? longSegment : shortSegment;
}
