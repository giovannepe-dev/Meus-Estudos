declare module 'qz-tray' {
  const qz: {
    websocket: {
      connect: (options?: { host?: string | string[]; port?: { secure?: number[]; insecure?: number[] }; usingSecure?: boolean; keepAlive?: number; retries?: number; delay?: number }) => Promise<void>;
      disconnect: () => Promise<void>;
      isActive: () => boolean;
    };
    printers: {
      find: (query?: string) => Promise<string | string[]>;
      getDefault: () => Promise<string>;
    };
    configs: {
      create: (printer: string, options?: any) => any;
    };
    print: (config: any, data: any[]) => Promise<void>;
    security: {
      setCertificatePromise: (fn: (...args: any[]) => any) => void;
      setSignatureAlgorithm: (algo: string) => void;
      setSignaturePromise: (fn: (...args: any[]) => any) => void;
    };
  };
  export default qz;
}
