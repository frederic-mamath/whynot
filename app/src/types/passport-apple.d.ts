declare module "passport-apple" {
  import { Strategy as PassportStrategy } from "passport";

  interface AppleStrategyOptions {
    clientID: string;
    teamID: string;
    keyID: string;
    privateKeyLocation?: string;
    privateKeyString?: string;
    callbackURL: string;
    passReqToCallback?: boolean;
    scope?: string[];
    authorizationURL?: string;
    tokenURL?: string;
  }

  class Strategy extends PassportStrategy {
    constructor(
      options: AppleStrategyOptions,
      verify: (...args: any[]) => void,
    );
    name: string;
  }

  export default Strategy;
}
