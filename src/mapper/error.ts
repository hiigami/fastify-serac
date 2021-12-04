import { ErrorCode, ErrorTitle } from "../data/enumeration";

export function getPrismaCodeToErrorArgs() {
  return new Map([
    [
      "P2000",
      {
        status: 409,
        code: ErrorCode.Validation,
        title: ErrorTitle.Integrity,
      },
    ],
    [
      "P2001",
      {
        status: 404,
        code: ErrorCode.ResourceNotFound,
        title: ErrorTitle.NotFound,
      },
    ],
    [
      "P2002",
      {
        status: 409,
        code: ErrorCode.Validation,
        title: ErrorTitle.Duplicated,
      },
    ],
    [
      "P2003",
      {
        status: 409,
        code: ErrorCode.Validation,
        title: ErrorTitle.Integrity,
      },
    ],
    [
      "P2004",
      {
        status: 409,
        code: ErrorCode.Validation,
        title: ErrorTitle.Integrity,
      },
    ],
    [
      "P2005",
      {
        status: 400,
        code: ErrorCode.Validation,
        title: ErrorTitle.Validation,
      },
    ],
    [
      "P2011",
      {
        status: 400,
        code: ErrorCode.Validation,
        title: ErrorTitle.Validation,
      },
    ],
    [
      "P2012",
      {
        status: 400,
        code: ErrorCode.Validation,
        title: ErrorTitle.Validation,
      },
    ],
    [
      "P2013",
      {
        status: 400,
        code: ErrorCode.Validation,
        title: ErrorTitle.Validation,
      },
    ],
    [
      "P2014",
      {
        status: 409,
        code: ErrorCode.Validation,
        title: ErrorTitle.Validation,
      },
    ],
    [
      "P2025",
      {
        status: 404,
        code: ErrorCode.ResourceNotFound,
        title: ErrorTitle.NotFound,
      },
    ],
    [
      "P2025",
      {
        status: 404,
        code: ErrorCode.ResourceNotFound,
        title: ErrorTitle.NotFound,
      },
    ],
  ]);
}
