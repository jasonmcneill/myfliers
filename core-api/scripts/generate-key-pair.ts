import { generateEd25519KeyPair, KeyPair } from "../src/core/common/crypto.ts"

const keys: KeyPair = generateEd25519KeyPair();

console.log("public key: %s", keys.publicKey);
console.log("private key: %s", keys.privateKey);
