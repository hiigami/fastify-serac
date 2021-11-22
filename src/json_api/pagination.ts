import { QueryPagination, TopLevelLinks } from "../data/json_api";

function addPaginationToURL(url: string, paginationSize: number) {
  if (url.indexOf("?") === -1) {
    url += "?";
  }
  const m = url.match(/(page\[number\]=\d+)/);
  if (m === null) {
    if (!url.endsWith("?")) {
      url += "&";
    }
    url += "page[number]=0";
  }
  const m2 = url.match(/(page\[size\]=\d+)/);
  if (m2 === null) {
    url += `&page[size]=${paginationSize}`;
  }
  return url;
}

function replacePageNumber(url: string, page: number) {
  return url.replace(/page\[number\]=\d+/, `page[number]=${page}`);
}

function createPaginationLinks(
  last: number,
  url: string,
  pagination: QueryPagination
): TopLevelLinks {
  const prev =
    pagination.number > 0 && pagination.number <= last
      ? pagination.number - 1
      : null;
  const next =
    pagination.number > -1 && pagination.number < last
      ? pagination.number + 1
      : null;
  const links = {
    self: url,
    first: replacePageNumber(url, 0),
    last: replacePageNumber(url, last),
  } as TopLevelLinks;
  if (prev !== null) {
    links.prev = replacePageNumber(url, prev);
  }
  if (next !== null) {
    links.next = replacePageNumber(url, next);
  }
  return links;
}

function getPaginationLastPage(total: number, paginationSize: number): number {
  if (total === paginationSize) {
    return 0;
  }
  const t = total / paginationSize;
  return t % 1 === 0 ? t - 1 : Math.floor(t);
}

export function getPaginationLinks(
  total: number,
  url: string,
  pagination: QueryPagination
) {
  const last = getPaginationLastPage(total, pagination.size);
  const _url = addPaginationToURL(url, pagination.size);
  return createPaginationLinks(last, _url, pagination);
}
