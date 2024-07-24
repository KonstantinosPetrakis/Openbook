/**
 * This function converts a camelCase text to a title case text.
 * @param {string} camelCaseText the camelCase text to convert.
 * @returns {string} the title case text.
 */
export function camelToTitle(camelCaseText) {
    return camelCaseText
        .replace(/([A-Z])/g, (match) => ` ${match}`)
        .replace(/^./, (match) => match.toUpperCase())
        .trim();
}

/**
 * This function checks if a given email is valid.
 * @param {string} email the email to check.
 * @returns {boolean} true if the email is valid, false otherwise.
 */
export function isEmailValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * This function returns a debounced version of a function.
 * @param {Function} func the original function.
 * @param {number} timeout for how long to wait before calling the function.
 * @returns {Function} the new asynchronous and debounced function.
 */
export function debounce(func, timeout = 500) {
    let timer;

    return (...args) => {
        return new Promise((resolve, reject) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                try {
                    let output = func(...args);
                    resolve(output);
                } catch (err) {
                    reject(err);
                }
            }, timeout);
        });
    };
}

/**
 * This function shows a time difference in a human readable format.
 * @param {Date} d1 the first date.
 * @param {Date} d2 the second date.
 * @returns {string} the time difference in a human readable format.
 */
export function timeDifference(d1, d2 = new Date()) {
    let units = {
        year: 24 * 60 * 60 * 1000 * 365,
        month: (24 * 60 * 60 * 1000 * 365) / 12,
        day: 24 * 60 * 60 * 1000,
        hour: 60 * 60 * 1000,
        minute: 60 * 1000,
        second: 1000,
    };

    let rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    let elapsed = d1 - d2;

    if (Math.abs(elapsed) < units.minute) return rtf.format(0, "second");

    for (let u in units)
        if (Math.abs(elapsed) > units[u] || u == "second")
            return rtf.format(Math.round(elapsed / units[u]), u);
}
