import PriceValidator from "../validators/PriceValidator.js";
import GPSValidator from "../validators/GPSValidator.js";
import AddressValidator from "../validators/AddressValidator.js";
import DuplicateValidator from "../validators/DuplicateValidator.js";

class ValidatorEngine {
  constructor() {
    this.validators = [
      new PriceValidator(),
      new GPSValidator(),
      new AddressValidator(),
      new DuplicateValidator(),
    ];
  }

  validate(records) {
    const report = {
      success: true,
      validators: {},
      invalidRecords: 0,
    };

    for (const validator of this.validators) {
      const result = validator.validate(records);

      report.validators[validator.constructor.name] = result;

      if (result?.success === false) {
        report.success = false;
      }

      report.invalidRecords += result.invalid?.length ?? 0;
    }

    return report;
  }
}

export default new ValidatorEngine();
