import type { PublicUser } from "../auth/session.js";

/**
 * Express-ийн `Request`-д `user` талбар нэмнэ.
 *
 * `requireAuth` middleware үүнийг бөглөнө. Хэрэв middleware ажиллаагүй
 * бол `undefined` байна — тиймээс заавал шалгана.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export {};
