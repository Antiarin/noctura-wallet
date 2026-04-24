export class ConfigError extends Error {
  readonly kind = "ConfigError" as const;
  constructor(public readonly missing: string[]) {
    super(`Missing configuration: ${missing.join(", ")}`);
    this.name = "ConfigError";
  }
}

export class ValidationError extends Error {
  readonly kind = "ValidationError" as const;
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = "ValidationError";
  }
}

export class PassKitError extends Error {
  readonly kind = "PassKitError" as const;
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly providerResponse?: unknown,
  ) {
    super(message);
    this.name = "PassKitError";
  }
}

export class GoogleWalletError extends Error {
  readonly kind = "GoogleWalletError" as const;
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly providerResponse?: unknown,
  ) {
    super(message);
    this.name = "GoogleWalletError";
  }
}

export type KnownError =
  | ConfigError
  | ValidationError
  | PassKitError
  | GoogleWalletError;

export function isKnownError(e: unknown): e is KnownError {
  return (
    e instanceof ConfigError ||
    e instanceof ValidationError ||
    e instanceof PassKitError ||
    e instanceof GoogleWalletError
  );
}
