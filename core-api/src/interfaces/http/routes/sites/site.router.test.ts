import { describe, expect, it } from "vitest";
import supertest from "supertest";
import { app } from "../../app.ts";
import { CreateSiteInput } from "../../../../core/sites/site.types.ts";

const request = supertest(app);

describe("HTTP: POST /api/v1/sites", () => {
  const defaultInput: CreateSiteInput = {
    siteName: "Tucson ICC",
    siteUrl: "https://ticc.org",
    adminEmail: "pastor@usd21.org",
    publicKey: "-----BEGIN PUBLIC KEY-----\n" +
      "MCowBQYDK2VwAyEAB3R5kkC5Xq0AHmkEA8wpfJ0YG56Psf/jPB1I0ioq/5I=\n" +
      "-----END PUBLIC KEY-----",
    adapterMetadata: {
      version: "1.0.0",
    },
  };

  it("should return 201 Created on success", async () => {
    const response = await request.post("/api/v1/sites").send(defaultInput);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("active"); // Since it's @usd21.org
  });

  it("should return 400 Bad Request if validation fails", async () => {
    const badInput = {
      ...defaultInput,
      siteUrl: "different url",
      adminEmail: "not-an-email",
    };

    const response = await request.post("/api/v1/sites").send(badInput);

    expect(response.status).toBe(400);
  });

  it("should return 409 Conflict if site already exists", async () => {
    await request.post("/api/v1/sites").send(defaultInput);

    const response = await request.post("/api/v1/sites").send(defaultInput);

    expect(response.status).toBe(409);
    expect(response.body.error).toBe("SiteAlreadyExistsError");
  });
});
