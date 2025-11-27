import { generateKeyPairSync } from "node:crypto";

const generateNonEd25519KeyPair = () => {
  const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256",
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

const key = generateNonEd25519KeyPair();

console.log(`Public Key: ${key.publicKey}\n`);
console.log(`Private Key: ${key.privateKey}`);
