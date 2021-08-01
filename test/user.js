const OpenAPIResponseValidator = require("../lib/openapi-response-validator").default;
const swaggerJson = require("../schemas/user.json");
const expect = require("chai").expect;
describe("USER", () => {
  it("USER has correct schema", async () => {
    const responseValidator = new OpenAPIResponseValidator(swaggerJson);
    const someResource = require("../fixtures/user.json");
    const validationError = await responseValidator.validateResponse(
      someResource,
      "/api/users?page=2",
      'get',
      200
    );
    expect(validationError, `actual: ${JSON.stringify(validationError)}`).to.be.undefined;
  });
});

