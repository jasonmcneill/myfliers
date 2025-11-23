import { generateKeyPairSync } from "node:crypto";

export type KeyPair = {
  publicKey: string;
  privateKey: string;
};

export const generateEd25519KeyPair = (): KeyPair => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { publicKey, privateKey };
};
