exports.__esModule = true;

const Ajv = require('ajv').default
//console.log(Ajv);
//require("ajv-formats")(Ajv)
const openApiSchemaToJson = require('@openapi-contrib/openapi-schema-to-json-schema')
const $RefParser = require("@apidevtools/json-schema-ref-parser");

const v = new Ajv({
  useDefaults: true,
  strict: false,
  unknownFormats: 'ignore',
  allErrors: true,
  logger: false
});

function Validator(schema) {
  const parser = new $RefParser()
  // deref
  const dereferencedSchema = parser.dereference(schema)

  return {
    async validateResponse(response, endpointInSchema, methodName, statusCode = 'default') {
      const baseSchema = await dereferencedSchema;
      //console.log('schema output', baseSchema)
      //console.log('endpointInSchema', endpointInSchema)
      const targetSpec = baseSchema.paths[endpointInSchema][methodName.toLowerCase()]
      .responses[statusCode]
      //console.log('targetSpec', targetSpec)

      // normalize responses. get into the schema part
      const responseSchema = getResponseSchema(targetSpec)
      const jsonSchema = openApiSchemaToJson(responseSchema)
      delete jsonSchema.$schema
     // console.log(JSON.stringify(jsonSchema))
      const validator = v.compile(jsonSchema)

      const isValid = validator(response);
      //console.log('isValid', isValid)
      if (!isValid) {
          return {
              message: 'The response was not valid.',
              errors: validator.errors.map(toOpenapiValidationError)
          };
      }
      return undefined;
    }
  }
}

function getResponseSchema(response) {
  if (response) {
      if (typeof response.schema === 'object') {
          return response.schema
      }
          
      if (typeof response.content === 'object' ) {
          var firstContentKey = Object.keys(response.content)[0]
          //console.log('firstContentKey', firstContentKey)
          if (typeof response.content[firstContentKey] === 'object' 
              && typeof response.content[firstContentKey].schema === 'object')
              return response.content[firstContentKey].schema
      }

      // handle $ref. Shouldn't this be handled transparently?
      console.log('here')
      return response
  } 
  console.log('should not be here', response)
  return { type: 'null' }
  
}

function toOpenapiValidationError(error) {
  console.log('error', error)
  let validationError = {
      path: "instance" + error.dataPath,
      errorCode: error.keyword + ".openapi.responseValidation",
      message: error.message
  };
  validationError.path = validationError.path.replace(/^instance\.(?:response\.)?/, '');
  return validationError;
}

exports['default'] = Validator