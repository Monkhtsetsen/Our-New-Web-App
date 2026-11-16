function validateNumbers(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('Тоо оруулах шаардлагатай!');
    }
}

function sum(a, b) {
    validateNumbers(a, b);
    return a + b;
}

module.exports = sum;