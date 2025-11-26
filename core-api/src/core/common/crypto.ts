import { Buffer } from "node:buffer";
import { createPublicKey, generateKeyPairSync, verify } from "node:crypto";

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

export const isValidPublicKey = (pem: string): boolean => {
  try {
    const keyObject = createPublicKey(pem);
    return keyObject.asymmetricKeyType === "ed25519";
  } catch (_error) {
    return false;
  }
};

export const verifySignature = (
  data: string | object,
  signature: string,
  publicKeyPem: string,
): boolean => {
  try {
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    const key = createPublicKey(publicKeyPem);

    return verify(
      null,
      Buffer.from(payload),
      key,
      Buffer.from(signature, "hex"),
    );
  } catch (_error) {
    return false;
  }
};
