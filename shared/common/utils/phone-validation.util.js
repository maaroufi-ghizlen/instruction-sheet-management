"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMON_COUNTRY_CODES = void 0;
exports.IsPhoneNumber = IsPhoneNumber;
exports.isValidPhoneNumber = isValidPhoneNumber;
exports.formatPhoneNumber = formatPhoneNumber;
exports.extractCountryCode = extractCountryCode;
exports.isValidPhoneNumberForCountry = isValidPhoneNumberForCountry;
const class_validator_1 = require("class-validator");
function IsPhoneNumber(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            name: 'isPhoneNumber',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value, args) {
                    return typeof value === 'string' && isValidPhoneNumber(value);
                },
                defaultMessage(args) {
                    return `${args.property} must be a valid phone number`;
                },
            },
        });
    };
}
function isValidPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
    const internationalPattern = /^\+[1-9]\d{1,14}$/;
    const northAmericaPattern = /^[2-9]\d{2}[2-9]\d{2}\d{4}$/;
    const localPattern = /^\d{7,15}$/;
    return (internationalPattern.test(cleaned) ||
        northAmericaPattern.test(cleaned) ||
        localPattern.test(cleaned));
}
function formatPhoneNumber(phone, format = 'international') {
    if (!phone)
        return '';
    const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
    if (format === 'international' && cleaned.startsWith('+')) {
        return cleaned;
    }
    if (format === 'national' && cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
}
function extractCountryCode(phone) {
    const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
    if (!cleaned.startsWith('+')) {
        return null;
    }
    const match = cleaned.match(/^\+(\d{1,3})/);
    return match ? match[1] : null;
}
exports.COMMON_COUNTRY_CODES = {
    US: '1',
    CA: '1',
    UK: '44',
    FR: '33',
    DE: '49',
    IT: '39',
    ES: '34',
    AU: '61',
    JP: '81',
    CN: '86',
    IN: '91',
    BR: '55',
    MX: '52',
    TN: '216',
};
function isValidPhoneNumberForCountry(phone, countryCode) {
    const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
    if (cleaned.startsWith(`+${countryCode}`)) {
        return isValidPhoneNumber(phone);
    }
    return false;
}
//# sourceMappingURL=phone-validation.util.js.map