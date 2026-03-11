export const isNearBottom = (el: HTMLElement, threshold = 80) => {
  const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
  return distanceFromBottom < threshold;
};

export const keepScrollPosition = (el: HTMLElement, prevScrollHeight: number) => {
  const newHeight = el.scrollHeight;
  el.scrollTop = newHeight - prevScrollHeight + el.scrollTop;
};
